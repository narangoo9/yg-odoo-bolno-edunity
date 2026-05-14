"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  index?: number;
}

export function OptionCard({
  label,
  description,
  icon,
  iconBg = "bg-violet-100",
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
      transition={{ duration: 0.3, delay: index * 0.055, ease: "easeOut" }}
      whileHover={{ scale: disabled ? 1 : 1.018, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.975 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-2xl border-2 p-3.5 text-left transition-all duration-200",
        selected
          ? "border-violet-500 bg-violet-50 shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
          : "border-gray-100 bg-white hover:border-violet-200 hover:shadow-md",
        disabled && !selected && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base transition-all",
              selected ? "bg-violet-100" : iconBg
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[13.5px] font-semibold leading-snug",
              selected ? "text-violet-700" : "text-gray-800"
            )}
          >
            {label}
          </p>
          {description && (
            <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            selected ? "border-violet-500 bg-violet-500" : "border-gray-300 bg-transparent"
          )}
        >
          {selected && <Check size={10} className="text-white" />}
        </div>
      </div>
    </motion.button>
  );
}
