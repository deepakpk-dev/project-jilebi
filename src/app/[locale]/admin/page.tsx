import { supabaseAdmin } from '@/lib/supabase'
import ReservationTable from '@/components/admin/ReservationTable'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>
}) {
  const password = process.env.ADMIN_PASSWORD!
  const { pw: provided } = await searchParams

  if (provided !== password) {
    return (
      <main className="min-h-screen bg-ivory flex items-center justify-center">
        <form method="GET" className="flex flex-col gap-4 w-full max-w-xs">
          <h1 className="font-serif text-2xl text-charcoal tracking-brand uppercase">Jilebi Admin</h1>
          <input
            name="pw"
            type="password"
            placeholder="Passwort"
            className="border-b border-sand bg-transparent pb-2 text-sm text-charcoal placeholder-muted focus:border-gold focus:outline-none"
          />
          <button type="submit" className="btn-primary">Anmelden</button>
        </form>
      </main>
    )
  }

  const { data: reservations, error } = await supabaseAdmin
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })

  if (error) {
    return <main className="p-8 text-red-600">Fehler: {error.message}</main>
  }

  return (
    <main className="min-h-screen bg-ivory section-padding">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-charcoal tracking-brand uppercase">Jilebi Admin</h1>
          <span className="text-xs text-muted">{reservations?.length ?? 0} Reservierungen</span>
        </div>
        <ReservationTable reservations={reservations ?? []} />
      </div>
    </main>
  )
}
