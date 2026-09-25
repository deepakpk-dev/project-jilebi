import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminSession } from '@/lib/auth'
import { getBerlinToday } from '@/lib/request-security'
import ReservationTable from '@/components/admin/ReservationTable'
import SlotManager from '@/components/admin/SlotManager'
import AdminLogin from '@/components/admin/AdminLogin'
import LogoutButton from '@/components/admin/LogoutButton'
import { updateReservationStatus, updateSlotBlocked } from './actions'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ show?: string }>
}) {
  const { locale } = await params
  const { show } = await searchParams
  const showAll = show === 'all'
  setRequestLocale(locale)
  const t = await getTranslations('admin')

  const authorized = await isAdminSession()

  if (!authorized) {
    return (
      <main className="min-h-screen bg-ivory flex items-center justify-center">
        <AdminLogin />
      </main>
    )
  }

  const todayBerlin = getBerlinToday()

  let query = getSupabaseAdmin()
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })
  if (!showAll) query = query.gte('date', todayBerlin)
  const { data: reservations, error } = await query

  if (error) {
    return <main className="p-8 text-red-600">{t('fetch_error', { message: error.message })}</main>
  }

  const { data: slots, error: slotsError } = await getSupabaseAdmin()
    .from('time_slots')
    .select('id, day_of_week, start_time, end_time, max_capacity, is_blocked')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (slotsError) {
    return (
      <main className="p-8 text-red-600">{t('fetch_error', { message: slotsError.message })}</main>
    )
  }

  // Active future reservations per slot, so blocking shows what it would strand.
  const { data: upcoming, error: upcomingError } = await getSupabaseAdmin()
    .from('reservations')
    .select('time_slot_id')
    .gte('date', todayBerlin)
    .neq('status', 'cancelled')

  if (upcomingError) {
    return (
      <main className="p-8 text-red-600">
        {t('fetch_error', { message: upcomingError.message })}
      </main>
    )
  }

  const upcomingCountBySlot: Record<string, number> = {}
  for (const r of upcoming ?? []) {
    upcomingCountBySlot[r.time_slot_id] = (upcomingCountBySlot[r.time_slot_id] ?? 0) + 1
  }

  return (
    <main className="min-h-screen bg-ivory section-padding">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="font-serif text-3xl text-charcoal tracking-brand uppercase">{t('title')}</h1>
          <div className="flex items-center gap-5">
            <span className="text-xs text-muted">
              {t('reservations_count', { count: reservations?.length ?? 0 })}
            </span>
            <Link
              href={showAll ? '/admin' : '/admin?show=all'}
              className="text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors"
            >
              {showAll ? t('show_upcoming') : t('show_all')}
            </Link>
            <LogoutButton />
          </div>
        </div>
        <ReservationTable
          reservations={reservations ?? []}
          updateStatus={updateReservationStatus}
          locale={locale}
        />

        <div className="mt-16">
          <SlotManager
            slots={slots ?? []}
            upcomingCounts={upcomingCountBySlot}
            updateSlot={updateSlotBlocked}
          />
        </div>
      </div>
    </main>
  )
}
