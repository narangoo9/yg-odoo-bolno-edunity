import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { enrollCourse } from "@/modules/courses/application/actions";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { id: courseId } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await enrollCourse({ courseId, ...body });

    if ("error" in result) return badRequest(result.error as string);
    return ok(result);
  } catch {
    return serverError();
  }
}
