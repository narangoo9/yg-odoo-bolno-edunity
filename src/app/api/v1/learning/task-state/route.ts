import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSectionTaskState } from "@/lib/learning/progress";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  state: z.enum(["not-started", "draft", "submitted", "completed"]),
});

export async function POST(req: NextRequest) {
  // Private endpoint: enrolled students can update task state only for sections in that course.
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { courseId, sectionId, state } = parsed.data;

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
      select: { id: true },
    });
    if (!enrollment) return forbidden("Бүртгэл олдсонгүй");

    const section = await db.courseSection.findFirst({
      where: { id: sectionId, courseId },
      select: { id: true },
    });
    if (!section) return badRequest("Section not found");

    await updateSectionTaskState(session.user.id, courseId, sectionId, state);
    return ok({ state });
  } catch (err) {
    console.error("POST /api/v1/learning/task-state error:", err);
    return serverError("Progress хадгалахад алдаа гарлаа.");
  }
}
