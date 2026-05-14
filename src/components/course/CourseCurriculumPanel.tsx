"use client";

import { ChevronDown, CheckCircle2, Circle, Lock, Play } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Lesson {
  id: string;
  title: string;
  duration: number | null;
  videoType?: "NONE" | "YOUTUBE" | "UPLOAD" | null;
  videoUrl?: string | null;
  startTimeSeconds?: number | null;
  orderIndex?: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Props {
  modules: Module[];
  isUnlocked: boolean;
  totalLessons: number;
  completedLessonIds?: string[];
  activeLessonId?: string | null;
}

function fmtStamp(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtMin(secs: number) {
  return `${Math.ceil(secs / 60)}м`;
}

export function CourseCurriculumPanel({
  modules,
  isUnlocked,
  totalLessons,
  completedLessonIds = [],
  activeLessonId,
}: Props) {
  const { t } = useLanguage();

  const globalIdx = new Map<string, number>();
  let idx = 0;
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      globalIdx.set(lesson.id, ++idx);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-[#111827] dark:text-white">{t("course.curriculum")}</h2>
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/40 px-2.5 py-1 rounded-full">
          {totalLessons} {t("course.lessons")}
        </span>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E1B2E] overflow-hidden">
        {modules.map((mod, modIdx) => {
          const totalSecs = mod.lessons.reduce((s, l) => s + (l.duration ?? 0), 0);
          const completedInMod = mod.lessons.filter((l) =>
            completedLessonIds.includes(l.id)
          ).length;
          const pct =
            mod.lessons.length > 0
              ? Math.round((completedInMod / mod.lessons.length) * 100)
              : 0;
          const fullyDone = pct === 100 && mod.lessons.length > 0;

          return (
            <details
              key={mod.id}
              className="group border-b border-[#E5E7EB] dark:border-[#1E1B2E] last:border-0"
              open={modIdx === 0}
            >
              <summary className="flex items-center justify-between px-4 py-3.5 min-h-[50px] cursor-pointer bg-[#F9FAFB] dark:bg-[#0F0C1A] hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors select-none list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-600 text-white text-[11px] font-bold shrink-0">
                    {modIdx + 1}
                  </span>
                  <span className="font-semibold text-[#111827] dark:text-[#E5E7EB] text-sm">{mod.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] hidden sm:inline">
                    {mod.lessons.length} {t("course.lessons")}
                    {totalSecs > 0 ? ` • ${fmtMin(totalSecs)}` : ""}
                  </span>
                  {completedLessonIds.length > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fullyDone
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40"
                          : "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40"
                      }`}
                    >
                      {fullyDone ? "100% ✓" : `${pct}%`}
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    className="text-[#6B7280] dark:text-[#9CA3AF] shrink-0 transition-transform duration-200 group-open:rotate-180"
                  />
                </div>
              </summary>

              <div className="bg-white dark:bg-[#0D0A18]">
                {mod.lessons.map((lesson, lessonIdx) => {
                  const gIdx = globalIdx.get(lesson.id) ?? lessonIdx + 1;
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const isActive = lesson.id === activeLessonId;

                  const timeDisplay =
                    lesson.startTimeSeconds != null
                      ? fmtStamp(lesson.startTimeSeconds)
                      : lesson.duration
                      ? fmtMin(lesson.duration)
                      : null;

                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-3 px-4 py-2.5 min-h-[40px] border-b border-[#F3F4F6] dark:border-[#1A1628] last:border-0 transition-colors duration-150 ${
                        isActive
                          ? "bg-violet-50 dark:bg-violet-900/15 border-l-[3px] border-l-violet-500"
                          : "hover:bg-[#F9FAFB] dark:hover:bg-[#0F0C1A] cursor-default"
                      }`}
                    >
                      {/* Number + play icon */}
                      <div className="flex items-center gap-1 w-6 shrink-0">
                        {isActive && (
                          <Play size={9} className="text-violet-600 dark:text-violet-400 fill-current" />
                        )}
                        <span className="text-[11px] text-[#9CA3AF] tabular-nums">
                          {lessonIdx + 1}
                        </span>
                      </div>

                      {/* Title */}
                      <span
                        className={`text-[13px] flex-1 min-w-0 truncate ${
                          isActive
                            ? "font-semibold text-violet-700 dark:text-violet-300"
                            : "text-[#374151] dark:text-[#D1D5DB]"
                        }`}
                      >
                        {lesson.title}
                      </span>

                      {/* Section badge */}
                      <span className="hidden sm:inline-block text-[10px] text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#1A1628] border border-[#E5E7EB] dark:border-[#2E2146] px-1.5 py-0.5 rounded shrink-0">
                        {t("course.section")} {gIdx}
                      </span>

                      {/* Time */}
                      {timeDisplay && (
                        <span className="text-[11px] text-[#9CA3AF] tabular-nums shrink-0">
                          {timeDisplay}
                        </span>
                      )}

                      {/* Status icon */}
                      <div className="w-4 flex items-center justify-center shrink-0">
                        {!isUnlocked ? (
                          <Lock size={10} className="text-[#D1D5DB] dark:text-[#4B5563]" />
                        ) : isCompleted ? (
                          <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-50 dark:fill-emerald-900/30" />
                        ) : isActive ? (
                          <Circle size={14} className="text-violet-400 dark:text-violet-500" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
