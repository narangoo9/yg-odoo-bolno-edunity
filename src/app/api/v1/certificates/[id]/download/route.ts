import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCertificatePdf } from "@/modules/certificates/infrastructure/certificate-service";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cert = await db.certificate.findUnique({
    where: { id },
    select: { id: true, studentId: true, certificateNo: true },
  });

  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the certificate owner or admins can download
  if (
    cert.studentId !== session.user.id &&
    !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)
  ) {
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
