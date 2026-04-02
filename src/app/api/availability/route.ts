import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'date parameter required' }, { status: 400 })
  }

  const dayOfWeek = new Date(date).getDay()

  // Fetch template slots for this day of week
  const { data: slots, error: slotsError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_blocked', false)

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 })
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  const slotIds = slots.map((s) => s.id)

  // Count booked party sizes per slot for this date
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('time_slot_id, party_size')
    .eq('date', date)
    .in('time_slot_id', slotIds)

  if (resError) {
    return NextResponse.json({ error: resError.message }, { status: 500 })
  }

  const bookedBySlot: Record<string, number> = {}
  for (const r of reservations ?? []) {
    bookedBySlot[r.time_slot_id] = (bookedBySlot[r.time_slot_id] ?? 0) + r.party_size
  }

  const result = slots.map((slot) => ({
    id: slot.id,
    start_time: slot.start_time,
    end_time: slot.end_time,
    max_capacity: slot.max_capacity,
    booked: bookedBySlot[slot.id] ?? 0,
    available: (bookedBySlot[slot.id] ?? 0) < slot.max_capacity,
  }))

  return NextResponse.json({ slots: result })
}
