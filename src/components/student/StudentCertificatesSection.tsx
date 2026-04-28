import Link from "next/link";
import { Award, BadgeCheck, Building2, Download, Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CertificateEmailButton } from "./CertificateEmailButton";

interface StudentCertificateItem {
  id: string;
  certificateNo: string;
  verificationCode: string;
  issuedAt: Date;
  organization?: {
    name: string | null;
    logoUrl: string | null;
  } | null;
  program?: {
    title: string | null;
    certificateTitle: string | null;
  } | null;
  course?: {
    title: string | null;
    instructor: {
      name: string | null;
    };
  } | null;
}

interface StudentCertificatesSectionProps {
  certificates: StudentCertificateItem[];
}

export function StudentCertificatesSection({
  certificates,
}: StudentCertificatesSectionProps) {
  return (
    <section
      id="certificates"
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/15">
            <Award size={15} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Сертификатууд</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Профайл хэсгээс сертификатаа харах, татах, баталгаажуулах, Gmail руу авах.
            </p>
          </div>
        </div>
        <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          {certificates.length} сертификат
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-200 px-6 py-12 text-center dark:border-violet-800/40">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/10">
            <Award size={28} className="text-amber-500" />
          </div>
          <p className="mb-1 text-sm font-semibold text-foreground">Одоогоор сертификат алга</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Курс эсвэл программ дүүргэсний дараа энд компани бүрийн сертификат гарч ирнэ.
          </p>
          <Button asChild size="sm">
            <Link href="/courses">Курс хайх</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {certificates.map((certificate) => {
            const title =
              certificate.program?.certificateTitle ??
              certificate.program?.title ??
              certificate.course?.title ??
              "Сургалтын сертификат";
            const issuer = certificate.organization?.name ?? "ELearn Platform";

            return (
              <article
                key={certificate.id}
                className="rounded-2xl border border-border bg-background p-5 shadow-sm transition-colors hover:border-violet-200 dark:hover:border-violet-800/40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <BadgeCheck size={12} />
                      Компанийн сертификат
                    </div>
                    <div>
                      <h3 className="line-clamp-2 text-base font-semibold text-foreground">{title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 size={14} />
                        {issuer}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <Award size={20} />
                  </div>
                </div>

                <div className="mb-4 grid gap-3 rounded-2xl bg-muted/40 p-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Сертификатын дугаар</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-foreground">
                      {certificate.certificateNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Олгосон огноо</p>
                    <p className="mt-1 font-semibold text-foreground">{formatDate(certificate.issuedAt)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Тайлбар</p>
                    <p className="mt-1 text-sm text-foreground">
                      {certificate.course?.instructor?.name
                        ? `Багш: ${certificate.course.instructor.name}`
                        : "Программыг амжилттай дүүргэсний гэрчилгээ"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link
                      href={`/student/certificates/${certificate.id}/share`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye />
                      Харах
                    </Link>
                  </Button>

                  <Button asChild size="sm" className="w-full bg-violet-600 text-white hover:bg-violet-500">
                    <a href={`/api/v1/certificates/${certificate.id}/download`}>
                      <Download />
                      Татаж авах
                    </a>
                  </Button>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link
                      href={`/verify/${certificate.verificationCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ShieldCheck />
                      Баталгаажуулах
                    </Link>
                  </Button>

                  <CertificateEmailButton certificateId={certificate.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
