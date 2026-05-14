"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function CourseMascotHelper() {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#120E20] rounded-2xl border border-[#E5E7EB] dark:border-[#1E1B2E] p-4 flex items-center gap-3.5">
      <div className="shrink-0">
        <Image
          src="/assets/mascot/mascot-thinking.png"
          alt="AI туслах mascot"
          width={56}
          height={56}
          className="select-none"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-1.5 mb-0.5">
          <Sparkles size={13} className="text-violet-500 dark:text-violet-400" />
          {t("course.aiHelper")}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed mb-2.5">
          {t("course.aiHelperDesc")}
        </p>
        <Link
          href="/student/ai-mentor"
          className="inline-block px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors focus:outline-none"
        >
          {t("course.askAI")}
        </Link>
      </div>
    </div>
  );
}
