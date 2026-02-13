import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // These variables are pulled from your .env.local file
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}