import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";
import { generateCertificatePdf } from "@/modules/certificates/infrastructure/certificate-service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const certificate = await db.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      organization: { select: { name: true } },
      course: {
        select: {
          title: true,
          instructor: { select: { name: true } },
        },
      },
      program: {
        select: {
          title: true,
          certificateTitle: true,
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  if (certificate.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const appUrl = getAppUrl();
    const certificateTitle =
      certificate.program?.certificateTitle ??
      certificate.program?.title ??
      certificate.course?.title ??
      "Сургалтын сертификат";
    const pdf = await generateCertificatePdf(certificate.id);

    await sendEmail({
      to: certificate.student.email,
      subject: `${certificateTitle} сертификат`,
      template: "certificate-ready",
      data: {
        courseTitle: certificateTitle,
        certUrl: `${appUrl}/student/settings#certificates`,
        viewUrl: `${appUrl}/student/certificates/${certificate.id}/share`,
        downloadUrl: `${appUrl}/api/v1/certificates/${certificate.id}/download`,
        verifyUrl: `${appUrl}/verify/${certificate.verificationCode}`,
        hasAttachment: true,
        orgName: certificate.organization?.name ?? certificate.course?.instructor?.name ?? "ELearn Platform",
      },
      attachments: [
        {
          filename: `${certificate.certificateNo}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Certificate email error:", error);
    return NextResponse.json({ error: "Failed to send certificate email" }, { status: 500 });
  }
}
