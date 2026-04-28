import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/modules/auth/application/actions";
import { ok, badRequest, serverError } from "@/shared/utils/api-response";
import { rateLimit } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    // Brute force хамгаалалт: 3 удаа/5 минут
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await rateLimit(`auth:register:${ip}`, 3, 300);
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
