import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'

export async function POST(request: Request) {
  const { origin } = new URL(request.url)

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/`, { status: 302 })
  }

  try {
    const supabase = await createClient()
    await supabase!.auth.signOut()
  } catch {
    // Supabase unreachable — redirect home regardless
  }

  return NextResponse.redirect(`${origin}/`, { status: 302 })
}
