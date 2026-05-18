import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { getDashboardHomeByRole } from "@/lib/dashboard-routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/courses", "/pricing", "/login", "/register", "/forgot-password", "/reset-password"];
const ADMIN_ROUTES = ["/admin"];
const ORG_ROUTES = ["/org"];
const INSTRUCTOR_ROUTES = ["/instructor"];
const PUBLIC_FILE = /\.(.*)$/;

// Routes a PENDING_VERIFICATION user is allowed to visit
const VERIFICATION_ALLOWED_PREFIXES = ["/verify-email", "/onboarding", "/login", "/register", "/api/auth", "/api/v1/auth"];

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: { user?: { role?: string; status?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith("/courses/"))) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;
  const status = session.user.status;

  // Unverified users: only allow verification-related routes
  if (status === "PENDING_VERIFICATION") {
    const allowed = VERIFICATION_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!allowed) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }
    return NextResponse.next();
  }

  // Verified user visiting /verify-email → redirect to their dashboard
  if (pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL(getDashboardHomeByRole(role), req.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(getDashboardHomeByRole(role), req.url));
  }

  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (ORG_ROUTES.some((r) => pathname.startsWith(r)) && role !== "ORG_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (
    INSTRUCTOR_ROUTES.some((r) => pathname.startsWith(r)) &&
    role !== "INSTRUCTOR" && role !== "ORG_ADMIN" && role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
