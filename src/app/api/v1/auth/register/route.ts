import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/modules/auth/application/actions";
import { ok, badRequest, serverError } from "@/shared/utils/api-response";
import { RATE_LIMIT_UNAVAILABLE_MESSAGE, sensitiveRateLimit } from "@/lib/cache";

// Public endpoint: signup must stay unauthenticated, protected by a fail-closed production rate limit.
export async function POST(req: NextRequest) {
  try {
    // Brute force хамгаалалт: 3 удаа/5 минут
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await sensitiveRateLimit(`auth:register:${ip}`, 3, 300);
    if (rl.unavailable) {
      return NextResponse.json(
        { error: RATE_LIMIT_UNAVAILABLE_MESSAGE },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }

    if (!rl.success) {
      return NextResponse.json(
        { error: "Хэт олон оролдлого. Түр хүлээнэ үү." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    const body = await req.json();
    const result = await registerUser(body);

    if ("error" in result) return badRequest("Validation failed", result.error);
    return ok(result, "Бүртгэл амжилттай. Имэйлээ шалгана уу.");
  } catch {
    return serverError();
  }
}
