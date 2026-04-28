import type { Metadata } from "next";
import { CheckCircle2, XCircle, Award, BookOpen, User, Calendar } from "lucide-react";
import { verifyCertificate } from "@/modules/certificates/infrastructure/certificate-service";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Сертификат шалгах" };

interface Props { params: Promise<{ code: string }> }

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params;
  const cert = await verifyCertificate(code);

  if (!cert) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Сертификат олдсонгүй</h1>
          <p className="text-muted-foreground text-sm">
            Энэ баталгаажуулах код хүчингүй эсвэл систем дээр бүртгэлгүй байна.
          </p>
          <p className="text-xs text-muted-foreground mt-3 font-mono bg-muted/50 px-3 py-1.5 rounded-lg inline-block">
            {code}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full shadow-sm">
        {/* Valid badge */}
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Хүчинтэй сертификат
          </span>
        </div>

        {/* Certificate preview */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-center mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "12px 12px"
          }} />
          <Award size={32} className="text-yellow-400 mx-auto mb-2" />
          <p className="text-slate-300 text-xs uppercase tracking-widest mb-1">Сертификат</p>
          <p className="text-white font-bold text-lg">{cert.student.name}</p>
          <p className="text-muted-foreground text-xs mt-1">амжилттай дүүргэсэн</p>
          <p className="text-white font-semibold mt-1 text-sm">
            "{cert.course?.title ?? (cert.metadata as Record<string, string> | null)?.programTitle ?? "Сургалтын программ"}"
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User size={16} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Суралцагч</p>
              <p className="text-sm font-medium text-foreground">{cert.student.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <BookOpen size={16} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{cert.course ? "Курс" : "Программ"}</p>
              <p className="text-sm font-medium text-foreground">
                {cert.course?.title ?? (cert.metadata as Record<string, string> | null)?.programTitle}
              </p>
              {cert.course && <p className="text-xs text-muted-foreground">Багш: {cert.course.instructor.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar size={16} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Олгогдсон огноо</p>
              <p className="text-sm font-medium text-foreground">{formatDate(cert.issuedAt)}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4 font-mono bg-muted/50 px-3 py-1.5 rounded-lg">
          {cert.verificationCode}
        </p>
      </div>
    </div>
  );
}
