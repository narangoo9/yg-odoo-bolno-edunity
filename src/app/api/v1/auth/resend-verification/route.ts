import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RATE_LIMIT_UNAVAILABLE_MESSAGE, sensitiveRateLimit } from "@/lib/cache";
import { resendVerificationEmail } from "@/modules/auth/application/actions";

// Private endpoint: authenticated users can resend their own email verification only.
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const rl = await sensitiveRateLimit(`auth:resend-verification:${session.user.id}`, 3, 600);
    if (rl.unavailable) {
      return NextResponse.json(
        { error: RATE_LIMIT_UNAVAILABLE_MESSAGE },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many verification emails. Please try again later." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    const result = await resendVerificationEmail(session.user.id);

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
