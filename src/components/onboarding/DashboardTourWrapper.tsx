"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import { DashboardTour } from "./DashboardTour";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";

export function DashboardTourWrapper() {
  const { dashboardTourCompleted } = useOnboardingStore();
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Only show tour button if dashboard tour hasn't been completed yet
  if (dashboardTourCompleted) return null;

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setShowTour(true)}
        className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25"
      >
        <Map size={12} />
        Guide эхлүүлэх
      </motion.button>

      <DashboardTour show={showTour} onClose={() => setShowTour(false)} />
    </>
  );
}
