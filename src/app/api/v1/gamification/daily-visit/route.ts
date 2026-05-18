import { auth } from "@/lib/auth";
import { recordDailyVisit } from "@/modules/gamification/application/gamification-service";
import { ok, unauthorized, serverError } from "@/shared/utils/api-response";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    if (session.user.role !== "USER") return ok({ streak: 0, skipped: true });

    const streak = await recordDailyVisit(session.user.id);
    return ok({ streak });
  } catch (err) {
    console.error("POST /api/v1/gamification/daily-visit error:", err);
    return serverError();
  }
}
