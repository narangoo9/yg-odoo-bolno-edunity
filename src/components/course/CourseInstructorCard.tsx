"use client";

import { BadgeCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  channelUrl?: string | null;
}

export function CourseInstructorCard({ name, avatarUrl, bio, channelUrl }: Props) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#120E20] rounded-2xl border border-[#E5E7EB] dark:border-[#1E1B2E] p-4">
      <h3 className="text-[13px] font-bold text-[#111827] dark:text-white mb-3">{t("course.instructor")}</h3>

      <div className="flex items-start gap-3 mb-3.5">
        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-violet-200 dark:border-violet-700/40">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full object-cover" alt={name} />
          ) : (
            <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#111827] dark:text-white text-sm">{name}</p>
          {bio ? (
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-relaxed line-clamp-2">{bio}</p>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <BadgeCheck size={12} className="text-violet-500 shrink-0" />
              <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{t("course.officialYT")}</span>
            </div>
          )}
        </div>
      </div>

      {channelUrl ? (
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center px-3 py-2 text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 text-xs font-semibold rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors focus:outline-none"
        >
          {t("course.viewChannel")}
        </a>
      ) : (
        <button
          type="button"
          className="w-full text-center px-3 py-2 text-violet-600 dark:text-violet-400 border border-violet-300 dark:border-violet-700 text-xs font-semibold rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors focus:outline-none"
        >
          {t("course.viewChannel")}
        </button>
      )}
    </div>
  );
}
