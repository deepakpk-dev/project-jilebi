import { createBrowserClient } from '@supabase/ssr'
import { createClient } from './client'

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}))

const mockCreateBrowserClient = jest.mocked(createBrowserClient)

describe('Supabase browser client', () => {
  beforeEach(() => {
    mockCreateBrowserClient.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
  })

  it('uses the configured project URL and publishable key', () => {
    createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_test',
    )
  })
})
