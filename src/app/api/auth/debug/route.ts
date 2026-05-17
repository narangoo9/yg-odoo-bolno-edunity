import { NextResponse } from "next/server";
import { authDiagnostics } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Public development-only endpoint: quick OAuth env diagnostics. It returns 404 in production.
export async function GET() {
  if (env.isProduction) {
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
      thisHost: env.nextAuthUrl,
      callbackUrl: `${env.nextAuthUrl}/api/auth/callback/google`,
    },
  });
}
