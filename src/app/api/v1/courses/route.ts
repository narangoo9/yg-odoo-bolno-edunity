import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getCourses } from "@/modules/courses/infrastructure/queries";
import { createCourse } from "@/modules/courses/application/actions";
import { ok, created, unauthorized, forbidden, badRequest, serverError } from "@/shared/utils/api-response";
import type { CourseLevel } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const result = await getCourses({
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      level: (searchParams.get("level") as CourseLevel) ?? undefined,
      language: searchParams.get("language") ?? undefined,
      isFree: searchParams.get("isFree") === "true",
      page: Number(searchParams.get("page") ?? 1),
      limit: Math.min(Number(searchParams.get("limit") ?? 12), 50),
      sortBy: (searchParams.get("sortBy") as "newest" | "popular" | "rating") ?? "newest",
    });

    return ok(result);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const allowedRoles = ["INSTRUCTOR", "ORG_ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.user.role)) return forbidden();

    const body = await req.json();
    const result = await createCourse(body);

    if ("error" in result) return badRequest("Validation failed", result.error);
    return created(result.data);
  } catch {
    return serverError();
  }
}
