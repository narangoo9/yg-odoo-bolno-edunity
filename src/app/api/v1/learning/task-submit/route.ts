import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/shared/utils/api-response";

const schema = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  content: z.string().min(20).max(5000),
  submissionUrl: z.string().url().optional().or(z.literal("")),
});

async function assignReviewers(submissionId: string, studentId: string, courseId: string) {
  const existing = await db.courseSectionTaskReview.findMany({
    where: { submissionId },
    select: { reviewerId: true },
  });
  const existingIds = new Set(existing.map((review) => review.reviewerId));

  const enrollments = await db.enrollment.findMany({
    where: {
      courseId,
      status: "ACTIVE",
      studentId: { not: studentId },
    },
    select: { studentId: true },
    take: 8,
  });

  const reviewerIds = enrollments
    .map((enrollment) => enrollment.studentId)
    .filter((id) => !existingIds.has(id))
    .slice(0, 3);

  if (reviewerIds.length === 0) return 0;

  await db.courseSectionTaskReview.createMany({
    data: reviewerIds.map((reviewerId) => ({ submissionId, reviewerId })),
    skipDuplicates: true,
  });

  return reviewerIds.length;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Буруу оролт", parsed.error.flatten().fieldErrors);

    const { courseId, sectionId, content, submissionUrl } = parsed.data;

    const [enrollment, section, completion] = await Promise.all([
      db.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.user.id, courseId } },
        select: { id: true },
      }),
      db.courseSection.findFirst({
        where: { id: sectionId, courseId },
        select: { id: true, title: true, order: true },
      }),
      db.course_section_completions.findUnique({
        where: { sectionId_studentId: { sectionId, studentId: session.user.id } },
        select: { id: true },
      }),
    ]);

    if (!enrollment) return forbidden("Бүртгэл олдсонгүй");
    if (!section) return badRequest("Section олдсонгүй");
    if (!completion) return forbidden("Task илгээхийн өмнө энэ video section-ийг дуусгана уу.");

    const existing = await db.courseSectionTaskSubmission.findUnique({
      where: { studentId_sectionId: { studentId: session.user.id, sectionId } },
      select: { id: true, status: true, reviews: { select: { isCompleted: true } } },
    });

    if (existing?.status === "GRADED") {
      return forbidden("Энэ task аль хэдийн peer review-ээр үнэлэгдсэн байна.");
    }
    if (existing?.reviews.some((review) => review.isCompleted)) {
      return forbidden("Peer review эхэлсэн task-ийг дахин засах боломжгүй.");
    }

    const submission = await db.courseSectionTaskSubmission.upsert({
      where: { studentId_sectionId: { studentId: session.user.id, sectionId } },
      create: {
        courseId,
        sectionId,
        studentId: session.user.id,
        title: `Section ${section.order}: ${section.title}`,
        content,
        submissionUrl: submissionUrl || null,
        status: "SUBMITTED",
      },
      update: {
        title: `Section ${section.order}: ${section.title}`,
        content,
        submissionUrl: submissionUrl || null,
        status: "SUBMITTED",
        submittedAt: new Date(),
        score: null,
        feedback: null,
        gradedAt: null,
      },
      select: {
        id: true,
        sectionId: true,
        status: true,
        score: true,
        submittedAt: true,
      },
    });

    const assigned = await assignReviewers(submission.id, session.user.id, courseId);
    const status = assigned > 0 ? "UNDER_REVIEW" : "SUBMITTED";
    if (status !== submission.status) {
      await db.courseSectionTaskSubmission.update({
        where: { id: submission.id },
        data: { status },
      });
    }

    await db.course_section_task_states.upsert({
      where: { userId_sectionId: { userId: session.user.id, sectionId } },
      create: { userId: session.user.id, courseId, sectionId, state: "submitted" },
      update: { state: "submitted" },
    });

    return ok({
      ...submission,
      status,
      submittedAt: submission.submittedAt.toISOString(),
      assignedReviewers: assigned,
    });
  } catch (err) {
    console.error("POST /api/v1/learning/task-submit error:", err);
    return serverError("Task хадгалахад алдаа гарлаа.");
  }
}
