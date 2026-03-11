import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export function shouldRedirectOAuthRootCallback(request: Pick<NextRequest, "method" | "nextUrl">) {
  return (
    request.method === "GET" &&
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.has("code") &&
    request.nextUrl.searchParams.has("state")
  );
}

export async function proxy(request: NextRequest) {
  // Supabase may redirect OAuth codes to the root URL if the callback URL
  // isn't in the dashboard allowlist. Forward them to the proper handler.
  if (shouldRedirectOAuthRootCallback(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
