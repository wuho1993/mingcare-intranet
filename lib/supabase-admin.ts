import { createClient } from '@supabase/supabase-js'

// 管理員客戶端 - 使用 service role key 繞過 RLS
// 僅用於後台管理功能，可以訪問所有數據
// Lazy initialization to avoid build-time errors
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export const getSupabaseAdmin = () => {
  // During build/SSR, return a mock client
  if (typeof window === 'undefined') {
    return null as any
  }
  
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return _supabaseAdmin
}

// For backward compatibility, export a getter that works during runtime
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseAdmin()
    if (!client) return undefined
    return (client as any)[prop]
  }
})
