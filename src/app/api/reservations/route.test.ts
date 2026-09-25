/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { sendConfirmationEmail } from '@/lib/resend'

const mockFrom = jest.fn()
const mockAfterCallbacks: Array<() => void | Promise<void>> = []

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: (callback: () => void | Promise<void>) => mockAfterCallbacks.push(callback),
}))

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}))
jest.mock('@/lib/resend', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ limited: false, remaining: 4, resetAt: Date.now() + 60000 }),
}))

const validBody = {
  name: 'Maria Müller',
  email: 'maria@example.de',
  phone: '+49 7022 123456',
  party_size: 2,
  date: '2026-04-15',
  time_slot_id: '550e8400-e29b-41d4-a716-446655440000',
  notes: '',
  language: 'de',
}

describe('POST /api/reservations', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-04-14T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockFrom.mockReset()
    mockAfterCallbacks.length = 0
    ;(sendConfirmationEmail as jest.Mock).mockReset().mockResolvedValue(false)
  })

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Maria' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates a reservation and returns 201', async () => {
    const mockData = [{ ...validBody, id: 'res-uuid-1', status: 'pending', created_at: new Date().toISOString(), time_slots: { start_time: '18:00:00', end_time: '20:00:00' } }]
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: validBody.time_slot_id, day_of_week: 3, is_blocked: false }, error: null }),
        }),
      }),
    })
    mockFrom.mockReturnValueOnce({
      insert: () => ({ select: () => Promise.resolve({ data: mockData, error: null }) }),
    })

    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.reservation.id).toBe('res-uuid-1')
  })

  it('returns the reservation before confirmation email delivery finishes', async () => {
    const mockData = [{ ...validBody, id: 'res-uuid-1', status: 'pending', created_at: new Date().toISOString(), time_slots: { start_time: '18:00:00', end_time: '20:00:00' } }]
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: validBody.time_slot_id, day_of_week: 3, is_blocked: false }, error: null }),
        }),
      }),
    })
    mockFrom.mockReturnValueOnce({
      insert: () => ({ select: () => Promise.resolve({ data: mockData, error: null }) }),
    })

    let finishEmail!: (delivered: boolean) => void
    ;(sendConfirmationEmail as jest.Mock).mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finishEmail = resolve
      })
    )

    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const outcomePromise = Promise.race([
      POST(req).then(() => 'response'),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 100)),
    ])

    await jest.advanceTimersByTimeAsync(100)
    const outcome = await outcomePromise
    finishEmail(false)
    await mockAfterCallbacks[0]()

    expect(outcome).toBe('response')
    expect(sendConfirmationEmail).toHaveBeenCalledWith(mockData[0])
  })

  it('returns 409 when slot capacity is exceeded', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: validBody.time_slot_id, day_of_week: 3, is_blocked: false }, error: null }),
        }),
      }),
    })
    mockFrom.mockReturnValueOnce({
      insert: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'Slot capacity exceeded: 19 of 20 seats taken, requested 3' } }) }),
    })

    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, party_size: 3 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('This time slot is fully booked')
  })

  it('returns 400 when date is not a real calendar day', async () => {
    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, date: '2026-02-31' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when selected slot is blocked', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: validBody.time_slot_id, day_of_week: 3, is_blocked: true }, error: null }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 for cross-origin reservation posts', async () => {
    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})
