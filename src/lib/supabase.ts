import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | undefined
let _supabaseAdmin: SupabaseClient | undefined

// Browser client — safe to expose, uses anon key + RLS
export function getSupabase(): SupabaseClient {
  return (_supabase ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
}

// Server-only client — uses service role key, bypasses RLS
export function getSupabaseAdmin(): SupabaseClient {
  return (_supabaseAdmin ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ))
}
