/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}))

import { supabase } from '@/lib/supabase'

describe('GET /api/availability', () => {
  it('returns 400 when date param is missing', async () => {
    const req = new NextRequest('http://localhost/api/availability')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('date parameter required')
  })

  it('returns available slots for a valid date', async () => {
    const mockSlots = [
      { id: 'slot-1', start_time: '18:00', end_time: '20:00', max_capacity: 20, is_blocked: false },
    ]
    const mockReservations = [
      { time_slot_id: 'slot-1', party_size: 5 },
    ]

    ;(supabase.from as jest.Mock)
      .mockImplementationOnce(() => ({
        select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: mockSlots, error: null }) }) }),
      }))
      .mockImplementationOnce(() => ({
        select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: mockReservations, error: null }) }) }),
      }))

    const req = new NextRequest('http://localhost/api/availability?date=2026-04-15')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.slots).toHaveLength(1)
    expect(body.slots[0].available).toBe(true)
    expect(body.slots[0].booked).toBe(5)
  })
})
