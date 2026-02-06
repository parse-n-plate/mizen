import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // You'll need a server client helper too

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return the user to an error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}