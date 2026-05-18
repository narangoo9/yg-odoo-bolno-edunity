"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, ClipboardCheck, Play, Send, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export type JourneyStepId =
  | "lessons"
  | "section-tasks"
  | "final-project"
  | "peer-reviews"
  | "certificate";

interface Props {
  totalSections: number;
  completedSections: number;
  tasksSubmitted: number;
  tasksGraded: number;
  finalProjectUnlocked: boolean;
  finalProjectSubmitted: boolean;
  finalProjectPassed: boolean;
  reviewsGiven: number;
  reviewsRequired: number;
  hasCertificate: boolean;
  onGoTasks?: () => void;
  onGoOverview?: () => void;
}

export function LearningJourneyGuide({
  totalSections,
  completedSections,
  tasksSubmitted,
  tasksGraded,
  finalProjectUnlocked,
  finalProjectSubmitted,
  finalProjectPassed,
  reviewsGiven,
  reviewsRequired,
  hasCertificate,
  onGoTasks,
  onGoOverview,
}: Props) {
  const lessonsDone = totalSections > 0 && completedSections >= totalSections;

  const steps: Array<{
    id: JourneyStepId;
    label: string;
    detail: string;
    done: boolean;
    active: boolean;
    icon: typeof Play;
    action?: () => void;
    href?: string;
  }> = [
    {
      id: "lessons",
      label: "1. Бүх хичээл үзэх",
      detail: `${completedSections}/${totalSections} section · 90%+ үзсэн`,
      done: lessonsDone,
      active: !lessonsDone,
      icon: Play,
    },
    {
      id: "section-tasks",
      label: "2. Section task илгээх",
      detail: `${tasksSubmitted} илгээсэн · ${tasksGraded} peer review-ээр үнэлэгдсэн`,
      done: lessonsDone && tasksSubmitted > 0,
      active: lessonsDone && tasksSubmitted === 0,
      icon: ClipboardCheck,
      action: onGoTasks,
    },
    {
      id: "final-project",
      label: "3. Final Project илгээх",
      detail: finalProjectSubmitted ? "Илгээгдсэн" : finalProjectUnlocked ? "Нээлттэй" : "Түгжээтэй",
      done: finalProjectPassed || finalProjectSubmitted,
      active: finalProjectUnlocked && !finalProjectSubmitted,
      icon: Send,
      action: onGoOverview,
    },
    {
      id: "peer-reviews",
      label: "4. Peer review өгөх",
      detail: `${reviewsGiven}/${reviewsRequired} review өгсөн`,
      done: reviewsGiven >= reviewsRequired,
      active: finalProjectSubmitted && reviewsGiven < reviewsRequired,
      icon: Users,
      href: "/student/peer-review",
    },
    {
      id: "certificate",
      label: "5. Certificate",
      detail: hasCertificate ? "Нээгдсэн" : "Шаардлага биелүүлэх",
      done: hasCertificate,
      active: finalProjectPassed && reviewsGiven >= reviewsRequired && !hasCertificate,
      icon: Award,
    },
  ];

  const current = steps.find((s) => s.active) ?? steps.find((s) => !s.done);

  if (!current && hasCertificate) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-violet-200 bg-white/95 shadow-2xl shadow-violet-300/30 backdrop-blur-md dark:border-violet-800/50 dark:bg-[#13102a]/95">
        <div className="border-b border-violet-100 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 dark:border-violet-900/40">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/80">Дараагийн алхам</p>
          <p className="text-sm font-bold text-white">{current?.label ?? "Баяр хүргэе!"}</p>
        </div>
        <ol className="space-y-1 p-3">
          {steps.map((step) => {
            const inner = (
              <div
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                  step.active && "bg-violet-50 dark:bg-violet-900/25",
                  step.done && "opacity-70",
                )}
              >
                {step.done ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle size={16} className={cn("mt-0.5 shrink-0", step.active ? "text-violet-500" : "text-muted-foreground")} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[12px] font-bold", step.active ? "text-violet-700 dark:text-violet-300" : "text-foreground")}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{step.detail}</p>
                </div>
                {(step.action || step.href) && step.active ? (
                  <ChevronRight size={14} className="mt-1 shrink-0 text-violet-500" />
                ) : null}
              </div>
            );

            if (step.href && step.active) {
              return (
                <li key={step.id}>
                  <Link href={step.href}>{inner}</Link>
                </li>
              );
            }
            if (step.action && step.active) {
              return (
                <li key={step.id}>
                  <button type="button" onClick={step.action} className="w-full">
                    {inner}
                  </button>
                </li>
              );
            }
            return <li key={step.id}>{inner}</li>;
          })}
        </ol>
      </div>
    </div>
  );
}
