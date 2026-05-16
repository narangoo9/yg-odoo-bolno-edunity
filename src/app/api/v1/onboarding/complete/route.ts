import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

const bodySchema = z.object({
  goal: z.string().trim().min(1).max(60).optional(),
  level: z.string().trim().min(1).max(40).optional(),
  skipped: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: true,
        ...(parsed.data.goal ? { learningGoal: parsed.data.goal } : {}),
        ...(parsed.data.level ? { learningLevel: parsed.data.level } : {}),
      },
      select: { id: true },
    });

    return ok({ completed: true });
  } catch (err) {
    console.error("POST /api/v1/onboarding/complete error:", err);
    return serverError();
  }
}
