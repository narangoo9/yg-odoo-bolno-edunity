import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeCourseSectionInDB } from "@/lib/learning/progress";
import { canAccessLearningItem } from "@/lib/marketplace-access";
import { getMarketplacePlan } from "@/lib/marketplace-access";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { courseId, sectionId } = parsed.data;

    // Verify enrollment
    const [enrollment, subscription] = await Promise.all([
      db.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.user.id, courseId } },
        select: { id: true },
      }),
      db.subscription.findUnique({
        where: { userId: session.user.id },
        select: { plan: true, status: true },
      }),
    ]);
    if (!enrollment) return forbidden("Бүртгэл олдсонгүй");

    // Verify section belongs to course and user can access it
    const orderedSections = await db.courseSection.findMany({
      where: { courseId },
      select: { id: true },
      orderBy: [{ order: "asc" }, { startSeconds: "asc" }],
    });
    const sectionIndex = orderedSections.findIndex((s) => s.id === sectionId);
    if (sectionIndex < 0) return badRequest("Section олдсонгүй");

    const totalSections = orderedSections.length;
    const plan = getMarketplacePlan(subscription?.plan, subscription?.status);

    if (!canAccessLearningItem(plan, sectionIndex, totalSections)) {
      return forbidden("Энэ section таны багцад нээгдээгүй байна.");
    }

    const result = await completeCourseSectionInDB(session.user.id, courseId, sectionId);
    return ok(result);
  } catch (err) {
    console.error("POST /api/v1/learning/section-complete error:", err);
    return serverError("Progress хадгалахад алдаа гарлаа.");
  }
}
