"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  index?: number;
}

export function OptionCard({
  label,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
  index = 0,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-200",
        selected
          ? "border-violet-500 bg-violet-50 shadow-[0_0_0_3px_rgba(139,92,246,0.15)] dark:bg-violet-900/20"
          : "border-border bg-white hover:border-violet-300 hover:shadow-md dark:bg-card dark:hover:border-violet-700",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg",
              selected
                ? "bg-violet-100 dark:bg-violet-800/40"
                : "bg-muted"
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[14px] font-bold leading-snug",
              selected ? "text-violet-700 dark:text-violet-300" : "text-foreground"
            )}
          >
            {label}
          </p>
          {description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            selected
              ? "border-violet-500 bg-violet-500"
              : "border-border bg-transparent"
          )}
        >
          {selected && <Check size={11} className="text-white" />}
        </div>
      </div>
    </motion.button>
  );
}
