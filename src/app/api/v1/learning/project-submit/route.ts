import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitFinalProject } from "@/lib/learning/final-project";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(10000),
  demoUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const result = await submitFinalProject({
      userId: session.user.id,
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      demoUrl: parsed.data.demoUrl || undefined,
      githubUrl: parsed.data.githubUrl || undefined,
      attachmentUrl: parsed.data.attachmentUrl || undefined,
    });

    if ("error" in result) return badRequest(result.error ?? "Илгээх боломжгүй");
    return ok({
      submission: {
        id: result.submission.id,
        status: result.submission.status,
        submittedAt: result.submission.submittedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    console.error("POST /api/v1/learning/project-submit error:", err);
    return serverError("Төсөл илгээхэд алдаа гарлаа.");
  }
}
