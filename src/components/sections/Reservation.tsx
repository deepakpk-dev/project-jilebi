'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { DayPicker } from 'react-day-picker'
import { format, addDays, startOfToday } from 'date-fns'
import { de, enGB } from 'date-fns/locale'
import 'react-day-picker/style.css'
import GoldenRule from '@/components/ui/GoldenRule'
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

const initialForm: FormState = {
  name: '',
  party_size: '2',
  email: '',
  phone: '',
  notes: '',
}

export default function Reservation() {
  const t = useTranslations('reservation')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? enGB : de

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (confirmed) successHeadingRef.current?.focus()
  }, [confirmed])

  const today = startOfToday()
  const maxDate = addDays(today, 30)

  // Shared availability fetch. Goes through abortRef so that changing the date
  // during an in-flight load (or a post-409 refresh) cancels the stale request
  // instead of letting it overwrite the current date's slots. Returns the fresh
  // slots, or null when the request was aborted.
  async function loadSlots(date: Date): Promise<Slot[] | null> {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?date=${format(date, 'yyyy-MM-dd')}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('Failed to load availability')
      const data = await res.json()
      const fresh: Slot[] = data.slots ?? []
      setSlots(fresh)
      return fresh
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      setSlots([])
      setError(t('error'))
      return []
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date)
    setSelectedSlotId(null)
    setError(null)
    if (!date) return
    await loadSlots(date)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlotId) return
    const slot = slots.find((s) => s.id === selectedSlotId)
    if (!slot) return

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
        // Branch on status, never on the (unlocalized) error body.
        if (res.status === 409) {
          setError(t('error_slot_full'))
          const fresh = await loadSlots(selectedDate)
          // Drop the stale selection if that slot is now full or gone.
          if (fresh && !fresh.some((s) => s.id === selectedSlotId && s.available)) {
            setSelectedSlotId(null)
          }
        } else if (res.status === 429) {
          setError(t('error_rate_limited'))
        } else {
          setError(t('error'))
        }
        return
      }
      setConfirmed({
        date: selectedDate,
        slotLabel: `${slot.start_time.substring(0, 5)} – ${slot.end_time.substring(0, 5)}`,
        party_size: parseInt(form.party_size, 10),
        email: form.email,
        name: form.name,
      })
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setConfirmed(null)
    setSelectedDate(undefined)
    setSelectedSlotId(null)
    setSlots([])
    setForm(initialForm)
    setError(null)
  }

  // The server's `available` flag is `booked < max_capacity`, so a slot with
  // 19/20 seats booked still reads as available for a party of 6 — a guaranteed
  // 409. Narrow availability to slots whose remaining seats fit the party size.
  const partySize = parseInt(form.party_size, 10)
  const displaySlots: Slot[] = slots.map((s) => ({
    ...s,
    available: s.available && s.max_capacity - s.booked >= partySize,
  }))

  function handlePartySizeChange(value: string) {
    setForm({ ...form, party_size: value })
    const n = parseInt(value, 10)
    const sel = slots.find((s) => s.id === selectedSlotId)
    if (sel && sel.max_capacity - sel.booked < n) setSelectedSlotId(null)
  }

  const fieldClass =
    'w-full bg-transparent border-b border-sand pb-2 text-sm text-charcoal placeholder:text-muted/70 focus:border-gold focus:outline-none transition-colors'

  return (
    <section id="reservation" className="section-padding bg-ivory">
      <div className="max-w-5xl mx-auto">
        <p className="section-eyebrow mb-5">{t('label')}</p>
        <h2 className="section-title mb-3">{t('title')}</h2>
        <GoldenRule />

        {confirmed ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-12 max-w-xl animate-fade-in"
          >
            <p className="section-eyebrow mb-5">{t('label')}</p>
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

            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-sand pt-6 text-sm">
              <dt className="text-[10px] tracking-widest uppercase text-muted self-center">
                {t('date_label')}
              </dt>
              <dd className="font-serif italic text-base text-charcoal">
                {format(confirmed.date, 'EEEE, d. MMMM', { locale: dateLocale })}
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
            className="mt-12 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 lg:gap-16"
            noValidate
          >
            {/* Left: date + slot */}
            <div className="space-y-8">
              <div>
                <p className="field-label">{t('date_label')}</p>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={[{ before: addDays(today, 1) }, { after: maxDate }]}
                  locale={dateLocale}
                  weekStartsOn={1}
                />
              </div>

              {selectedDate && (
                <div className="animate-fade-in">
                  <p className="field-label">{t('slot_label')}</p>
                  {loadingSlots ? (
                    <p className="inline-flex items-center gap-2 text-xs text-muted">
                      <span className="spinner" aria-hidden="true" />
                      {t('loading_slots')}
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-muted">{t('no_slots')}</p>
                  ) : (
                    <TimeSlotPicker
                      slots={displaySlots}
                      selected={selectedSlotId}
                      onSelect={setSelectedSlotId}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Right: contact */}
            <div className="flex flex-col gap-6">
              <p className="section-eyebrow">{t('details_label')}</p>

              <div>
                <label htmlFor="res-name" className="field-label">
                  {t('form.name_label')}
                </label>
                <input
                  id="res-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder={t('form.name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="res-email" className="field-label">
                  {t('form.email_label')}
                </label>
                <input
                  id="res-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder={t('form.email')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="res-phone" className="field-label">
                  {t('form.phone_label')}
                </label>
                <input
                  id="res-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  placeholder={t('form.phone')}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="res-party" className="field-label">
                  {t('form.party_size_label')}
                </label>
                <select
                  id="res-party"
                  name="party_size"
                  value={form.party_size}
                  onChange={(e) => handlePartySizeChange(e.target.value)}
                  className={fieldClass}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {t('form.party_size_option', { n })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="res-notes" className="field-label">
                  {t('form.notes_label')}
                </label>
                <textarea
                  id="res-notes"
                  name="notes"
                  placeholder={t('form.notes')}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-chili text-xs flex items-center gap-2"
                >
                  <span aria-hidden="true" className="block w-1 h-1 rounded-full bg-chili" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!selectedDate || !selectedSlotId || submitting}
                aria-busy={submitting}
                className="btn-primary mt-2 disabled:opacity-40 disabled:cursor-not-allowed min-h-[2.75rem]"
              >
                {submitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>{t('form.submitting')}</span>
                  </>
                ) : (
                  t('form.submit')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
