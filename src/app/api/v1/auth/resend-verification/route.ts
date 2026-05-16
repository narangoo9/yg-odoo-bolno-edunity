import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resendVerificationEmail } from "@/modules/auth/application/actions";

// TODO: add rate limiting (e.g. 3 requests / 10 min) when rate limit helper supports authenticated users
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
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
