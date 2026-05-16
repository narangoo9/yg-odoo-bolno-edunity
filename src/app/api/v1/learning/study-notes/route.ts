import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMarketplacePlan } from "@/lib/marketplace-access";
import { getNoteLimit } from "@/lib/subscription/plans";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/shared/utils/api-response";

const createSchema = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().optional(),
  seconds: z.number().int().min(0).default(0),
  content: z.string().min(1).max(5000),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) return badRequest("courseId шаардлагатай");

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
      select: { id: true },
    });
    if (!enrollment) return forbidden("Бүртгэл олдсонгүй");

    const notes = await db.study_notes.findMany({
      where: { userId: session.user.id, courseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, sectionId: true, seconds: true, content: true, createdAt: true, updatedAt: true },
    });

    return ok(notes);
  } catch (err) {
    console.error("GET /api/v1/learning/study-notes error:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { courseId, sectionId, seconds, content } = parsed.data;

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

    const marketplacePlan = getMarketplacePlan(subscription?.plan, subscription?.status);
    // ALL_ACCESS is unlimited like PRO for note limits
    const plan = marketplacePlan === "ALL_ACCESS" ? "PRO" : marketplacePlan;
    const limit = getNoteLimit(plan);

    if (limit !== null) {
      const count = await db.study_notes.count({ where: { userId: session.user.id } });
      if (count >= limit) {
        return forbidden(`Тэмдэглэлийн хязгаарт (${limit}) хүрлээ. Дэвшилтэт багцаар шинэчлэнэ үү.`);
      }
    }

    const note = await db.study_notes.create({
      data: { userId: session.user.id, courseId, sectionId, seconds, content },
      select: { id: true, sectionId: true, seconds: true, content: true, createdAt: true, updatedAt: true },
    });

    return ok(note);
  } catch (err) {
    console.error("POST /api/v1/learning/study-notes error:", err);
    return serverError();
  }
}
