import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCourseLearningState } from "@/lib/learning/progress";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

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

    const state = await getCourseLearningState(session.user.id, courseId);
    return ok(state);
  } catch (err) {
    console.error("GET /api/v1/learning/progress error:", err);
    return serverError();
  }
}
