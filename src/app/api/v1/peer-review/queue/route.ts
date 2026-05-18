import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getFinalProjectReviewQueue } from "@/lib/learning/final-project";
import { ok, unauthorized, serverError } from "@/shared/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const courseId = req.nextUrl.searchParams.get("courseId") ?? undefined;
    const queue = await getFinalProjectReviewQueue(session.user.id, courseId);

    return ok({
      projects: queue.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        demoUrl: item.demoUrl,
        githubUrl: item.githubUrl,
        status: item.status,
        submittedAt: item.submittedAt?.toISOString() ?? null,
        reviewCount: item.reviews.length,
        student: item.student,
        course: item.course,
      })),
    });
  } catch (err) {
    console.error("GET /api/v1/peer-review/queue error:", err);
    return serverError();
  }
}
