'use server'

import { supabaseAdmin } from '@/lib/supabase'

export async function updateReservationStatus(id: string, status: 'confirmed' | 'cancelled') {
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('*, time_slots(start_time, end_time)')
    .single()

  if (error) throw new Error(error.message)
  return data
}
