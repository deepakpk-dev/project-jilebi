/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from './middleware'

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

const mockCreateServerClient = jest.mocked(createServerClient)

describe('Supabase session middleware', () => {
  beforeEach(() => {
    mockCreateServerClient.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
  })

  it('refreshes auth claims and forwards refreshed cookies to the response', async () => {
    let cookieOptions: { cookies: { setAll: (cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void } } | undefined
    const getClaims = jest.fn().mockImplementation(async () => {
      cookieOptions?.cookies.setAll([{ name: 'sb-access-token', value: 'refreshed', options: { httpOnly: true } }])
      return { data: { claims: {} }, error: null }
    })
    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      cookieOptions = options as typeof cookieOptions
      return { auth: { getClaims } } as never
    })

    const request = new NextRequest('http://localhost/de')
    const response = await updateSession(request)

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_test',
      expect.any(Object),
    )
    expect(getClaims).toHaveBeenCalledTimes(1)
    expect(response.cookies.get('sb-access-token')?.value).toBe('refreshed')
  })
})
