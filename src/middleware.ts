import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { getDashboardHomeByRole } from "@/lib/dashboard-routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/courses", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const ADMIN_ROUTES = ["/admin"];
const ORG_ROUTES = ["/org"];
const INSTRUCTOR_ROUTES = ["/instructor"];
const PUBLIC_FILE = /\.(.*)$/;

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
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
