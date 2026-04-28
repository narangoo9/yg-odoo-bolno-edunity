"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
  nextDisabled?: boolean;
  showBack?: boolean;
  className?: string;
}

export function OnboardingNavigation({
  onBack,
  onNext,
  nextLabel = "Дараах",
  backLabel = "Буцах",
  isLoading = false,
  nextDisabled = false,
  showBack = true,
  className,
}: OnboardingNavigationProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showBack && onBack && (
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-all hover:border-violet-300 hover:text-foreground dark:bg-card"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </motion.button>
      )}

      <motion.button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isLoading}
        whileHover={{ scale: nextDisabled ? 1 : 1.02 }}
        whileTap={{ scale: nextDisabled ? 1 : 0.97 }}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all",
          nextDisabled
            ? "cursor-not-allowed bg-violet-300 opacity-60"
            : "bg-gradient-to-r from-violet-600 to-purple-600 shadow-violet-200 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-300"
        )}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={14} />
          </>
        )}
      </motion.button>
    </div>
  );
}
