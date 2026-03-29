import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeRedirect } from "@/lib/safe-redirect";

const VALID_OTP_TYPES: Set<string> = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = rawType && VALID_OTP_TYPES.has(rawType) ? (rawType as EmailOtpType) : null;
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  if (token_hash && type) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/?error=auth`);
    }
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return safeRedirect(request, origin, next);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
