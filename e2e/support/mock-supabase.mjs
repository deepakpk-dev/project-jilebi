import http from 'node:http'

/**
 * Minimal PostgREST + Resend mock for full-stack E2E journeys.
 *
 * The `journeys.spec.ts` suite drives the real Next server through to the real
 * API routes and server actions — nothing is intercepted at the browser layer.
 * This process stands in for the only two external dependencies those code
 * paths reach: the Supabase REST API (PostgREST) and Resend. It handles exactly
 * the queries this app makes, with canned rows, so CI needs no live services.
 *
 * Point the app at it with:
 *   NEXT_PUBLIC_SUPABASE_URL   = http://localhost:5599
 *   SUPABASE_SERVICE_ROLE_KEY  = <any>
 *   RESEND_BASE_URL            = http://localhost:5599   (resend SDK honors this)
 *
 * State (canned reservations, slot block flags, one-shot 409) is reset via
 * GET /__mock/reset so each test run is hermetic.
 */

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 5599)

// Deterministic valid UUIDs per (dayOfWeek, slotIndex) — must satisfy the app's
// UUID_RE (8-4-4-4-12). Monday (1) intentionally absent = restaurant closed.
const slotId = (dow, idx) => `0000000${dow}-0000-400${idx}-8000-000000000000`
const SERVICE_DAYS = [0, 2, 3, 4, 5, 6]

function seedSlots() {
  const slots = []
  for (const dow of SERVICE_DAYS) {
    slots.push({ id: slotId(dow, 0), day_of_week: dow, start_time: '18:00:00', end_time: '20:00:00', max_capacity: 20, is_blocked: false })
    slots.push({ id: slotId(dow, 1), day_of_week: dow, start_time: '20:00:00', end_time: '22:00:00', max_capacity: 20, is_blocked: false })
  }
  return slots
}

// A realistic dashboard: two pending (one with no delivery timestamp), one
// confirmed, spread over two dates.
function seedReservations() {
  return [
    { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'Maria Müller', email: 'maria@example.de', phone: '+49 7022 111', party_size: 4, date: '2026-07-11', status: 'pending', language: 'de', notes: 'Fensterplatz bitte', email_sent_at: '2026-07-10T10:00:00Z', time_slots: { start_time: '18:00:00', end_time: '20:00:00' } },
    { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'James Carter', email: 'james@example.com', phone: '+49 7022 222', party_size: 2, date: '2026-07-11', status: 'pending', language: 'en', notes: null, email_sent_at: null, time_slots: { start_time: '20:00:00', end_time: '22:00:00' } },
    { id: 'aaaaaaaa-0000-4000-8000-000000000003', name: 'Anja Vogel', email: 'anja@example.de', phone: '+49 7022 333', party_size: 6, date: '2026-07-12', status: 'confirmed', language: 'de', notes: 'Geburtstag', email_sent_at: '2026-07-10T09:00:00Z', time_slots: { start_time: '18:00:00', end_time: '20:00:00' } },
  ]
}

let timeSlots = seedSlots()
let reservations = seedReservations()
let failNextInsert = false

function send(res, status, body, single) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(single ? (Array.isArray(body) ? body[0] : body) : body))
}

const isSingle = (req) => (req.headers['accept'] || '').includes('vnd.pgrst.object+json')

function filterValue(qs, key) {
  const v = qs.get(key)
  if (!v) return null
  const m = v.match(/^(?:eq|gte|neq|lte|gt|lt)\.(.*)$/)
  return m ? decodeURIComponent(m[1]) : v
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const qs = url.searchParams
  const path = url.pathname

  // ---- control endpoints ----
  if (path === '/__mock/health') return send(res, 200, { ok: true })
  if (path === '/__mock/reset') {
    timeSlots = seedSlots()
    reservations = seedReservations()
    failNextInsert = false
    return send(res, 200, { reset: true })
  }
  if (path === '/__mock/fail-next-insert') {
    failNextInsert = true
    return send(res, 200, { armed: true })
  }

  let chunks = ''
  req.on('data', (c) => (chunks += c))
  req.on('end', () => {
    const body = chunks ? JSON.parse(chunks) : null

    // ---- Resend ----
    if (path === '/emails' && req.method === 'POST') {
      return send(res, 200, { id: 'mock-email-id' }, false)
    }

    // ---- time_slots ----
    if (path === '/rest/v1/time_slots') {
      if (req.method === 'GET') {
        const id = filterValue(qs, 'id')
        const dow = filterValue(qs, 'day_of_week')
        let rows = timeSlots
        if (id) rows = rows.filter((s) => s.id === id)
        if (dow != null) rows = rows.filter((s) => String(s.day_of_week) === String(dow))
        if (qs.get('is_blocked')) rows = rows.filter((s) => !s.is_blocked)
        return send(res, 200, rows, isSingle(req))
      }
      if (req.method === 'PATCH') {
        const id = filterValue(qs, 'id')
        const slot = timeSlots.find((s) => s.id === id)
        if (!slot) return send(res, 200, [], isSingle(req))
        Object.assign(slot, body)
        return send(res, 200, [slot], isSingle(req))
      }
    }

    // ---- reservations ----
    if (path === '/rest/v1/reservations') {
      if (req.method === 'GET') {
        const select = qs.get('select') || ''
        // availability route: time_slot_id + party_size for a date.
        // Slot 1 (18:00) is 15/20 booked; slot 2 (20:00) is empty.
        if (select.includes('party_size')) {
          const date = filterValue(qs, 'date')
          const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
          return send(res, 200, [{ time_slot_id: slotId(dow, 0), party_size: 15 }], false)
        }
        // admin upcoming counts: time_slot_id only
        if (select.trim() === 'time_slot_id') {
          return send(res, 200, [
            { time_slot_id: slotId(6, 0) },
            { time_slot_id: slotId(6, 0) },
            { time_slot_id: slotId(0, 1) },
          ], false)
        }
        // admin list: *, time_slots(...) — return the canned set regardless of
        // the date filter so the dashboard always has rows to render.
        return send(res, 200, reservations, false)
      }
      if (req.method === 'POST') {
        if (failNextInsert) {
          failNextInsert = false
          return send(res, 400, { message: 'Slot capacity exceeded: 19 of 20 seats taken, requested 2', code: 'P0001' }, false)
        }
        const row = { id: 'bbbbbbbb-0000-4000-8000-000000000009', status: 'pending', email_sent_at: null, ...body, time_slots: { start_time: '20:00:00', end_time: '22:00:00' } }
        return send(res, 201, [row], false)
      }
      if (req.method === 'PATCH') {
        const id = filterValue(qs, 'id')
        const existing = reservations.find((x) => x.id === id)
        // Unknown id (e.g. the email_sent_at update after an insert): echo a
        // synthetic row instead of mutating the canned dashboard rows.
        const row = existing ? Object.assign(existing, body) : { id, ...body }
        return send(res, 200, [row], isSingle(req))
      }
    }

    send(res, 404, { message: `unhandled ${req.method} ${path}` }, false)
  })
})

server.listen(PORT, () => console.log(`[mock-supabase] listening on ${PORT}`))
