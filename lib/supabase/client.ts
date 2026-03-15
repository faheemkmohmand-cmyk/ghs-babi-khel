import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use supabase-js directly - stores session in localStorage (persists across tabs)
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!client) {
    client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'ghs-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        }
      }
    )
  }
  return client
}
