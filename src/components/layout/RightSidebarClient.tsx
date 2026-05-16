"use client";

import { useState } from "react";
import {
  Brain, ChevronRight, Flame, Menu, Target, Trophy, Zap,
  X, Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { getInitials, cn } from "@/lib/utils";
import { MascotImage } from "@/components/brand/MascotImage";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";

interface WeekDay {
  label: string; date: number; active: boolean; isToday: boolean;
}
interface CourseMini {
  id: string; title: string; thumbnailUrl: string | null;
  instructor: { name: string };
}
interface Enrollment {
  status: string; course: CourseMini;
}
interface Props {
  user: { name: string; avatarUrl: string | null; xp: number; level: number; streak: number; email: string };
  leaderboard: { rank: number | null; weeklyXp: number } | null;
  enrollments: Enrollment[];
  week: WeekDay[];
  weeklyXp: number;
  goalsThisMonth: number;
  activeEnrollments: Enrollment[];
  completedEnrollments: Enrollment[];
  inProgressCourses: Enrollment[];
}

// ── AI MENTOR CARD ─────────────────────────────────────────────────────────────
function AIMentorCard({ firstName }: { firstName: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary/5 dark:bg-primary/10 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Brain size={12} className="text-white" />
          </div>
          <span className="text-[12px] font-black text-foreground">AI Mentor</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Greeting */}
        <div className="flex items-start gap-2.5">
          <MascotImage variant="thinking" size={36} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-foreground mb-0.5">
              Сайн уу, {firstName}! 👋
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Би чамд сурах аяллад туслах AI туслах байна.
            </p>
          </div>
        </div>

        {/* Suggestion */}
        <div className="rounded-xl border border-border bg-muted p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-wide">
              Өнөөдрийн санал
            </span>
          </div>
          <p className="text-[11px] text-foreground leading-relaxed mb-2">
            Python программчлалын хэл — Эхлэгчэд хялбар тохиромжтой! 🙂
          </p>
          <button className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
            Python үргэлжлүүлэх <ChevronRight size={12} />
          </button>
        </div>

        {/* Streak reminder */}
        <div className="rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/15 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={12} className="fill-orange-500 text-orange-500 shrink-0" />
            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Streak санууд
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Өдөр бүр сурацвал аихад нэмэгдэнэ!
            Маргааш үргэлжлүүлэхэд мартуузай 💜
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export function RightSidebarClient({
  user, leaderboard, week, weeklyXp, goalsThisMonth,
}: Props) {
  const [collapsed,  setCollapsed]  = useState(false);
  const activeDaysCount = week.filter(d => d.active).length;
  const firstName       = user.name.split(" ")[0];

  return (
    <aside
      className={cn(
        "relative hidden lg:flex h-full flex-shrink-0 flex-col border-l border-border bg-card transition-all duration-150 ease-in-out",
        collapsed ? "w-[52px]" : "w-[290px]",
      )}
    >
      {collapsed ? (
        /* ── Collapsed ── */
        <div className="flex flex-col items-center gap-3 pt-4">
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-primary transition-colors hover:bg-accent"
            aria-label="Expand activity panel"
          >
            <Menu size={17} />
          </button>
          <div className="flex flex-col items-center gap-2.5 pt-2">
            <div title={`${user.xp} XP`} className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent dark:bg-violet-900/20">
              <Brain size={14} className="text-primary" />
            </div>
            {user.streak > 0 && (
              <div title={`${user.streak}d streak`} className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <Flame size={14} className="fill-orange-500 text-orange-500" />
              </div>
            )}
            <div title="Leaderboard" className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Trophy size={14} className="text-amber-500" />
            </div>
          </div>
        </div>
      ) : (
        /* ── Expanded ── */
        <div className="h-full overflow-y-auto">
          <button
            onClick={() => setCollapsed(true)}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            aria-label="Collapse activity panel"
          >
            <ChevronRight size={13} />
          </button>

          <div className="space-y-3 p-4">

            {/* ── PROFILE CARD ── */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/50 to-card dark:from-violet-900/15 dark:to-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="relative">
                  <Avatar key={user.avatarUrl ?? "no-avatar"} className="h-11 w-11 ring-2 ring-border">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-accent text-sm font-bold text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-foreground">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground">Student • Online</p>
                </div>
              </div>

              {/* XP badge */}
              <div className="mb-3 flex w-fit items-center gap-1.5 rounded-xl bg-accent dark:bg-primary/15 px-2.5 py-1">
                <Brain size={11} className="text-primary" />
                <span className="text-[11px] font-bold text-primary">
                  {user.xp.toLocaleString()} XP
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { icon: Flame,  value: user.streak,              label: "Дараалал", cls: "fill-orange-500 text-orange-500" },
                  { icon: Target, value: goalsThisMonth,           label: "Зорилго", cls: "text-primary" },
                  { icon: Trophy, value: leaderboard?.rank ?? "-", label: "Эрэмбэ",  cls: "text-amber-500" },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center rounded-xl border border-border bg-card py-2"
                  >
                    <stat.icon size={14} className={stat.cls} />
                    <span className="mt-0.5 text-[14px] font-black text-foreground">{stat.value}</span>
                    <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── WEEKLY STREAK ── */}
            <div className="rounded-2xl border border-border bg-card p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame size={13} className="fill-orange-500 text-orange-500" />
                  <span className="text-[12px] font-bold text-foreground">Weekly Streak</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{activeDaysCount}/7</span>
              </div>

              <div className="flex justify-between gap-0.5">
                {week.map(day => (
                  <div key={day.label} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-medium text-muted-foreground">{day.label}</span>
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-100",
                      day.active
                        ? "bg-primary text-white shadow-sm shadow-violet-300/40 dark:shadow-violet-900/60"
                        : day.isToday
                          ? "border-2 border-primary text-primary"
                          : "text-muted-foreground",
                    )}>
                      {day.date}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent dark:bg-violet-900/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeDaysCount / 7) * 100)}%` }}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Zap size={9} className="text-amber-500" />
                  <span className="text-[10px] text-muted-foreground">{weeklyXp} XP</span>
                </div>
              </div>

              <div className="mt-1.5 flex justify-end">
                <MascotImage
                  variant="fire"
                  size={28}
                  className={user.streak > 0 ? "mascot-wave" : "opacity-30"}
                />
              </div>
            </div>

            {/* ── GETTING STARTED ── */}
            <GettingStartedChecklist />

            {/* ── AI MENTOR ── */}
            <AIMentorCard firstName={firstName} />
          </div>
        </div>
      )}
    </aside>
  );
}
