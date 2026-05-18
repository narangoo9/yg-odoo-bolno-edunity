"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award, Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type CertificateRequirementsProps = {
  lessonsWatched: boolean;
  tasksComplete: boolean;
  projectSubmitted: boolean;
  peerReviewPassed: boolean;
  certificateUnlocked: boolean;
  lessonsCompleted?: number;
  totalLessons?: number;
  compact?: boolean;
  className?: string;
};

type ReqItem = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
};

export function CertificateRequirements({
  lessonsWatched,
  tasksComplete,
  projectSubmitted,
  peerReviewPassed,
  certificateUnlocked,
  lessonsCompleted = 0,
  totalLessons = 0,
  compact = false,
  className,
}: CertificateRequirementsProps) {
  const items: ReqItem[] = [
    {
      id: "lessons",
      label: "Бүх хичээл үзэх",
      hint:
        totalLessons > 0
          ? `${lessonsCompleted}/${totalLessons} хичээл дууссан`
          : "Хичээлүүдийг дуусгана уу",
      done: lessonsWatched,
    },
    {
      id: "tasks",
      label: "Quiz / даалгавар биелүүлэх",
      hint: "Бүх шаардлагатай даалгавруудыг гүйцэтгэнэ",
      done: tasksComplete,
    },
    {
      id: "project",
      label: "Эцсийн төсөл илгээх",
      hint: "Төслөө илгээж бодит ур чадвараа харуулна",
      done: projectSubmitted,
    },
    {
      id: "peer",
      label: "Peer review давах",
      hint: "Бусад суралцагчдын үнэлгээг амжилттай авна",
      done: peerReviewPassed,
    },
    {
      id: "cert",
      label: "Сертификат нээгдэх",
      hint: certificateUnlocked ? "Таны гэрчилгээ бэлэн" : "Дээрх бүх шаардлагыг биелүүлнэ",
      done: certificateUnlocked,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);
  const firstMissing = items.find((i) => !i.done && i.id !== "cert");

  const missingMessage =
    firstMissing?.id === "project"
      ? "Та эцсийн төслөө илгээх шаардлагатай."
      : firstMissing?.id === "peer"
        ? "Peer review-ийг хүлээн авах эсвэл илгээх шаардлагатай."
        : firstMissing?.id === "tasks"
          ? "Та үлдсэн quiz/даалгавруудыг дуусгах хэрэгтэй."
          : firstMissing?.id === "lessons"
            ? "Та бүх хичээлийг үзэж дуусгах хэрэгтэй."
            : null;

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2 dark:border-violet-800/30 dark:bg-violet-950/20",
          className,
        )}
      >
        <Award size={14} className="shrink-0 text-violet-600 dark:text-violet-400" />
        <span className="text-[11px] font-semibold text-foreground">
          Сертификат: {progress}%
        </span>
        <motion.div className="h-1 flex-1 min-w-[80px] overflow-hidden rounded-full bg-violet-200 dark:bg-violet-900/50">
          <div
            className="h-full rounded-full bg-violet-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
        {!certificateUnlocked && missingMessage && (
          <span className="w-full text-[10px] text-muted-foreground sm:w-auto">{missingMessage}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-800/30 dark:bg-card",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
            <Award size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Сертификатын шаардлага</h3>
            <p className="text-[11px] text-muted-foreground">
              Бүх алхмыг биелүүлсний дараа гэрчилгээ олгоно
            </p>
          </div>
        </div>
        <span className="text-lg font-black text-violet-600 dark:text-violet-400">{progress}%</span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5",
              item.done
                ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                : item.id === "cert" && !certificateUnlocked
                  ? "border-border bg-muted/20 opacity-80"
                  : "border-border bg-background",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {item.done ? <Check size={11} /> : item.id === "cert" ? <Lock size={10} /> : null}
            </div>
            <div>
              <p className="text-[12px] font-bold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.hint}</p>
            </div>
          </li>
        ))}
      </ul>

      <AnimatePresence mode="wait">
        {certificateUnlocked ? (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-violet-50 px-4 py-3 dark:border-emerald-800/40 dark:from-emerald-950/30 dark:to-violet-950/20"
          >
            <Sparkles className="text-amber-500" size={20} />
            <p className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-200">
              Баяр хүргэе! Таны сертификат бэлэн боллоо.
            </p>
          </motion.div>
        ) : missingMessage ? (
          <motion.p
            key="missing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-[12px] font-medium text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200"
          >
            {missingMessage}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
