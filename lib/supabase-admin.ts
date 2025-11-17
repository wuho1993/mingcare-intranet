import { createClient } from '@supabase/supabase-js'

// 管理員客戶端 - 使用 service role key 繞過 RLS
// 僅用於後台管理功能，可以訪問所有數據
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
