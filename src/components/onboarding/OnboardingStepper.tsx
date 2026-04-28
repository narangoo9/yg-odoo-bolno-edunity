"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { STEP_ORDER, STEP_META, getStepFromPath } from "@/lib/onboarding/onboardingSteps";
import { Check } from "lucide-react";

export function OnboardingStepper() {
  const pathname = usePathname();
  const currentStep = getStepFromPath(pathname);
  const currentIndex = STEP_META[currentStep].index;

  const visibleSteps = STEP_ORDER.filter((s) => s !== "welcome" && s !== "complete");

  return (
    <div className="flex items-center gap-1.5">
      {visibleSteps.map((step, i) => {
        const stepIndex = STEP_META[step].index;
        const isDone = currentIndex > stepIndex;
        const isActive = currentIndex === stepIndex;

        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-200",
                isDone
                  ? "border-violet-400 bg-violet-500 text-white"
                  : isActive
                    ? "border-violet-400 bg-white/15 text-white shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    : "border-white/20 bg-white/5 text-white/40"
              )}
            >
              {isDone ? <Check size={11} /> : i + 1}
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 rounded-full transition-all duration-300",
                  currentIndex > stepIndex + 1 ? "bg-violet-400" : "bg-white/15"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
