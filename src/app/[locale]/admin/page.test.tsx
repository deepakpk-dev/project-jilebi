import { render, screen } from '@testing-library/react'
import AdminPage from './page'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}))
jest.mock('@/lib/auth', () => ({
  isAdminSession: () => Promise.resolve(true),
}))
jest.mock('next-intl/server', () => ({
  getTranslations: () =>
    Promise.resolve((key: string, values?: { message?: string }) =>
      key === 'fetch_error' ? `Unable to load data: ${values?.message}` : key,
    ),
  setRequestLocale: jest.fn(),
}))
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))
jest.mock('@/components/admin/ReservationTable', () => function MockReservationTable() {
  return <div>reservation table</div>
})
jest.mock('@/components/admin/SlotManager', () => function MockSlotManager() {
  return <div>slot manager</div>
})
jest.mock('@/components/admin/AdminLogin', () => function MockAdminLogin() {
  return <div>admin login</div>
})
jest.mock('@/components/admin/LogoutButton', () => function MockLogoutButton() {
  return <button>logout</button>
})

describe('AdminPage slot warnings', () => {
  beforeEach(() => {
    mockFrom.mockReset()

    mockFrom
      .mockReturnValueOnce({
        select: () => ({
          order: () => ({
            gte: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => {
          const ordered = {
            order: () => ordered,
            then: (resolve: (value: unknown) => void) =>
              Promise.resolve({ data: [], error: null }).then(resolve),
          }
          return ordered
        },
      })
      .mockReturnValueOnce({
        select: () => ({
          gte: () => ({
            neq: () =>
              Promise.resolve({ data: null, error: { message: 'warning query unavailable' } }),
          }),
        }),
      })
  })

  it('fails closed when upcoming reservation warnings cannot be loaded', async () => {
    const page = await AdminPage({
      params: Promise.resolve({ locale: 'de' }),
      searchParams: Promise.resolve({}),
    })

    render(page)

    expect(screen.getByText(/warning query unavailable/)).toBeInTheDocument()
    expect(screen.queryByText('slot manager')).not.toBeInTheDocument()
  })
})
