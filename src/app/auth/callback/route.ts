import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // Supabase sends error params when it rejects an OAuth attempt (e.g. signups disabled)
  const errorCode = searchParams.get("error_code");
  if (errorCode === "signup_disabled") {
    return NextResponse.redirect(`${origin}/?error=not-approved`);
  }
  if (searchParams.has("error")) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // PKCE flow — exchange authorization code for session
  if (code) {
    try {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.redirect(`${origin}/?error=auth`);
      }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // For OAuth sign-ins, reject users who weren't pre-approved.
        // Pre-approved users have an "email" identity (created via admin/OTP).
        const user = data.session?.user;
        const isOAuth = user?.app_metadata?.provider !== "email";
        if (isOAuth && user) {
          const hasEmailIdentity = user.identities?.some(
            (i) => i.provider === "email"
          );
          if (!hasEmailIdentity) {
            const admin = createAdminClient();
            if (admin) {
              await admin.auth.admin.deleteUser(user.id);
            } else {
              await supabase.auth.signOut();
            }
            return NextResponse.redirect(`${origin}/?error=not-approved`);
          }
        }
        return successRedirect(request, origin, next);
      }
    } catch {
      // Supabase unreachable — fall through to error redirect
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
