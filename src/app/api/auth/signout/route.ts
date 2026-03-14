import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);

  // CSRF: verify the request originated from our own domain
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/`, { status: 302 });
    }
    await supabase.auth.signOut();
  } catch (err) {
    logger.debug({ err }, "Supabase signOut failed, redirecting anyway");
  }

  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
