// POST /api/v1/gamification/xp — disabled for clients (XP is server-awarded only)

import { forbidden } from "@/shared/utils/api-response";
import { requireSession } from "@/lib/api/session";

export async function POST() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  return forbidden(
    "XP is granted automatically when you complete lessons, quizzes, and daily challenges. It cannot be claimed via API.",
  );
}
