import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { RATE_LIMIT_UNAVAILABLE_MESSAGE, sensitiveRateLimit } from "@/lib/cache";

// Public endpoint: NextAuth owns CSRF, callback, session, and OAuth provider handling here.
export const GET = handlers.GET;

async function readCredentialsEmail(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const cloned = req.clone();

  try {
    if (contentType.includes("application/json")) {
      const body = (await cloned.json()) as { email?: unknown };
      return typeof body.email === "string" ? body.email.trim().toLowerCase() : "unknown";
    }

    const form = await cloned.formData();
    const email = form.get("email");
    return typeof email === "string" ? email.trim().toLowerCase() : "unknown";
  } catch {
    return "unknown";
  }
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.endsWith("/api/auth/callback/credentials")) {
    const email = await readCredentialsEmail(req);
    const rl = await sensitiveRateLimit(`auth:login:${email}`, 5, 300);

    if (rl.unavailable) {
      return NextResponse.json(
        { error: RATE_LIMIT_UNAVAILABLE_MESSAGE },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }
  }

  return handlers.POST(req);
}
