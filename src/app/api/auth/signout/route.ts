import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/`, { status: 302 })
}
