"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, PartyPopper, Rocket } from "lucide-react";
import { MascotImage } from "@/components/brand/MascotImage";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import { buildChecklistItems, getContinueOnboardingRoute } from "@/lib/onboarding/onboardingUtils";
import { cn } from "@/lib/utils";

export function GettingStartedChecklist() {
  const store = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const items = buildChecklistItems(store);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;
  const continueRoute = getContinueOnboardingRoute(store);

  return (
    <div className="rounded-2xl border border-violet-100 bg-white shadow-sm dark:border-violet-800/20 dark:bg-card"
      style={{ boxShadow: "0 2px 12px rgba(139,92,246,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <MascotImage variant="certificate" size={28} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black text-foreground">Getting Started</p>
          <p className="text-[10px] text-muted-foreground">
            {completedCount} / {totalCount} дууссан
          </p>
        </div>
        {allDone && <PartyPopper size={14} className="text-amber-500" />}
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{percentage}%</p>
      </div>

      {/* Checklist */}
      <div className="space-y-0.5 px-4 pb-3">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2.5 py-1.5"
            >
              <div
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all",
                  item.completed
                    ? "border-violet-500 bg-violet-500"
                    : "border-border bg-transparent"
                )}
                style={{ width: 18, height: 18 }}
              >
                {item.completed && <Check size={10} className="text-white" />}
              </div>
              <span
                className={cn(
                  "flex-1 text-[11px] font-medium leading-snug",
                  item.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {item.label}
              </span>
              {!item.completed && item.route && (
                <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CTA */}
      {!allDone && (
        <div className="border-t border-border px-4 py-3">
          {!store.onboardingCompleted ? (
            <Link
              href={continueRoute}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-[11px] font-bold text-white shadow-md transition-all hover:from-violet-500 hover:to-purple-500"
            >
              <Rocket size={11} />
              Continue onboarding
            </Link>
          ) : (
            <Link
              href="/student/catalog"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700 transition-all hover:bg-violet-100 dark:border-violet-800/30 dark:bg-violet-900/10 dark:text-violet-400"
            >
              <Rocket size={11} />
              Find first course
            </Link>
          )}
        </div>
      )}

      {allDone && (
        <div className="border-t border-border px-4 py-3 text-center">
          <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
            EduNity setup complete 🎉
          </p>
        </div>
      )}
    </div>
  );
}
