import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import Link from "next/link";
import { ExternalLink, Share2, ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { ScaledCertificate } from "@/components/certificate/ScaledCertificate";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cert = await db.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { name: true } },
      course: { select: { title: true } },
      program: { select: { title: true } },
      organization: { select: { name: true, logoUrl: true } },
    },
  });

  if (!cert) return { title: "Сертификат олдсонгүй" };

  const title = cert.course?.title ?? cert.program?.title ?? "Сургалтын программ";
  const appUrl = getAppUrl();

  return {
    title: `${cert.student.name} — ${title} сертификат`,
    description: `${cert.student.name} нь "${title}" курсийг амжилттай дүүргэсний гэрчилгээ`,
    openGraph: {
      title: `${cert.student.name} — ${title}`,
      description: `${cert.organization?.name ?? "ELearn"} платформаас олгосон сертификат`,
      images: cert.organization?.logoUrl ? [cert.organization.logoUrl] : [],
      url: `${appUrl}/student/certificates/${id}/share`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${cert.student.name} — ${title}`,
      description: `${cert.organization?.name ?? "ELearn"} платформаас олгосон сертификат`,
    },
  };
}

export default async function CertSharePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cert = await db.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true } },
      course: {
        include: {
          instructor: { select: { name: true } },
          organization: { select: { name: true, logoUrl: true } },
        },
      },
      program: { select: { title: true, certificateTitle: true } },
      organization: { select: { name: true, logoUrl: true } },
    },
  });

  if (!cert || cert.studentId !== session.user.id) notFound();

  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify/${cert.verificationCode}`;
  const shareUrl = `${appUrl}/student/certificates/${id}/share`;

  const courseTitle =
    cert.program?.certificateTitle ??
    cert.program?.title ??
    cert.course?.title ??
    "Сургалтын программ";

  const issuerName =
    cert.organization?.name ??
    cert.course?.organization?.name ??
    "EduNity Academy";

  const issuerLogo =
    cert.organization?.logoUrl ?? cert.course?.organization?.logoUrl ?? undefined;

  const instructorName = cert.course?.instructor?.name ?? issuerName;

  // Format date on the server to avoid hydration mismatch
  const completedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(cert.issuedAt);

  // Generate QR code data URL on the server
  const qrCodeUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#1e293b", light: "#ffffff" },
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Буцах
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold text-foreground">Сертификат хуваалцах</h1>
        </div>
      </div>

      {/* Premium Certificate Viewer */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm overflow-hidden">
        <ScaledCertificate
          studentName={cert.student.name}
          courseTitle={courseTitle}
          issuerName={issuerName}
          issuerLogo={issuerLogo}
          completedDate={completedDate}
          certificateId={cert.certificateNo}
          instructorName={instructorName}
          instructorRole="Instructor"
          directorName={issuerName}
          directorRole={`Head of ${issuerName}`}
          verificationUrl={verifyUrl}
          qrCodeUrl={qrCodeUrl}
          platformLogo="/brand/logo-light-mode-removebg-preview.png"
          mascotImage="/assets/mascot/mascot-certificate.png"
        />
      </div>

      {/* Share Actions */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Share2 size={16} />
          Хуваалцах сонголтууд
        </h2>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Баталгаажуулах холбоос</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={verifyUrl}
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground bg-muted"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink size={14} />
            LinkedIn
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`"${courseTitle}" курсийг дүүргэлээ!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink size={14} />
            Twitter / X
          </a>
        </div>
      </div>
    </div>
  );
}
