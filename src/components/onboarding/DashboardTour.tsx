"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { MascotImage, type MascotVariant } from "@/components/brand/MascotImage";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  text: string;
  mascot: MascotVariant;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "hero-banner",
    title: "Таны Dashboard",
    text: "Энэ бол чиний dashboard. Эндээс суралцах ахиц, course, certificate бүгд харагдана.",
    mascot: "wave",
    position: "bottom",
  },
  {
    id: "sidebar-menu",
    title: "Навигаци цэс",
    text: "Зүүн цэснээс lessons, catalog, leaderboard, messages, notes хэсгүүд рүү орно.",
    mascot: "thinking",
    position: "right",
  },
  {
    id: "continue-learning",
    title: "Continue Learning",
    text: "Эндээс чи эхэлсэн course-оо үргэлжлүүлнэ. Resume Course дараад шууд хичээл рүү орно.",
    mascot: "laptop",
    position: "top",
  },
  {
    id: "recommended-courses",
    title: "Recommended For You",
    text: "Чиний goal болон level дээр үндэслээд тохирох course-уудыг энд санал болгоно.",
    mascot: "book",
    position: "top",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    text: "Энэ checklist-г дуусгавал чи EduNity-г бүрэн ашиглаж эхэлнэ.",
    mascot: "certificate",
    position: "left",
  },
  {
    id: "ai-mentor",
    title: "AI Mentor",
    text: "AI Mentor чамд course санал болгож, progress сануулж, сурах төлөвлөгөө гаргахад тусална.",
    mascot: "base",
    position: "left",
  },
];

interface DashboardTourProps {
  show: boolean;
  onClose: () => void;
}

export function DashboardTour({ show, onClose }: DashboardTourProps) {
  const { completeDashboardTour } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !show) return null;

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;

  const handleNext = () => {
    if (isLast) {
      completeDashboardTour();
      onClose();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStepIndex((i) => i - 1);
  };

  const handleSkip = () => {
    completeDashboardTour();
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Dim overlay */}
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={handleSkip}
          />

          {/* Tour bubble - centered floating */}
          <motion.div
            key={`tour-bubble-${step.id}`}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.35, ease: "backOut" }}
            className={cn(
              "fixed z-50 w-[320px] sm:w-[360px]",
              // Center positioning - works as a general overlay bubble
              "bottom-6 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:right-8 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0"
            )}
          >
            <div className="rounded-2xl border border-violet-200/60 bg-white shadow-2xl shadow-violet-900/20 dark:bg-[#111028]">
              {/* Header */}
              <div
                className="flex items-center justify-between rounded-t-2xl px-4 py-3"
                style={{ background: "linear-gradient(135deg, #2f0f68 0%, #7c2fe4 100%)" }}
              >
                <div className="flex items-center gap-2.5">
                  <MascotImage variant={step.mascot} size={32} />
                  <div>
                    <p className="text-[12px] font-black text-white">{step.title}</p>
                    <p className="text-[10px] text-violet-200">
                      {stepIndex + 1} / {TOUR_STEPS.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 py-3.5">
                <p className="text-[13px] leading-relaxed text-foreground">{step.text}</p>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 pb-3">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      i === stepIndex
                        ? "w-4 bg-violet-600"
                        : i < stepIndex
                          ? "w-1.5 bg-violet-300"
                          : "w-1.5 bg-border"
                    )}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <button
                  onClick={handleSkip}
                  className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Алгасах
                </button>
                <div className="flex-1" />
                {!isFirst && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-all hover:border-violet-300 hover:text-foreground"
                  >
                    <ChevronLeft size={12} /> Буцах
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:from-violet-500 hover:to-purple-500"
                >
                  {isLast ? "Дуусгах" : "Дараах"} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
