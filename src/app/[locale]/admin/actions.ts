'use server'

import { supabaseAdmin } from '@/lib/supabase'

export async function updateReservationStatus(password: string, id: string, status: 'confirmed' | 'cancelled') {
  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error('Unauthorized')
  }
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('*, time_slots(start_time, end_time)')
    .single()

  if (error) throw new Error(error.message)
  return data
}
