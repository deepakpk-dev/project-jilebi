/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))
jest.mock('@/lib/resend', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}))

import { supabaseAdmin } from '@/lib/supabase'

const validBody = {
  name: 'Maria Müller',
  email: 'maria@example.de',
  phone: '+49 7022 123456',
  party_size: 2,
  date: '2026-04-15',
  time_slot_id: 'slot-uuid-123',
  notes: '',
  language: 'de',
}

describe('POST /api/reservations', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Maria' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates a reservation and returns 201', async () => {
    const mockInsert = {
      data: [{ ...validBody, id: 'res-uuid-1', status: 'pending', created_at: new Date().toISOString() }],
      error: null,
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      insert: () => ({ select: () => Promise.resolve(mockInsert) }),
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
})
