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
          className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-5 py-3 text-[13px] font-semibold text-gray-500 transition-all hover:border-violet-300 hover:text-violet-600"
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
          "flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-bold text-white transition-all duration-200",
          nextDisabled
            ? "cursor-not-allowed bg-violet-200 opacity-70"
            : "bg-gradient-to-r from-violet-600 to-purple-600 shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_4px_26px_rgba(124,58,237,0.45)]"
        )}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={15} />
          </>
        )}
      </motion.button>
    </div>
  );
}
