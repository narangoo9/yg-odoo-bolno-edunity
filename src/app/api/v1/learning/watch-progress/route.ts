import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSectionWatchProgress } from "@/lib/learning/progress";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  lastPositionSec: z.number().int().min(0),
  watchedDeltaSec: z.number().int().min(0).max(3600).default(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { courseId, sectionId, lastPositionSec, watchedDeltaSec } = parsed.data;

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
      select: { id: true },
    });
    if (!enrollment) return forbidden("Бүртгэл олдсонгүй");

    await updateSectionWatchProgress(
      session.user.id,
      courseId,
      sectionId,
      lastPositionSec,
      watchedDeltaSec,
    );

    return ok({ saved: true });
  } catch (err) {
    console.error("POST /api/v1/learning/watch-progress error:", err);
    return serverError("Progress хадгалахад алдаа гарлаа.");
  }
}
