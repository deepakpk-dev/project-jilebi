/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
}))

describe('GET /api/availability', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('returns 400 when date param is missing', async () => {
    const req = new NextRequest('http://localhost/api/availability')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('date parameter required')
  })

  it('returns 400 when date param is malformed', async () => {
    const req = new NextRequest('http://localhost/api/availability?date=not-a-date')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('date must be YYYY-MM-DD')
  })

  it('returns 400 when date is the wrong shape', async () => {
    const req = new NextRequest('http://localhost/api/availability?date=2026-4-5')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('date must be YYYY-MM-DD')
  })

  it('returns empty slots when none exist for the day', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost/api/availability?date=2026-04-13') // Monday = closed
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.slots).toEqual([])
  })

  it('returns available slots with correct booking count', async () => {
    const mockSlots = [
      { id: 'slot-1', start_time: '18:00:00', end_time: '20:00:00', max_capacity: 20, is_blocked: false, day_of_week: 3 },
    ]
    const mockReservations = [
      { time_slot_id: 'slot-1', party_size: 5 },
    ]

    // First call: time_slots query
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: mockSlots, error: null }),
        }),
      }),
    })
    // Second call: reservations query
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          in: () => ({
            neq: () => Promise.resolve({ data: mockReservations, error: null }),
          }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost/api/availability?date=2026-04-15')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.slots).toHaveLength(1)
    expect(body.slots[0].available).toBe(true)
    expect(body.slots[0].booked).toBe(5)
  })
})
