/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/admin/logout', () => {
  it('clears the session cookie for a same-origin request', async () => {
    const req = new NextRequest('http://localhost/api/admin/logout', {
      method: 'POST',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('jilebi_admin_session=;')
    expect(setCookie).toContain('Max-Age=0')
  })

  it('rejects a cross-origin request', async () => {
    const req = new NextRequest('http://localhost/api/admin/logout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})
