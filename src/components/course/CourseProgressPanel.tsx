"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  PartyPopper,
  Play,
  Users,
} from "lucide-react";
import { CertificateRequirements } from "@/components/certificate/CertificateRequirements";

type LessonRef = { id: string; title: string } | null;

export type CourseProgressPanelProps = {
  courseId: string;
  courseTitle: string;
  completedCount: number;
  totalLessons: number;
  watchPercent?: number;
  nextLesson: LessonRef;
  prevLesson?: LessonRef;
  estimatedMinutesRemaining?: number;
  certificateReadiness?: number;
  allLessonsComplete?: boolean;
  peerReviewPending?: boolean;
  finalTaskRemaining?: boolean;
  lessonsWatched?: boolean;
  tasksComplete?: boolean;
  projectSubmitted?: boolean;
  peerReviewPassed?: boolean;
  certificateUnlocked?: boolean;
};

function formatMinutes(minutes: number) {
  if (minutes < 60) return `~${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h} ц ${m} мин` : `~${h} ц`;
}

export function CourseProgressPanel({
  courseId,
  courseTitle,
  completedCount,
  totalLessons,
  watchPercent = 0,
  nextLesson,
  estimatedMinutesRemaining,
  certificateReadiness = 0,
  allLessonsComplete = false,
  peerReviewPending = false,
  finalTaskRemaining = false,
  lessonsWatched,
  tasksComplete,
  projectSubmitted,
  peerReviewPassed,
  certificateUnlocked,
}: CourseProgressPanelProps) {
  const lessonPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const displayWatch = watchPercent > 0 ? watchPercent : lessonPercent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-10 border-b border-violet-100/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-violet-800/30 dark:bg-card/95 sm:px-5"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto flex max-w-4xl flex-col gap-3"
      >
        {allLessonsComplete ? (
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/80 px-4 py-3 dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-teal-950/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <PartyPopper size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                  Баяр хүргэе! Бүх хичээл дууслаа
                </p>
                <p className="text-[12px] text-emerald-700/90 dark:text-emerald-300/80">
                  {certificateUnlocked
                    ? "Сертификат авахад бэлэн боллоо."
                    : "Сертификатын үлдсэн шаардлагуудыг биелүүлнэ үү."}
                </p>
              </div>
            </div>
            {certificateUnlocked && (
              <Link
                href="/student/settings#certificates"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-500"
              >
                <Award size={14} />
                Сертификат харах
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Continue where you left off
              </p>
              <p className="truncate text-sm font-bold text-foreground">{courseTitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {completedCount} / {totalLessons} хичээл
                </span>
                <span>{displayWatch}% үзсэн</span>
                {estimatedMinutesRemaining != null && estimatedMinutesRemaining > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {formatMinutes(estimatedMinutesRemaining)} үлдсэн
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
                  <Award size={11} />
                  Сертификат: {certificateReadiness}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
                  style={{ width: `${lessonPercent}%` }}
                />
              </div>
            </div>

            {nextLesson && (
              <Link
                href={`/student/courses/${courseId}/learn?lessonId=${nextLesson.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-violet-500"
              >
                <Play size={14} className="fill-white" />
                <span className="max-w-[180px] truncate sm:max-w-[220px]">
                  Up next: {nextLesson.title}
                </span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        {(peerReviewPending || finalTaskRemaining) && (
          <div className="flex flex-wrap gap-2">
            {finalTaskRemaining && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                <CheckCircle2 size={12} />
                Эцсийн даалгавар үлдсэн
              </span>
            )}
            {peerReviewPending && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
                <Users size={12} />
                Peer review хүлээгдэж байна
              </span>
            )}
          </div>
        )}

        <CertificateRequirements
          compact
          lessonsWatched={lessonsWatched ?? (completedCount >= totalLessons && totalLessons > 0)}
          tasksComplete={tasksComplete ?? completedCount >= Math.max(1, Math.floor(totalLessons * 0.6))}
          projectSubmitted={projectSubmitted ?? allLessonsComplete}
          peerReviewPassed={peerReviewPassed ?? (allLessonsComplete && !peerReviewPending)}
          certificateUnlocked={certificateUnlocked ?? false}
          lessonsCompleted={completedCount}
          totalLessons={totalLessons}
        />
      </motion.div>
    </motion.div>
  );
}
