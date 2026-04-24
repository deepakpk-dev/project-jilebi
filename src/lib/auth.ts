import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'jilebi_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

function getSecret(): string {
  return process.env.ADMIN_PASSWORD!
}

/** Constant-time string comparison. Hashes both sides so unequal lengths don't throw. */
function timingSafeStringEqual(a: string, b: string): boolean {
  const aHash = crypto.createHash('sha256').update(a).digest()
  const bHash = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(aHash, bHash)
}

/** Create a signed session token (HMAC of timestamp) */
function createSessionToken(): string {
  const payload = `admin:${Date.now()}`
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex')
  return `${payload}.${signature}`
}

/** Verify a session token's signature */
function verifySessionToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.substring(0, lastDot)
  const signature = token.substring(lastDot + 1)
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex')
  if (!timingSafeStringEqual(signature, expected)) return false

  // Check expiry
  const timestamp = parseInt(payload.split(':')[1], 10)
  if (isNaN(timestamp)) return false
  return Date.now() - timestamp < SESSION_MAX_AGE * 1000
}

/** Verify admin password and set httpOnly session cookie */
export async function loginAdmin(password: string): Promise<NextResponse> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !timingSafeStringEqual(password, expected)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = createSessionToken()
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return response
}

/** Check if request has a valid admin session cookie */
export function isAdminAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifySessionToken(token)
}

/** Check admin session from server component via cookies() */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifySessionToken(token)
}

/** Clear admin session cookie */
export async function logoutAdmin(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
