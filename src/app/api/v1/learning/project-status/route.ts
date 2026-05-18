import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getFinalProjectStatus } from "@/lib/learning/final-project";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) return badRequest("courseId шаардлагатай");

    const status = await getFinalProjectStatus(session.user.id, courseId);
    return ok(status);
  } catch (err) {
    console.error("GET /api/v1/learning/project-status error:", err);
    return serverError();
  }
}
