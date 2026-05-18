import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { issueCourseCertificateIfEligible } from "@/lib/learning/certificates";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  courseId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest("courseId шаардлагатай");

    const result = await issueCourseCertificateIfEligible(session.user.id, parsed.data.courseId);
    return ok({
      issued: result.issued,
      certificate: result.certificate,
    });
  } catch (err) {
    console.error("POST /api/v1/certificates/check-unlock error:", err);
    return serverError();
  }
}
