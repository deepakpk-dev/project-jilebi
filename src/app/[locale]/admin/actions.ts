'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminSession } from '@/lib/auth'
import { sendCancellationEmail, sendReservationConfirmedEmail } from '@/lib/resend'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_STATUSES = ['confirmed', 'cancelled'] as const

export async function updateReservationStatus(id: string, status: 'confirmed' | 'cancelled') {
  const authorized = await isAdminSession()
  if (!authorized) throw new Error('Unauthorized')

  if (!UUID_RE.test(id)) throw new Error('Invalid reservation id')
  if (!ALLOWED_STATUSES.includes(status)) throw new Error('Invalid reservation status')

  const { data, error } = await getSupabaseAdmin()
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('*, time_slots(start_time, end_time)')
    .single()

  if (error) {
    console.error('[admin action] update reservation failed:', error)
    throw new Error('Unable to update reservation')
  }

  if (status === 'cancelled') {
    try {
      await sendCancellationEmail(data)
    } catch (err) {
      console.error('[admin action] cancellation email failed:', err)
    }
  } else if (status === 'confirmed') {
    // Email delivery must never roll back a status change that already committed.
    try {
      await sendReservationConfirmedEmail(data)
    } catch (err) {
      console.error('[admin action] confirmed email failed:', err)
    }
  }

  return data
}
