import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminAuthorized } from '@/lib/auth'
import { sendCancellationEmail } from '@/lib/resend'

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservations: data })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_STATUSES = ['confirmed', 'cancelled'] as const

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await getSupabaseAdmin()
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('*, time_slots(start_time, end_time)')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reservation = data[0]
  if (status === 'cancelled') {
    sendCancellationEmail(reservation).catch(console.error)
  }

  return NextResponse.json({ reservation })
}
