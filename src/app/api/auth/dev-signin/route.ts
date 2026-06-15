// Dev-only sign-in shortcut.
//
// Allowed in local development (NODE_ENV="development") and Vercel preview
// deployments (VERCEL_ENV="preview"). Blocked in production.
//
// Requires DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD — in .env.local for local dev,
// or set as Vercel environment variables scoped to "Preview" for staging.
// No service-role keys, no fake sessions — just signInWithPassword.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDevAllowed =
  process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";

export async function POST() {
  if (!isDevAllowed) {
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
