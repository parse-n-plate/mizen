import { NextResponse } from "next/server";

/**
 * Redirect after auth, validating x-forwarded-host against an allowlist.
 */
const ALLOWED_HOSTS = new Set((process.env.ALLOWED_HOSTS ?? "").split(",").filter(Boolean));

export function safeRedirect(request: Request, origin: string, next: string): NextResponse {
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost && ALLOWED_HOSTS.has(forwardedHost)) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
