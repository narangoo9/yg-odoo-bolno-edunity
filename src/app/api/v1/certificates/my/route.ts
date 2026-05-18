import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { countReviewsGiven } from "@/lib/learning/final-project";
import { ok, unauthorized, serverError } from "@/shared/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const [certificates, reviewsGiven] = await Promise.all([
      db.certificate.findMany({
        where: { studentId: session.user.id },
        include: {
          course: { select: { id: true, title: true, thumbnailUrl: true } },
          program: { select: { id: true, title: true } },
        },
        orderBy: { issuedAt: "desc" },
      }),
      countReviewsGiven(session.user.id),
    ]);

    return ok({
      reviewsGiven,
      certificates: certificates.map((cert) => ({
        id: cert.id,
        certificateNo: cert.certificateNo,
        verificationCode: cert.verificationCode,
        issuedAt: cert.issuedAt.toISOString(),
        pdfUrl: cert.pdfUrl,
        course: cert.course,
        program: cert.program,
        metadata: cert.metadata,
      })),
    });
  } catch (err) {
    console.error("GET /api/v1/certificates/my error:", err);
    return serverError();
  }
}
