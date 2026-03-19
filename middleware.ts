import { NextRequest, NextResponse } from "next/server";

// Lightweight session check — cookie presence only.
// Full session validation + admin role check happen in server components and API routes.
const SESSION_COOKIE = "better-auth.session_token";

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

  // Public pages
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/coming-soon")
  ) {
    return NextResponse.next();
  }

  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  // /admin/* — redirect to admin login if no session
  // (admin email verification happens in app/admin/layout.tsx)
  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // /dashboard/* and /welcome — redirect to member login if no session
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/welcome")) {
    if (!hasSession) {
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
