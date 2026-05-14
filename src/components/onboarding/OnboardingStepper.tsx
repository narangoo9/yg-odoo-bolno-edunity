"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { STEP_ORDER, STEP_META, getStepFromPath } from "@/lib/onboarding/onboardingSteps";
import { Check } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  goal: "Сонирхол",
  level: "Түвшин",
  "learning-style": "Сурах хэв маяг",
  schedule: "Хуваарь",
};

export function OnboardingStepper() {
  const pathname = usePathname();
  const currentStep = getStepFromPath(pathname);
  const currentIndex = STEP_META[currentStep].index;

  const visibleSteps = STEP_ORDER.filter((s) => s !== "welcome" && s !== "complete");

  return (
    <div className="flex items-start gap-1.5">
      {visibleSteps.map((step, i) => {
        const stepIndex = STEP_META[step].index;
        const isDone = currentIndex > stepIndex;
        const isActive = currentIndex === stepIndex;

        return (
          <div key={step} className="flex items-center gap-1.5">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300",
                  isDone
                    ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                    : isActive
                      ? "border-violet-500 bg-white text-violet-600 shadow-[0_0_14px_rgba(139,92,246,0.45)]"
                      : "border-violet-200 bg-white/60 text-violet-300"
                )}
              >
                {isDone ? <Check size={13} /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[10px] font-medium leading-none sm:block",
                  isDone || isActive ? "text-violet-600" : "text-violet-300"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-0.5 w-8 rounded-full transition-all duration-500",
                  isDone ? "bg-violet-400" : "bg-violet-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
