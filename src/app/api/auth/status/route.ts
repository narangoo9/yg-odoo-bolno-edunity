import { NextResponse } from "next/server";
import { authDiagnostics } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Public OAuth readiness check (no secrets). */
export async function GET() {
  return NextResponse.json({
    googleEnabled: authDiagnostics.googleEnabled,
    hasAuthSecret: authDiagnostics.hasAuthSecret,
    nextAuthUrl: authDiagnostics.nextAuthUrl,
    appUrl: env.appUrl,
    callbackUrl: `${authDiagnostics.nextAuthUrl}/api/auth/callback/google`,
    ready: authDiagnostics.googleEnabled && authDiagnostics.hasAuthSecret,
  });
}
