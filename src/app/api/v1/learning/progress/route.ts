import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCourseLearningState } from "@/lib/learning/progress";
import { getFinalProjectStatus } from "@/lib/learning/final-project";
import { getSectionWatchMetrics } from "@/lib/learning/section-watch";
import { updateSectionWatchProgress } from "@/lib/learning/progress";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

const postSchema = z.object({
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
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { courseId, sectionId, lastPositionSec, watchedDeltaSec } = parsed.data;

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json({ success: false, error: "Бүртгэл олдсонгүй" }, { status: 403 });
    }

    const section = await db.courseSection.findFirst({
      where: { id: sectionId, courseId },
      select: { id: true },
    });
    if (!section) return badRequest("Section not found");

    await updateSectionWatchProgress(
      session.user.id,
      courseId,
      sectionId,
      lastPositionSec,
      watchedDeltaSec,
    );

    const watch = await getSectionWatchMetrics(session.user.id, courseId, sectionId);
    return ok({ saved: true, watch });
  } catch (err) {
    console.error("POST /api/v1/learning/progress error:", err);
    return serverError("Progress хадгалахад алдаа гарлаа.");
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) return badRequest("courseId hiamt");

    // Verify enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json({ success: false, error: "Бүртгэл олдсонгүй" }, { status: 403 });
    }

    const [state, finalProject, sections] = await Promise.all([
      getCourseLearningState(session.user.id, courseId),
      getFinalProjectStatus(session.user.id, courseId),
      db.courseSection.findMany({
        where: { courseId },
        select: { id: true },
      }),
    ]);

    const watchBySection: Record<string, Awaited<ReturnType<typeof getSectionWatchMetrics>>> = {};
    await Promise.all(
      sections.map(async (section) => {
        const metrics = await getSectionWatchMetrics(session.user.id, courseId, section.id);
        if (metrics) watchBySection[section.id] = metrics;
      }),
    );

    return ok({ ...state, finalProject, watchBySection });
  } catch (err) {
    console.error("GET /api/v1/learning/progress error:", err);
    return serverError();
  }
}
