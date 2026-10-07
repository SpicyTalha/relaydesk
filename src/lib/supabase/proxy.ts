import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/w/", "/onboarding", "/admin", "/account", "/print/"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // A new client per request (Fluid compute reuses instances across requests).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Nothing may run between createServerClient and getClaims (Supabase guidance):
  // getClaims verifies the JWT and refreshes an expired session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname, search } = request.nextUrl;
  if (!signedIn && PROTECTED_PREFIXES.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // The admin area answers a plain 404 to everyone but platform admins (app_metadata is server-set).
  // The page checks again on its own; this just keeps it from admitting it exists.
  if (signedIn && (pathname === "/admin" || pathname.startsWith("/admin/")) && data?.claims?.app_metadata?.platform_role !== "admin") {
    const hidden = NextResponse.rewrite(new URL("/_not-found", request.url));
    response.cookies.getAll().forEach((cookie) => hidden.cookies.set(cookie));
    return hidden;
  }

  return response;
}
