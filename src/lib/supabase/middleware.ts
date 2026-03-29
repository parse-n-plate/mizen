import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./is-configured";

const PROTECTED_PATHS = ["/cookbook", "/recipe", "/profile"];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedRoute(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("signin", "1");
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies
        .getAll()
        .forEach((cookie) => redirectResponse.cookies.set(cookie.name, cookie.value));
      return redirectResponse;
    }
  } catch {
    // Supabase unreachable — block protected routes, pass through public ones
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return new NextResponse("Service temporarily unavailable", { status: 503 });
    }
  }

  return supabaseResponse;
}
