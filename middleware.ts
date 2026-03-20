import { NextRequest, NextResponse } from "next/server";

// Better Auth cookie names.
//
// The session cookie name depends on the `useSecureCookies` setting in lib/auth.ts:
//   useSecureCookies: false  →  "better-auth.session_token"          (our config)
//   useSecureCookies: true   →  "__Secure-better-auth.session_token"
//
// We check BOTH so a config change never causes a silent redirect loop.
const SESSION_COOKIES = [
  "better-auth.session_token",         // useSecureCookies: false (our setting)
  "__Secure-better-auth.session_token", // useSecureCookies: true  (fallback check)
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => !!request.cookies.get(name)?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: API routes, static assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Public pages (no session required)
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/coming-soon")
  ) {
    return NextResponse.next();
  }

  const authenticated = hasSessionCookie(request);

  // /admin/* — redirect to admin login if no session
  // (admin email verification happens in app/admin/layout.tsx server component)
  if (pathname.startsWith("/admin")) {
    if (!authenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // /dashboard/* and /welcome — redirect to member login if no session
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/welcome")) {
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
