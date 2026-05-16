import { NextResponse } from "next/server";
import { authDiagnostics } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/auth/debug
// Quick health-check for OAuth env vars. Only enabled in development so secrets
// aren't probeable in production.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 404 });
  }

  return NextResponse.json({
    ...authDiagnostics,
    hints: {
      googleSignInRequires: [
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set (non-empty)",
        "AUTH_SECRET or NEXTAUTH_SECRET set",
        "NEXTAUTH_URL matches the host you're browsing on",
        "Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs includes <NEXTAUTH_URL>/api/auth/callback/google",
      ],
      thisHost: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "(NEXTAUTH_URL not set)",
      callbackUrl: `${process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000"}/api/auth/callback/google`,
    },
  });
}
