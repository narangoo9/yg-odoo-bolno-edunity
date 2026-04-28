import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import Link from "next/link";
import { ExternalLink, Share2, Download } from "lucide-react";

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
      course: { include: { instructor: { select: { name: true } } } },
      program: { select: { title: true } },
      organization: { select: { name: true, logoUrl: true } },
    },
  });

  if (!cert || cert.studentId !== session.user.id) notFound();

  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify/${cert.verificationCode}`;
  const shareUrl = `${appUrl}/student/certificates/${id}/share`;
  const courseTitle = cert.course?.title ?? cert.program?.title ?? "Сургалтын программ";
  const instructorName = cert.course?.instructor.name ?? cert.organization?.name ?? "ELearn";

  const formattedDate = new Intl.DateTimeFormat("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  }).format(cert.issuedAt);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Сертификат хуваалцах</h1>
        <Link href="/student/settings#certificates" className="text-sm text-muted-foreground hover:text-foreground">
          ← Буцах
        </Link>
      </div>

      {/* Certificate Preview */}
      <div className="bg-card rounded-2xl border-2 border-slate-900 p-8 relative overflow-hidden shadow-xl">
        <div className="absolute inset-4 border border-amber-400/40 rounded-2xl pointer-events-none" />
        <div className="text-center space-y-4">
          {cert.organization?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cert.organization.logoUrl}
              alt={cert.organization?.name ?? "Organization logo"}
              className="h-10 mx-auto object-contain"
            />
          )}
          <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
            {cert.organization?.name ?? "ELearn Platform"}
          </p>
          <div>
            <p className="text-3xl font-serif font-bold text-foreground">Сертификат</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Certificate of Completion</p>
          </div>
          <div className="space-y-1 py-2">
            <p className="text-xs text-muted-foreground">Энэхүү сертификатыг</p>
            <p className="text-2xl font-serif text-amber-600 border-b border-amber-400 pb-2 inline-block px-8">
              {cert.student.name}
            </p>
            <p className="text-xs text-muted-foreground">дараах курсийг амжилттай дүүргэсний гэрчилгээ болгон олгоно</p>
            <p className="text-base font-semibold text-foreground">&ldquo;{courseTitle}&rdquo;</p>
          </div>
          <div className="flex justify-between items-end pt-4 text-xs text-muted-foreground">
            <div className="text-center">
              <div className="w-32 border-t border-border mb-1" />
              <p className="font-medium text-foreground">{instructorName}</p>
              <p>Багш</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-muted-foreground">{cert.certificateNo}</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-t border-border mb-1" />
              <p className="font-medium text-foreground">{formattedDate}</p>
              <p>Огноо</p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
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
            <button
              onClick={() => navigator.clipboard.writeText(verifyUrl)}
              className="px-3 py-2 border border-border rounded-xl text-sm hover:bg-muted"
            >
              Хуулах
            </button>
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
            Twitter/X
          </a>
          <a
            href={`/api/v1/certificates/${id}/download`}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            <Download size={14} />
            PDF татах
          </a>
        </div>
      </div>
    </div>
  );
}
