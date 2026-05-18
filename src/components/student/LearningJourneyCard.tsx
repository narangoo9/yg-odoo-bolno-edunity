"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Compass,
  Lock,
  Sparkles,
} from "lucide-react";
import { MascotImage } from "@/components/brand/MascotImage";
import {
  buildLearningJourney,
  type JourneyStats,
} from "@/lib/learning/journey-steps";
import { cn } from "@/lib/utils";

type Props = {
  stats: JourneyStats;
  continueHref?: string | null;
};

export function LearningJourneyCard({ stats, continueHref }: Props) {
  const { steps, progressPercent, currentStepId } = buildLearningJourney(stats);
  const hasCourses = stats.enrolledCourses > 0;
  const hasCerts = stats.certificates > 0;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-violet-100 bg-white dark:border-violet-800/30 dark:bg-card"
      style={{ boxShadow: "0 4px 24px rgba(124,58,237,0.08)" }}
      aria-label="Your learning journey"
    >
      <div className="border-b border-border bg-gradient-to-r from-violet-50/80 to-fuchsia-50/40 px-5 py-4 dark:from-violet-950/40 dark:to-fuchsia-950/20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/40">
              <Compass size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Start Here
              </p>
              <h2 className="text-base font-black text-foreground sm:text-lg">
                Таны суралцах аялал
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <MascotImage variant="book" size={36} className="hidden sm:block" />
            <div className="text-right">
              <p className="text-2xl font-black leading-none text-violet-600 dark:text-violet-400">
                {progressPercent}%
              </p>
              <p className="text-[10px] text-muted-foreground">нийт ахиц</p>
            </div>
          </div>
        </motion.div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                step.status === "completed" &&
                  "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20",
                step.status === "current" &&
                  "border-violet-300 bg-violet-50/80 ring-1 ring-violet-200/60 dark:border-violet-600/40 dark:bg-violet-950/30 dark:ring-violet-800/40",
                step.status === "locked" &&
                  "border-border bg-muted/30 opacity-70 dark:bg-muted/10",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  step.status === "completed" && "bg-emerald-500 text-white",
                  step.status === "current" && "bg-violet-600 text-white",
                  step.status === "locked" && "bg-muted text-muted-foreground",
                )}
              >
                {step.status === "completed" ? (
                  <Check size={12} />
                ) : step.status === "locked" ? (
                  <Lock size={10} />
                ) : (
                  index + 1
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[13px] font-bold leading-snug",
                    step.status === "locked" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.title}
                  {step.status === "current" && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-violet-600/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                      Одоо
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 lg:min-w-[200px]">
          {continueHref && hasCourses ? (
            <Link
              href={continueHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-md transition-colors hover:bg-violet-500"
            >
              <Sparkles size={14} />
              Суралцахыг үргэлжлүүлэх
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/student/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-md transition-colors hover:bg-violet-500"
            >
              <BookOpen size={14} />
              Курс хайх
              <ArrowRight size={14} />
            </Link>
          )}
          <Link
            href="/student/catalog"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            Каталог үзэх
          </Link>
          <Link
            href="/student/settings#certificates"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-semibold transition-colors",
              hasCerts
                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-border text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Award size={14} />
            {hasCerts ? "Сертификатууд" : "Сертификатын тухай"}
          </Link>
        </div>
      </div>

      {!hasCourses && (
        <div className="border-t border-dashed border-violet-200/80 bg-violet-50/40 px-5 py-4 dark:border-violet-800/30 dark:bg-violet-950/20">
          <p className="text-center text-[12px] text-muted-foreground">
            Одоогоор идэвхтэй хичээл байхгүй.{" "}
            <Link href="/student/catalog" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
              Эхний курсаа сонгоорой
            </Link>
          </p>
        </div>
      )}

      {currentStepId === "earn_certificate" && !hasCerts && stats.completedCourses > 0 && (
        <div className="border-t border-emerald-200/60 bg-emerald-50/50 px-5 py-3 dark:border-emerald-800/30 dark:bg-emerald-950/20">
          <p className="text-center text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
            Бараг л боллоо! Сертификатын шаардлагуудыг шалгаад дуусгана уу.
          </p>
        </div>
      )}
    </section>
  );
}
