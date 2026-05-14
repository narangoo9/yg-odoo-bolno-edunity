"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MascotImage, type MascotVariant } from "@/components/brand/MascotImage";

interface OnboardingCardProps {
  children: React.ReactNode;
  headline?: string;
  subheadline?: string;
  mascotVariant?: MascotVariant;
  mascotBubbleText?: string;
  mascotSize?: number;
  className?: string;
  step?: number;
}

export function OnboardingCard({
  children,
  headline,
  subheadline,
  mascotVariant = "wave",
  mascotBubbleText,
  mascotSize = 200,
  className,
  step = 0,
}: OnboardingCardProps) {
  return (
    <div className="flex w-full items-stretch">
      {/* ── Left hero column (desktop) ── */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-center px-10 xl:px-16 py-10"
      >
        {/* Soft purple glow behind mascot */}
        <div className="pointer-events-none absolute bottom-8 left-0 h-[480px] w-[420px] rounded-full bg-violet-400/12 blur-[140px]" />

        {headline && (
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 text-[2.4rem] font-black leading-[1.15] tracking-tight text-gray-900"
          >
            {headline}
          </motion.h1>
        )}

        {subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="mb-10 text-[15px] leading-relaxed text-gray-500"
          >
            {subheadline}
          </motion.p>
        )}

        {/* Speech bubble + mascot */}
        <div className="relative flex flex-col gap-3">
          {mascotBubbleText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.55, ease: "backOut", duration: 0.4 }}
              className="relative w-fit max-w-[260px] rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(109,40,217,0.1)]"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-violet-500">✦</span>
                <p className="text-[12.5px] font-medium leading-relaxed text-gray-600">
                  {mascotBubbleText}
                </p>
              </div>
              {/* Bubble arrow pointing down */}
              <div className="absolute -bottom-[7px] left-8 h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" />
            </motion.div>
          )}

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="drop-shadow-[0_20px_40px_rgba(139,92,246,0.25)]"
          >
            <MascotImage variant={mascotVariant} size={mascotSize} />
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right card column ── */}
      <div className="flex flex-1 items-center justify-center px-5 py-8 lg:px-8 lg:py-10">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className={cn(
            "w-full max-w-[520px] rounded-3xl bg-white p-7 shadow-[0_8px_48px_rgba(109,40,217,0.11)]",
            className
          )}
        >
          {/* Mobile mascot strip */}
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <MascotImage variant={mascotVariant} size={48} />
            {mascotBubbleText && (
              <p className="text-[11px] leading-snug text-gray-400">{mascotBubbleText}</p>
            )}
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
