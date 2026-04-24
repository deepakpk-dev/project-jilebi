import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/resend'
import { rateLimit } from '@/lib/rate-limit'

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'party_size', 'date', 'time_slot_id', 'language']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  // Rate limit: 5 reservations per IP per minute
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
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

  const body = await req.json()

  const missing = REQUIRED_FIELDS.filter((f) => body[f] == null || body[f] === '')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
  }

  if (typeof body.name !== 'string' || typeof body.phone !== 'string') {
    return NextResponse.json({ error: 'Invalid name or phone' }, { status: 400 })
  }
  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email)) {
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
  if (typeof body.date !== 'string' || !DATE_RE.test(body.date) || Number.isNaN(Date.parse(body.date))) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
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

  const { data, error } = await getSupabaseAdmin()
    .from('reservations')
    .insert({
      name: body.name,
      email: body.email,
      phone: body.phone,
      party_size: body.party_size,
      date: body.date,
      time_slot_id: body.time_slot_id,
      language: body.language,
      notes: body.notes ?? null,
      status: 'pending',
    })
    .select('*, time_slots(start_time, end_time)')

  if (error) {
    const isCapacity = error.message.includes('Slot capacity exceeded')
    return NextResponse.json(
      { error: isCapacity ? 'This time slot is fully booked' : error.message },
      { status: isCapacity ? 409 : 500 }
    )
  }

  const reservation = data[0]

  // Fire-and-forget confirmation email
  sendConfirmationEmail(reservation).catch(console.error)

  return NextResponse.json({ reservation }, { status: 201 })
}
