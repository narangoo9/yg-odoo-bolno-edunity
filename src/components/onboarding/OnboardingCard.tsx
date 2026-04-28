"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MascotImage, type MascotVariant } from "@/components/brand/MascotImage";
import { MascotBubble } from "./MascotBubble";

interface OnboardingCardProps {
  children: React.ReactNode;
  mascotVariant?: MascotVariant;
  mascotBubbleText?: string;
  mascotSize?: number;
  className?: string;
  step?: number;
}

export function OnboardingCard({
  children,
  mascotVariant = "wave",
  mascotBubbleText,
  mascotSize = 160,
  className,
  step = 0,
}: OnboardingCardProps) {
  return (
    <div className="relative flex w-full max-w-3xl items-center gap-8">
      {/* Mascot column (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden shrink-0 flex-col items-center gap-3 lg:flex"
      >
        {mascotBubbleText && (
          <MascotBubble text={mascotBubbleText} arrowSide="bottom" delay={0.5} />
        )}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <MascotImage
            variant={mascotVariant}
            size={mascotSize}
            className="drop-shadow-[0_20px_40px_rgba(139,92,246,0.4)]"
          />
        </motion.div>
      </motion.div>

      {/* Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 32, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={cn(
          "flex-1 rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl backdrop-blur-sm dark:bg-[#111028]/95",
          className
        )}
      >
        {/* Mobile mascot - above content on small screens */}
        {mascotVariant && (
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <MascotImage variant={mascotVariant} size={56} />
            {mascotBubbleText && (
              <p className="text-[11px] text-muted-foreground">{mascotBubbleText}</p>
            )}
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}
