"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MascotBubbleProps {
  text: string;
  className?: string;
  arrowSide?: "left" | "right" | "bottom";
  delay?: number;
}

export function MascotBubble({
  text,
  className,
  arrowSide = "bottom",
  delay = 0.4,
}: MascotBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "backOut" }}
      className={cn(
        "relative rounded-2xl border border-white/20 px-4 py-3 text-center shadow-[0_8px_32px_rgba(139,92,246,0.25)]",
        "bg-white/10 backdrop-blur-md",
        className
      )}
    >
      <p className="text-[12px] font-semibold leading-relaxed text-white/90">{text}</p>

      {arrowSide === "bottom" && (
        <div className="absolute -bottom-[7px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-white/10" />
      )}
      {arrowSide === "right" && (
        <div className="absolute -right-[7px] top-1/2 h-0 w-0 -translate-y-1/2 border-b-[7px] border-l-[7px] border-t-[7px] border-b-transparent border-l-white/10 border-t-transparent" />
      )}
      {arrowSide === "left" && (
        <div className="absolute -left-[7px] top-1/2 h-0 w-0 -translate-y-1/2 border-b-[7px] border-r-[7px] border-t-[7px] border-b-transparent border-r-white/10 border-t-transparent" />
      )}
    </motion.div>
  );
}
