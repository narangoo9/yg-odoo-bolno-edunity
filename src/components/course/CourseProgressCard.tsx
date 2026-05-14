"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  courseId: string;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  courseTitle: string;
  currentLessonTitle?: string | null;
  currentLessonSectionNum?: number | null;
  progressPercent: number;
  completedCount: number;
  totalLessons: number;
}

export function CourseProgressCard({
  courseId,
  thumbnailUrl,
  coverImage,
  courseTitle,
  currentLessonTitle,
  currentLessonSectionNum,
  progressPercent,
  completedCount,
  totalLessons,
}: Props) {
  const { t } = useLanguage();
  const thumb = coverImage ?? thumbnailUrl;

  return (
    <div className="bg-white dark:bg-[#120E20] rounded-2xl border border-[#E5E7EB] dark:border-[#1E1B2E] overflow-hidden">
      <div className="px-4 pt-4 pb-4">
        <h3 className="text-[13px] font-bold text-[#111827] dark:text-white mb-3">
          {t("course.continueWatching")}
        </h3>

        {/* Current lesson row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-violet-800 to-purple-900 shrink-0">
            {thumb ? (
              <img src={thumb} alt={courseTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play size={14} className="text-white opacity-60" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#111827] dark:text-[#E5E7EB] leading-snug line-clamp-2">
              {currentLessonTitle ?? t("course.lessons")}
            </p>
            {currentLessonSectionNum != null && (
              <span className="mt-0.5 inline-block text-[10px] text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#1E1B2E] border border-[#E5E7EB] dark:border-[#2E2146] px-1.5 py-0.5 rounded">
                {t("course.section")} {currentLessonSectionNum}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-[#E5E7EB] dark:bg-[#1E1B2E] rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] text-violet-600 dark:text-violet-400 tabular-nums font-medium">
            {progressPercent}%
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/student/courses/${courseId}/learn`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all hover:shadow-[0_0_16px_rgba(124,58,237,0.3)] focus:outline-none"
        >
          <Play size={13} fill="currentColor" />
          {t("course.continue")}
        </Link>
        <p className="mt-2 text-center text-xs text-[#9CA3AF]">
          {completedCount} / {totalLessons} {t("course.completedOf")}
        </p>
      </div>
    </div>
  );
}
