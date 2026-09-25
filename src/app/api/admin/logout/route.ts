import { NextRequest, NextResponse } from 'next/server'
import { logoutAdmin } from '@/lib/auth'
import { isSameOrigin } from '@/lib/request-security'

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return logoutAdmin()
}
