// Local development and explicitly configured previews only.
// Uses an ordinary Supabase password session. Credentials never reach the browser.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDevAuthMode } from "@/lib/dev-auth";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json({ enabled: getDevAuthMode() !== null }, { headers });
}

export async function POST() {
  const mode = getDevAuthMode();
  if (!mode) return new NextResponse(null, { status: 404, headers });

  const email =
    mode === "preview" ? process.env.PREVIEW_DEV_AUTH_EMAIL : process.env.DEV_AUTH_EMAIL;
  const password =
    mode === "preview" ? process.env.PREVIEW_DEV_AUTH_PASSWORD : process.env.DEV_AUTH_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      {
        error:
          "Set DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD in .env.local (must match a Supabase user).",
      },
      { status: 500, headers }
    );
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503, headers });
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json(
        { error: "Dev sign-in failed. Check the test account configuration." },
        { status: 400, headers }
      );
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json(
      { error: "Dev sign-in is unavailable. Please try again." },
      { status: 503, headers }
    );
  }
}
