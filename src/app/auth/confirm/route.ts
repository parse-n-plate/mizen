import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { EmailOtpType } from "@supabase/supabase-js";

const ALLOWED_HOSTS = process.env.ALLOWED_HOSTS?.split(",").map((h) => h.trim()) ?? [];

function successRedirect(request: Request, origin: string, next: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost && ALLOWED_HOSTS.includes(forwardedHost)) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // PKCE flow — exchange authorization code for session
  if (code) {
    try {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.redirect(`${origin}/?error=auth`);
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return successRedirect(request, origin, next);
      }
    } catch {
      // Supabase unreachable — fall through to error redirect
    }
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // OTP / token-hash flow (e.g. email verification)
  if (token_hash && type) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/?error=auth`);
    }
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return successRedirect(request, origin, next);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
