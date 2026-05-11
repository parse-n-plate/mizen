// Dev-only sign-in shortcut.
//
// Gated on NODE_ENV === "development" — returns 404 in any other environment
// (preview, staging, production). `next build` / `next start` and Vercel set
// NODE_ENV="production" on all deploys, so this route is unreachable there.
//
// Requires DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD in .env.local, pointing to a
// real Supabase user you've created yourself. No service-role keys, no fake
// sessions — just an automated call to the normal signInWithPassword flow.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const email = process.env.DEV_AUTH_EMAIL;
  const password = process.env.DEV_AUTH_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      {
        error:
          "Set DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD in .env.local (must match a Supabase user).",
      },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
