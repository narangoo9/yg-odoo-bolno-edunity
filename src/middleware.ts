import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { getPostAuthRedirectFromSession } from "@/lib/auth/post-auth-redirect";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/courses",
  "/pricing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/faq",
  "/terms",
  "/privacy",
  "/support",
  "/companies",
];
const ADMIN_ROUTES = ["/admin"];
const ORG_ROUTES = ["/org"];
const COMPANY_LEGACY_ROUTES = ["/instructor"];
const PUBLIC_FILE = /\.(.*)$/;

// Routes a PENDING_VERIFICATION user is allowed to visit
const VERIFICATION_ALLOWED_PREFIXES = [
  "/verify-email",
  "/onboarding",
  "/org/pending",
  "/login",
  "/register",
  "/api/auth",
  "/api/v1/auth",
];

const ORG_PENDING_ALLOWED_PREFIXES = [
  "/org/pending",
  "/verify-email",
  "/login",
  "/api/auth",
  "/api/v1/auth",
];

/** Edge runtime — DB/Prisma ашиглахгүй, зөвхөн authConfig */
const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: { user?: { role?: string; status?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  if (
    PUBLIC_ROUTES.some((r) => pathname === r) ||
    pathname.startsWith("/courses/") ||
    pathname.startsWith("/companies/")
  ) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;
  const status = session.user.status;
  const orgApproved =
    role === "COMPANY"
      ? Boolean((session.user as { orgApproved?: boolean }).orgApproved)
      : true;
  const onboardingCompleted = Boolean(
    (session.user as { onboardingCompleted?: boolean }).onboardingCompleted,
  );
  const profileComplete = Boolean(
    (session.user as { profileComplete?: boolean }).profileComplete,
  );

  // Unverified users: only allow verification-related routes
  if (status === "PENDING_VERIFICATION") {
    const allowed = VERIFICATION_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!allowed) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }
    return NextResponse.next();
  }

  if (role === "COMPANY" && !orgApproved) {
    const allowed = ORG_PENDING_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!allowed) {
      return NextResponse.redirect(new URL("/org/pending", req.url));
    }
    return NextResponse.next();
  }

  if (status === "ACTIVE" && role === "USER") {
    if (!onboardingCompleted && !pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding/welcome", req.url));
    }
    if (
      onboardingCompleted &&
      !profileComplete &&
      pathname !== "/register"
    ) {
      return NextResponse.redirect(new URL("/register", req.url));
    }
  }

  const postAuthRedirect = getPostAuthRedirectFromSession({
    role: (role ?? "USER") as "USER" | "COMPANY" | "SUPER_ADMIN",
    status: status ?? "ACTIVE",
    onboardingCompleted,
    profileComplete,
  });

  if (pathname.startsWith("/verify-email") && status === "ACTIVE") {
    return NextResponse.redirect(new URL(postAuthRedirect, req.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(postAuthRedirect, req.url));
  }

  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (ORG_ROUTES.some((r) => pathname.startsWith(r)) && role !== "COMPANY" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (
    COMPANY_LEGACY_ROUTES.some((r) => pathname.startsWith(r)) &&
    role !== "COMPANY" && role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
