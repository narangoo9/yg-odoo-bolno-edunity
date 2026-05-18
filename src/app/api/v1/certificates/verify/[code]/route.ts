import { NextRequest } from "next/server";
import { verifyCertificate } from "@/modules/certificates/infrastructure/certificate-service";
import { ok, notFound, serverError } from "@/shared/utils/api-response";

interface Params { params: Promise<{ code: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  // Public endpoint: certificate verification by code (no PII such as email).
  try {
    const { code } = await params;
    const cert = await verifyCertificate(code);
    if (!cert) return notFound("Сертификат олдсонгүй эсвэл хүчингүй байна");

    return ok({
      verified: true,
      certificateNo: cert.certificateNo,
      verificationCode: cert.verificationCode,
      issuedAt: cert.issuedAt,
      studentName: cert.student.name,
      courseTitle: cert.course?.title ?? null,
      programTitle: cert.program?.title ?? cert.program?.certificateTitle ?? null,
      organizationName:
        cert.organization?.name ?? cert.course?.organization?.name ?? null,
      instructorName: cert.course?.instructor?.name ?? null,
    });
  } catch {
    return serverError();
  }
}
