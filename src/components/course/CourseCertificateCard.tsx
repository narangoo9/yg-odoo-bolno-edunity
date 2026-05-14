"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function CourseCertificateCard() {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#120E20] rounded-2xl border border-[#E5E7EB] dark:border-[#1E1B2E] p-4 flex items-center gap-3.5">
      <div className="shrink-0">
        <Image
          src="/assets/mascot/mascot-certificate.png"
          alt="Сертификат"
          width={60}
          height={60}
          className="select-none drop-shadow-sm"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#111827] dark:text-white mb-0.5">
          {t("course.certificate")}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed mb-2.5">
          {t("course.certificateDesc")}
        </p>
        <Link
          href="/student/certificates"
          className="inline-block px-3 py-1.5 text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 text-xs font-semibold rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors focus:outline-none"
        >
          {t("course.certificateBtn")}
        </Link>
      </div>
    </div>
  );
}
