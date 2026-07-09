import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminSession } from '@/lib/auth'
import ReservationTable from '@/components/admin/ReservationTable'
import AdminLogin from '@/components/admin/AdminLogin'
import LogoutButton from '@/components/admin/LogoutButton'
import { updateReservationStatus } from './actions'
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

  // "Today" in the restaurant's timezone, formatted YYYY-MM-DD to match the
  // `date` column. Using UTC would hide today's bookings between midnight and
  // ~02:00 Berlin time.
  const todayBerlin = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
  }).format(new Date())

  let query = getSupabaseAdmin()
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })
  if (!showAll) query = query.gte('date', todayBerlin)
  const { data: reservations, error } = await query

  if (error) {
    return <main className="p-8 text-red-600">{t('fetch_error', { message: error.message })}</main>
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
      </div>
    </main>
  )
}
