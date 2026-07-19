/**
 * @jest-environment node
 */
import { updateReservationStatus, updateSlotBlocked } from './actions'

const mockFrom = jest.fn()
const mockSendCancellationEmail = jest.fn()
const mockSendReservationConfirmedEmail = jest.fn()
const mockIsAdminSession = jest.fn()

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}))
jest.mock('@/lib/auth', () => ({
  isAdminSession: () => mockIsAdminSession(),
}))
jest.mock('@/lib/resend', () => ({
  sendCancellationEmail: (...args: unknown[]) => mockSendCancellationEmail(...args),
  sendReservationConfirmedEmail: (...args: unknown[]) =>
    mockSendReservationConfirmedEmail(...args),
}))

function mockUpdateReturns(reservation: unknown) {
  mockFrom.mockReturnValueOnce({
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: reservation, error: null }),
        }),
      }),
    }),
  })
}

describe('updateReservationStatus', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockSendCancellationEmail.mockReset()
    mockSendReservationConfirmedEmail.mockReset()
    mockIsAdminSession.mockReset()
    mockIsAdminSession.mockResolvedValue(true)
  })

  it('awaits cancellation email delivery before resolving', async () => {
    const reservation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Maria Müller',
      email: 'maria@example.de',
      date: '2026-04-15',
      language: 'de',
      party_size: 2,
      status: 'cancelled',
      time_slots: { start_time: '18:00:00', end_time: '20:00:00' },
    }

    let resolveEmail: (() => void) | undefined
    mockSendCancellationEmail.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveEmail = resolve
        }),
    )

    mockFrom.mockReturnValueOnce({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: reservation, error: null }),
          }),
        }),
      }),
    })

    let settled = false
    const resultPromise = updateReservationStatus(reservation.id, 'cancelled').then((result) => {
      settled = true
      return result
    })

    await new Promise((resolve) => setImmediate(resolve))
    expect(mockSendCancellationEmail).toHaveBeenCalledWith(reservation)
    expect(settled).toBe(false)

    resolveEmail?.()
    await expect(resultPromise).resolves.toEqual(reservation)
    expect(mockSendReservationConfirmedEmail).not.toHaveBeenCalled()
  })

  it('sends the confirmed email (and not the cancellation email) when confirming', async () => {
    const reservation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Maria Müller',
      email: 'maria@example.de',
      date: '2026-04-15',
      language: 'de',
      party_size: 2,
      status: 'confirmed',
      time_slots: { start_time: '18:00:00', end_time: '20:00:00' },
    }
    mockSendReservationConfirmedEmail.mockResolvedValue(true)
    mockUpdateReturns(reservation)

    const result = await updateReservationStatus(reservation.id, 'confirmed')

    expect(result).toEqual(reservation)
    expect(mockSendReservationConfirmedEmail).toHaveBeenCalledTimes(1)
    expect(mockSendReservationConfirmedEmail).toHaveBeenCalledWith(reservation)
    expect(mockSendCancellationEmail).not.toHaveBeenCalled()
  })

  it('still resolves with the updated row when the confirmed email rejects', async () => {
    const reservation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Maria Müller',
      email: 'maria@example.de',
      date: '2026-04-15',
      language: 'de',
      party_size: 2,
      status: 'confirmed',
      time_slots: { start_time: '18:00:00', end_time: '20:00:00' },
    }
    mockSendReservationConfirmedEmail.mockRejectedValue(new Error('resend down'))
    mockUpdateReturns(reservation)

    await expect(
      updateReservationStatus(reservation.id, 'confirmed'),
    ).resolves.toEqual(reservation)
  })
})

describe('updateSlotBlocked', () => {
  const slotId = '11111111-1111-4111-8111-111111111111'
  const slotRow = {
    id: slotId,
    day_of_week: 5,
    start_time: '18:00:00',
    end_time: '20:00:00',
    max_capacity: 20,
    is_blocked: true,
  }

  function mockSlotUpdate(captureUpdate?: (arg: unknown) => void) {
    const eq = jest.fn(() => ({
      select: () => ({ single: () => Promise.resolve({ data: slotRow, error: null }) }),
    }))
    mockFrom.mockReturnValueOnce({
      update: (arg: unknown) => {
        captureUpdate?.(arg)
        return { eq }
      },
    })
    return { eq }
  }

  beforeEach(() => {
    mockFrom.mockReset()
    mockIsAdminSession.mockReset()
    mockIsAdminSession.mockResolvedValue(true)
  })

  it('throws Unauthorized and does not touch the database when not signed in', async () => {
    mockIsAdminSession.mockResolvedValue(false)
    await expect(updateSlotBlocked(slotId, true)).rejects.toThrow('Unauthorized')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('throws on a non-UUID slot id', async () => {
    await expect(updateSlotBlocked('not-a-uuid', true)).rejects.toThrow('Invalid slot id')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('updates is_blocked and returns the row', async () => {
    let updateArg: unknown
    const { eq } = mockSlotUpdate((arg) => {
      updateArg = arg
    })

    const result = await updateSlotBlocked(slotId, true)

    expect(result).toEqual(slotRow)
    expect(updateArg).toEqual({ is_blocked: true })
    expect(eq).toHaveBeenCalledWith('id', slotId)
  })

  it('throws Unable to update slot when Supabase returns an error', async () => {
    mockFrom.mockReturnValueOnce({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
          }),
        }),
      }),
    })
    await expect(updateSlotBlocked(slotId, false)).rejects.toThrow('Unable to update slot')
  })
})
