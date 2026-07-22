import { createServerClient } from '@supabase/ssr'
import { createClient } from './server'

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

const mockCreateServerClient = jest.mocked(createServerClient)

describe('Supabase server client', () => {
  beforeEach(() => {
    mockCreateServerClient.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
  })

  it('passes the request cookie store and configured credentials to Supabase SSR', () => {
    const cookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    }

    createClient(cookieStore as never)

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_test',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    )
  })
})
