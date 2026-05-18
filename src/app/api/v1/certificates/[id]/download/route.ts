import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCertificatePdf } from "@/modules/certificates/infrastructure/certificate-service";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Private endpoint: owner, matching organization admin, or super admin can download.
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cert = await db.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      studentId: true,
      organizationId: true,
      certificateNo: true,
      course: { select: { organizationId: true } },
    },
  });

  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const certificateOrganizationId = cert.organizationId ?? cert.course?.organizationId ?? null;
  const orgAdminForCertificate =
    session.user.role === "COMPANY" &&
    Boolean(certificateOrganizationId) &&
    certificateOrganizationId === session.user.organizationId;
  const canDownload =
    cert.studentId === session.user.id ||
    session.user.role === "SUPER_ADMIN" ||
    orgAdminForCertificate;

  // Only the certificate owner, matching organization admin, or super admin can download.
  if (!canDownload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pdf = await generateCertificatePdf(id);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cert.certificateNo}.pdf"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (err) {
    console.error("Certificate PDF error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
