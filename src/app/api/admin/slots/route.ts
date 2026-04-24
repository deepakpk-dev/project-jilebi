import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminAuthorized } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, is_blocked } = await req.json()
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  if (typeof is_blocked !== 'boolean') {
    return NextResponse.json({ error: 'is_blocked must be a boolean' }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from('time_slots')
    .update({ is_blocked })
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data[0] })
}
