// Dev/staging-only sign-in shortcut.
//
// Requires DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD in .env.local, pointing to a
// real Supabase user you've created yourself. No service-role keys, no fake
// sessions — just an automated call to the normal signInWithPassword flow.

import { NextResponse } from "next/server";
import { isDevSignInEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isDevSignInEnabled()) {
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
