import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Only create client if environment variables are available
  // This prevents errors during build time
  if (typeof window === 'undefined') {
    // During build/SSR, return a mock client
    return null as any
  }
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export a getter function instead of a singleton to avoid build-time initialization
let _supabase: ReturnType<typeof createBrowserClient> | null = null
export const supabase = (() => {
  if (typeof window === 'undefined') return null as any
  if (!_supabase) {
    _supabase = createClient()
  }
  return _supabase
})()
