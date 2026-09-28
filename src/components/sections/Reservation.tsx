'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { DayPicker } from 'react-day-picker'
import { format, addDays, startOfToday } from 'date-fns'
import { de, enGB } from 'date-fns/locale'
import 'react-day-picker/style.css'
import TimeSlotPicker, { Slot } from '@/components/ui/TimeSlotPicker'

type FormState = {
  name: string
  party_size: string
  email: string
  phone: string
  notes: string
}

type ConfirmedBooking = {
  date: Date
  slotLabel: string
  party_size: number
  email: string
  name: string
}

type FormErrors = Partial<Record<'name' | 'email' | 'phone', string>>
type AvailabilityCacheEntry = { slots: Slot[]; fetchedAt: number }

const AVAILABILITY_CACHE_TTL_MS = 30_000

const initialForm: FormState = {
  name: '',
  party_size: '2',
  email: '',
  phone: '',
  notes: '',
}

function getNextBookableDate(today: Date) {
  const tomorrow = addDays(today, 1)
  return tomorrow.getDay() === 1 ? addDays(tomorrow, 1) : tomorrow
}

export default function Reservation() {
  const t = useTranslations('reservation')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? enGB : de
  const fullDateFormat = locale === 'en' ? 'EEEE, d MMMM' : 'EEEE, d. MMMM'
  const today = startOfToday()
  const maxDate = addDays(today, 30)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    getNextBookableDate(today)
  )
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0)
  const [step, setStep] = useState<'table' | 'details'>('table')
  const [form, setForm] = useState<FormState>(initialForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availabilityFailed, setAvailabilityFailed] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const availabilityCacheRef = useRef(new Map<string, AvailabilityCacheEntry>())
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const detailsNameRef = useRef<HTMLInputElement>(null)
  const detailsEmailRef = useRef<HTMLInputElement>(null)
  const detailsPhoneRef = useRef<HTMLInputElement>(null)
  const partySizeRef = useRef<HTMLSelectElement>(null)
  const focusTableOnReturnRef = useRef(false)

  useEffect(() => {
    if (confirmed) successHeadingRef.current?.focus()
  }, [confirmed])

  useEffect(() => {
    if (step === 'details') detailsNameRef.current?.focus()
    if (step === 'table' && focusTableOnReturnRef.current) {
      focusTableOnReturnRef.current = false
      partySizeRef.current?.focus()
    }
  }, [step])

  useEffect(() => {
    if (!selectedDate) return

    const date = selectedDate
    const dateKey = format(date, 'yyyy-MM-dd')
    const cached = availabilityCacheRef.current.get(dateKey)
    if (cached && Date.now() - cached.fetchedAt < AVAILABILITY_CACHE_TTL_MS) {
      setSlots(cached.slots)
      setAvailabilityFailed(false)
      setLoadingSlots(false)
      return
    }
    availabilityCacheRef.current.delete(dateKey)

    const controller = new AbortController()
    abortRef.current = controller

    async function loadAvailability() {
      setLoadingSlots(true)
      setAvailabilityFailed(false)
      try {
        const res = await fetch(`/api/availability?date=${dateKey}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to load availability')
        const data = await res.json()
        const availableSlots = data.slots ?? []
        availabilityCacheRef.current.set(dateKey, {
          slots: availableSlots,
          fetchedAt: Date.now(),
        })
        setSlots(availableSlots)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setSlots([])
        setAvailabilityFailed(true)
        setError(t('error'))
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false)
      }
    }

    void loadAvailability()
    return () => controller.abort()
  }, [availabilityRefresh, selectedDate, t])

  function handleDateSelect(date: Date | undefined) {
    abortRef.current?.abort()
    if (date) {
      const cached = availabilityCacheRef.current.get(format(date, 'yyyy-MM-dd'))
      if (cached && Date.now() - cached.fetchedAt < AVAILABILITY_CACHE_TTL_MS) {
        setSlots(cached.slots)
        setLoadingSlots(false)
      } else {
        setSlots([])
        setLoadingSlots(true)
      }
    }
    setSelectedDate(date)
    setSelectedSlotId(null)
    setStep('table')
    setAvailabilityFailed(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlotId) return
    const slot = slots.find((s) => s.id === selectedSlotId)
    if (!slot) return

    const nextErrors: FormErrors = {}
    if (!form.name.trim()) nextErrors.name = t('form.name_error')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t('form.email_error')
    if (!form.phone.trim()) nextErrors.phone = t('form.phone_error')
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.name) detailsNameRef.current?.focus()
      else if (nextErrors.email) detailsEmailRef.current?.focus()
      else detailsPhoneRef.current?.focus()
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          party_size: parseInt(form.party_size, 10),
          date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot_id: selectedSlotId,
          language: locale,
        }),
      })
      if (!res.ok) {
        if (res.status === 409) {
          availabilityCacheRef.current.delete(format(selectedDate, 'yyyy-MM-dd'))
          setSelectedSlotId(null)
          setSlots([])
          setLoadingSlots(true)
          focusTableOnReturnRef.current = true
          setStep('table')
          setError(t('error_slot_full'))
          setAvailabilityRefresh((current) => current + 1)
          return
        }
        if (res.status === 429) {
          setError(t('error_rate_limited'))
          return
        }
        throw new Error()
      }
      setConfirmed({
        date: selectedDate,
        slotLabel: `${slot.start_time.substring(0, 5)} – ${slot.end_time.substring(0, 5)}`,
        party_size: parseInt(form.party_size, 10),
        email: form.email,
        name: form.name,
      })
      availabilityCacheRef.current.delete(format(selectedDate, 'yyyy-MM-dd'))
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setConfirmed(null)
    setSelectedDate(getNextBookableDate(startOfToday()))
    setSelectedSlotId(null)
    setStep('table')
    setSlots([])
    setLoadingSlots(true)
    setForm(initialForm)
    setFormErrors({})
    setAvailabilityFailed(false)
    setError(null)
  }

  function returnToTable() {
    focusTableOnReturnRef.current = true
    setStep('table')
  }

  const fieldClass =
    'booking-field'
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId)
  const partySize = parseInt(form.party_size, 10)
  const hasFittingSlot = slots.some(
    (slot) => slot.available && slot.max_capacity - slot.booked >= partySize
  )

  return (
    <section id="reservation" className="reservation-section section-padding">
      <div className="page-width reservation-layout">
        <div className="reservation-intro">
          <p className="section-eyebrow">04 / {t('label')}</p>
          <h2 className="display-title">{t('title')}</h2>
          <p className="body-copy">{t('intro')}</p>
          <div className="reservation-note"><span aria-hidden="true">✳</span><p>{t('note')}</p></div>
          <p className="reservation-help">{t('help')}<a href="tel:+497022904030">+49 7022 904 030 ↗</a></p>
        </div>
        <div className="reservation-booking">
        <div className="booking-heading">
          <div>
            <p className="booking-kicker">Jilebi · Nürtingen</p>
            <h3>{confirmed ? t('card_received') : t('card_title')}</h3>
          </div>
          <span className="booking-monogram" aria-hidden="true">J.</span>
        </div>

        {confirmed ? (
          <div
            role="status"
            aria-live="polite"
            className="booking-success animate-fade-in"
          >
            <span className="booking-success-mark" aria-hidden="true">✓</span>
            <h3
              ref={successHeadingRef}
              tabIndex={-1}
              className="font-serif text-3xl text-charcoal mb-3 focus:outline-none"
            >
              {t('success_title')}
            </h3>
            <p className="text-charcoal/80 text-base leading-relaxed mb-8">
              {t('success_body')}
            </p>

            <dl className="booking-confirmation">
              <dt className="text-[10px] tracking-widest uppercase text-muted self-center">
                {t('date_label')}
              </dt>
              <dd className="font-serif italic text-base text-charcoal">
                {format(confirmed.date, fullDateFormat, { locale: dateLocale })}
                {' · '}
                {confirmed.slotLabel}
              </dd>
              <dt className="text-[10px] tracking-widest uppercase text-muted self-center">
                {t('form.party_size_label')}
              </dt>
              <dd className="font-serif italic text-base text-charcoal">
                {t('success_party', { count: confirmed.party_size })}
              </dd>
              <dt className="text-[10px] tracking-widest uppercase text-muted self-center">
                {t('form.email_label')}
              </dt>
              <dd className="text-charcoal/80">
                {t('success_email', { email: confirmed.email })}
              </dd>
            </dl>

            <button
              type="button"
              onClick={resetForm}
              className="btn-outline mt-10"
            >
              {t('success_book_another')}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="booking-form"
            noValidate
          >
            <ol
              aria-label={t('step_progress')}
              className="booking-progress"
            >
              <li aria-current={step === 'table' ? 'step' : undefined} className={step === 'details' ? 'is-complete' : ''}>
                <span className="booking-step-number" aria-hidden="true">
                  {step === 'details' ? '✓' : '01'}
                </span>
                <span>{t('step_table')}</span>
              </li>
              <li aria-current={step === 'details' ? 'step' : undefined}>
                <span className="booking-step-number" aria-hidden="true">
                  02
                </span>
                <span>{t('step_details')}</span>
              </li>
            </ol>

            {step === 'table' ? (
              <>
              <div className="booking-table-grid animate-fade-in">
                <div className="booking-calendar-panel">
                  <p className="field-label">{t('date_label')}</p>
                  <DayPicker
                    className="reservation-calendar"
                    mode="single"
                    defaultMonth={selectedDate}
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={[
                      { before: addDays(today, 1) },
                      { after: maxDate },
                      { dayOfWeek: [1] },
                    ]}
                    locale={dateLocale}
                    weekStartsOn={1}
                  />
                  <p className="booking-calendar-note"><span aria-hidden="true" />{t('closed_monday')}</p>
                </div>

                <div className="booking-options">
                  <div>
                    <label htmlFor="res-party" className="field-label">
                      {t('form.party_size_label')}
                    </label>
                    <div className="booking-guest-control">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="9" cy="7" r="3" /><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" /></svg>
                    <select
                      ref={partySizeRef}
                      id="res-party"
                      name="party_size"
                      value={form.party_size}
                      onChange={(e) => {
                        setForm({ ...form, party_size: e.target.value })
                        setSelectedSlotId(null)
                      }}
                      className="booking-guest-select"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {t('form.party_size_option', { n })}
                        </option>
                      ))}
                    </select>
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="booking-times" aria-live="polite">
                      <p className="field-label">{t('slot_label')}</p>
                      <p className="booking-date-caption">
                        {format(selectedDate, fullDateFormat, { locale: dateLocale })}
                      </p>

                      {loadingSlots ? (
                        <div role="status" className="booking-loading">
                          <span>{t('loading_slots')}</span>
                          <div aria-hidden="true" className="booking-slot-skeletons">
                            {[0, 1, 2].map((item) => (
                              <span key={item}><span /></span>
                            ))}
                          </div>
                        </div>
                      ) : availabilityFailed ? null : slots.length === 0 ? (
                        <p className="booking-empty">{t('no_slots')}</p>
                      ) : !hasFittingSlot ? (
                        <p className="booking-empty">{t('no_slots_for_party')}</p>
                      ) : (
                        <TimeSlotPicker
                          slots={slots}
                          selected={selectedSlotId}
                          partySize={partySize}
                          onSelect={(id) => {
                            setSelectedSlotId(id)
                            setError(null)
                          }}
                        />
                      )}
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="mt-5 text-sm text-chili">
                      {error}
                    </p>
                  )}

                </div>
              </div>
              <div className="booking-action-bar">
                <div className="booking-summary" aria-live="polite">
                  <p>{t('selected_table')}</p>
                  <span>{selectedDate ? format(selectedDate, locale === 'en' ? 'd MMM' : 'd. MMM', { locale: dateLocale }) : t('date_label')} · {t('success_party', { count: partySize })}</span>
                  <small>{selectedSlot ? `${selectedSlot.start_time.substring(0, 5)} – ${selectedSlot.end_time.substring(0, 5)}` : t('choose_time_hint')}</small>
                </div>
                <button
                    type="button"
                    onClick={() => setStep('details')}
                    disabled={!selectedSlotId}
                    className="btn-primary booking-next"
                  >
                    {t('continue')}<span aria-hidden="true">↗</span>
                  </button>
              </div>
              </>
            ) : (
              <div className="booking-details animate-fade-in">
                <div className="booking-selected-table">
                  <div>
                    <p className="field-label">{t('selected_table')}</p>
                    <p className="font-serif text-lg leading-relaxed text-charcoal">
                      {selectedDate && format(selectedDate, fullDateFormat, { locale: dateLocale })}
                      {selectedSlot && ` · ${selectedSlot.start_time.substring(0, 5)} – ${selectedSlot.end_time.substring(0, 5)}`}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t('success_party', { count: partySize })}
                    </p>
                  </div>
                  <button type="button" onClick={returnToTable} className="self-start text-xs uppercase tracking-widest text-gold-ink hover:text-charcoal sm:self-center">
                    {t('change')}
                  </button>
                </div>

                <p className="section-eyebrow mb-8">{t('details_label')}</p>
                {Object.keys(formErrors).length > 0 && (
                  <p role="alert" className="sr-only">{t('form.validation_error')}</p>
                )}
                <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
                  <div>
                    <label htmlFor="res-name" className="field-label">{t('form.name_label')}</label>
                    <input
                      ref={detailsNameRef}
                      id="res-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder={t('form.name')}
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value })
                        setFormErrors((current) => ({ ...current, name: undefined }))
                      }}
                      aria-invalid={Boolean(formErrors.name)}
                      aria-describedby={formErrors.name ? 'res-name-error' : undefined}
                      className={fieldClass}
                    />
                    {formErrors.name && <p id="res-name-error" className="mt-2 text-xs text-chili">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="res-email" className="field-label">{t('form.email_label')}</label>
                    <input
                      ref={detailsEmailRef}
                      id="res-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      placeholder={t('form.email')}
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value })
                        setFormErrors((current) => ({ ...current, email: undefined }))
                      }}
                      aria-invalid={Boolean(formErrors.email)}
                      aria-describedby={formErrors.email ? 'res-email-error' : undefined}
                      className={fieldClass}
                    />
                    {formErrors.email && <p id="res-email-error" className="mt-2 text-xs text-chili">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="res-phone" className="field-label">{t('form.phone_label')}</label>
                    <input
                      ref={detailsPhoneRef}
                      id="res-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      placeholder={t('form.phone')}
                      value={form.phone}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value })
                        setFormErrors((current) => ({ ...current, phone: undefined }))
                      }}
                      aria-invalid={Boolean(formErrors.phone)}
                      aria-describedby={formErrors.phone ? 'res-phone-error' : undefined}
                      className={fieldClass}
                    />
                    {formErrors.phone && <p id="res-phone-error" className="mt-2 text-xs text-chili">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="res-notes" className="field-label">{t('form.notes_label')}</label>
                    <textarea
                      id="res-notes"
                      name="notes"
                      placeholder={t('form.notes')}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                </div>

                {error && <p role="alert" className="mt-6 text-sm text-chili">{error}</p>}

                <div className="booking-details-actions">
                  <button type="button" onClick={returnToTable} className="btn-outline min-h-12">
                    {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedDate || !selectedSlotId || submitting}
                    aria-busy={submitting}
                    className="btn-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? (
                      <><span className="spinner" aria-hidden="true" /><span>{t('form.submitting')}</span></>
                    ) : t('form.submit')}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
        </div>
      </div>
    </section>
  )
}
