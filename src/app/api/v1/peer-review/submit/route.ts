import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitFinalProjectReview } from "@/lib/learning/final-project";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  submissionId: z.string().min(1),
  starRating: z.number().int().min(1).max(5),
  rubricUnderstanding: z.number().int().min(0).max(100),
  rubricEffort: z.number().int().min(0).max(100),
  rubricFunctionality: z.number().int().min(0).max(100),
  rubricDesign: z.number().int().min(0).max(100),
  feedback: z.string().trim().min(10).max(5000),
  decision: z.enum(["PASS", "NEEDS_IMPROVEMENT"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const result = await submitFinalProjectReview({
      reviewerId: session.user.id,
      ...parsed.data,
    });

    if ("error" in result) return badRequest(result.error ?? "Review хадгалах боломжгүй");
    return ok(result);
  } catch (err) {
    console.error("POST /api/v1/peer-review/submit error:", err);
    if (String(err).includes("Unique constraint")) {
      return badRequest("Та энэ төслийг аль хэдийн review хийсэн байна.");
    }
    return serverError("Review хадгалахад алдаа гарлаа.");
  }
}
