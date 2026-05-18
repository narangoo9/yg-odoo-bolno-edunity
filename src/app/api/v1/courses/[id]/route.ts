import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getCourseById } from "@/modules/courses/infrastructure/queries";
import { updateCourse, deleteCourse } from "@/modules/courses/application/actions";
import { ok, notFound, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  // Public endpoint: published course detail read; draft courses require management access.
  try {
    const { id } = await params;
    const course = await getCourseById(id);
    if (!course) return notFound("Курс олдсонгүй");
    if (course.status !== "PUBLISHED") {
      const session = await auth().catch(() => null);
      const sameOrganization =
        Boolean(course.organizationId) && course.organizationId === session?.user?.organizationId;
      const canManage =
        session?.user?.role === "SUPER_ADMIN" ||
        course.instructorId === session?.user?.id ||
        (session?.user?.role === "COMPANY" && sameOrganization);

      if (!canManage) return notFound("Course not found");
    }

    return ok(course);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  // Private endpoint: updateCourse enforces instructor, org admin, or super admin access.
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const body = await req.json();
    const result = await updateCourse(id, body);

    if ("error" in result) return badRequest("Update failed", result.error);
    return ok(result.data);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  // Private endpoint: deleteCourse enforces instructor or super admin access.
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const result = await deleteCourse(id);

    if ("error" in result) return badRequest(result.error ?? "Delete failed");
    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
