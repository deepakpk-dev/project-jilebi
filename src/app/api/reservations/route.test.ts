/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'

const mockFrom = jest.fn()

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
  beforeEach(() => {
    mockFrom.mockReset()
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
    mockFrom.mockReturnValue({
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

  it('returns 409 when slot capacity is exceeded', async () => {
    mockFrom.mockReturnValue({
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
})
