import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/resend'
import { rateLimit } from '@/lib/rate-limit'
import {
  getClientIp,
  getUtcDayOfWeek,
  isSameOrigin,
  isValidDateOnly,
  isWithinReservationWindow,
} from '@/lib/request-security'

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'party_size', 'date', 'time_slot_id', 'language']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TEXT_LENGTH = 120
const MAX_NOTES_LENGTH = 1000

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit: 5 reservations per IP per minute
  const ip = getClientIp(req)
  const { limited, resetAt } = rateLimit(ip, 5, 60_000)
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const missing = REQUIRED_FIELDS.filter((f) => body[f] == null || body[f] === '')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
  }

  if (typeof body.name !== 'string' || typeof body.phone !== 'string') {
    return NextResponse.json({ error: 'Invalid name or phone' }, { status: 400 })
  }
  if (
    body.name.trim().length === 0 ||
    body.name.length > MAX_TEXT_LENGTH ||
    body.phone.trim().length === 0 ||
    body.phone.length > MAX_TEXT_LENGTH
  ) {
    return NextResponse.json({ error: 'Invalid name or phone' }, { status: 400 })
  }
  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (body.email.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (
    typeof body.party_size !== 'number' ||
    !Number.isInteger(body.party_size) ||
    body.party_size < 1 ||
    body.party_size > 10
  ) {
    return NextResponse.json({ error: 'party_size must be an integer 1-10' }, { status: 400 })
  }
  if (typeof body.date !== 'string' || !isValidDateOnly(body.date)) {
    return NextResponse.json({ error: 'date must be a real YYYY-MM-DD date' }, { status: 400 })
  }
  if (!isWithinReservationWindow(body.date)) {
    return NextResponse.json({ error: 'date is outside the reservation window' }, { status: 400 })
  }
  if (typeof body.time_slot_id !== 'string' || !UUID_RE.test(body.time_slot_id)) {
    return NextResponse.json({ error: 'Invalid time_slot_id' }, { status: 400 })
  }
  if (body.language !== 'de' && body.language !== 'en') {
    return NextResponse.json({ error: 'language must be "de" or "en"' }, { status: 400 })
  }
  if (body.notes != null && typeof body.notes !== 'string') {
    return NextResponse.json({ error: 'notes must be a string' }, { status: 400 })
  }
  if (typeof body.notes === 'string' && body.notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: 'notes is too long' }, { status: 400 })
  }

  const { data: slot, error: slotError } = await getSupabaseAdmin()
    .from('time_slots')
    .select('id, day_of_week, is_blocked')
    .eq('id', body.time_slot_id)
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: 'Invalid time_slot_id' }, { status: 400 })
  }
  if (slot.is_blocked || slot.day_of_week !== getUtcDayOfWeek(body.date)) {
    return NextResponse.json({ error: 'Selected time slot is not available' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('reservations')
    .insert({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      party_size: body.party_size,
      date: body.date,
      time_slot_id: body.time_slot_id,
      language: body.language,
      notes: typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null,
      status: 'pending',
    })
    .select('*, time_slots(start_time, end_time)')

  if (error) {
    const isCapacity = error.message.includes('Slot capacity exceeded')
    if (!isCapacity) {
      console.error('[reservations] insert failed:', error)
    }
    return NextResponse.json(
      { error: isCapacity ? 'This time slot is fully booked' : 'Unable to create reservation' },
      { status: isCapacity ? 409 : 500 }
    )
  }

  const reservation = data[0]

  after(async () => {
    try {
      const delivered = await sendConfirmationEmail(reservation)
      if (delivered) {
        const emailSentAt = new Date().toISOString()
        const { error: emailUpdateError } = await getSupabaseAdmin()
          .from('reservations')
          .update({ email_sent_at: emailSentAt })
          .eq('id', reservation.id)

        if (emailUpdateError) {
          console.error('[reservations] email_sent_at update failed:', emailUpdateError)
        }
      }
    } catch (err) {
      console.error('[reservations] confirmation email flow failed:', err)
    }
  })

  return NextResponse.json({ reservation }, { status: 201 })
}
