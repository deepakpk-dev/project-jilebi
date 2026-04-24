import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminSession } from '@/lib/auth'
import ReservationTable from '@/components/admin/ReservationTable'
import AdminLogin from '@/components/admin/AdminLogin'
import { updateReservationStatus } from './actions'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
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

  const { data: reservations, error } = await getSupabaseAdmin()
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })

  if (error) {
    return <main className="p-8 text-red-600">{t('fetch_error', { message: error.message })}</main>
  }

  return (
    <main className="min-h-screen bg-ivory section-padding">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-charcoal tracking-brand uppercase">{t('title')}</h1>
          <span className="text-xs text-muted">
            {t('reservations_count', { count: reservations?.length ?? 0 })}
          </span>
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
