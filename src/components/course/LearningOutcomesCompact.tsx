"use client";

import { GitBranch, Layers, Rocket, Code2, Database, Shield, Zap, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ICONS = [Layers, GitBranch, Code2, Rocket, Database, Shield, Zap, BookOpen];

interface Props {
  outcomes: string[];
}

export function LearningOutcomesCompact({ outcomes }: Props) {
  const { t } = useLanguage();
  if (!outcomes.length) return null;
  const items = outcomes.slice(0, 4);

  return (
    <div className="mb-6">
      <h2 className="text-[13px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide mb-3">
        {t("course.whatLearn")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((outcome, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3.5 bg-white dark:bg-[#120E20] rounded-xl border border-[#E5E7EB] dark:border-[#1E1B2E] hover:border-violet-200 dark:hover:border-violet-700/50 hover:shadow-sm transition-all cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-[12px] font-medium text-[#374151] dark:text-[#D1D5DB] leading-snug">
                {outcome}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
