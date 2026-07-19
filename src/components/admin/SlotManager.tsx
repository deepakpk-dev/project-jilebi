'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TimeSlot } from '@/app/[locale]/admin/actions'

// Restaurant week starts Monday; Postgres day_of_week is 0=Sunday..6=Saturday.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export default function SlotManager({
  slots: initial,
  upcomingCounts,
  updateSlot,
}: {
  slots: TimeSlot[]
  upcomingCounts: Record<string, number>
  updateSlot: (id: string, isBlocked: boolean) => Promise<TimeSlot>
}) {
  const t = useTranslations('admin')
  const [slots, setSlots] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(slot: TimeSlot) {
    setLoading(slot.id)
    setError(null)
    try {
      const updated = await updateSlot(slot.id, !slot.is_blocked)
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch {
      setError(t('action_error'))
    } finally {
      setLoading(null)
    }
  }

  const byDay = slots.reduce<Record<number, TimeSlot[]>>((acc, s) => {
    acc[s.day_of_week] = [...(acc[s.day_of_week] ?? []), s]
    return acc
  }, {})

  return (
    <div>
      <h2 className="font-serif text-2xl text-charcoal tracking-brand uppercase mb-6">
        {t('slots.title')}
      </h2>

      {error && (
        <p className="flex items-start gap-2 text-sm text-charcoal bg-chili/8 border border-chili/20 px-3 py-2 mb-6">
          <span
            aria-hidden="true"
            className="mt-[3px] block w-1.5 h-1.5 rounded-full bg-chili flex-shrink-0"
          />
          {error}
        </p>
      )}

      <div className="space-y-8">
        {DAY_ORDER.filter((day) => (byDay[day]?.length ?? 0) > 0).map((day) => (
          <div key={day}>
            <h3 className="text-sm font-medium text-charcoal mb-3 tracking-wide">
              {t(`slots.days.${day}`)}
            </h3>
            <div className="divide-y divide-sand border border-sand rounded-sm">
              {byDay[day].map((slot) => {
                const upcoming = upcomingCounts[slot.id] ?? 0
                return (
                  <div
                    key={slot.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-charcoal tabular-nums">
                          {slot.start_time.substring(0, 5)} – {slot.end_time.substring(0, 5)}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 border ${
                            slot.is_blocked
                              ? 'bg-chili/10 text-chili border-chili/30'
                              : 'bg-leaf/10 text-charcoal border-sand'
                          }`}
                        >
                          {slot.is_blocked ? t('slots.blocked') : t('slots.open')}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {t('slots.capacity', { count: slot.max_capacity })}
                        {upcoming > 0 && (
                          <>
                            {' · '}
                            <span className="text-chili">
                              {t('slots.upcoming_warning', { count: upcoming })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(slot)}
                      disabled={loading === slot.id}
                      className={`px-3 py-1.5 text-[10px] tracking-widest uppercase disabled:opacity-40 transition-colors ${
                        slot.is_blocked
                          ? 'bg-charcoal text-ivory hover:bg-gold'
                          : 'border border-charcoal/25 text-muted hover:border-chili hover:text-chili'
                      }`}
                    >
                      {slot.is_blocked ? t('slots.unblock') : t('slots.block')}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
