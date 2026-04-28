"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Award, BookOpen, Calendar, Check, Flame, GraduationCap, Zap } from "lucide-react";
import { MascotImage } from "@/components/brand/MascotImage";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";

const GOAL_LABELS: Record<string, string> = {
  programming: "Programming",
  design: "Design",
  business: "Business",
  ai: "AI & Technology",
  language: "Language",
  "personal-development": "Personal Development",
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const STYLE_LABELS: Record<string, string> = {
  video: "Video хичээл",
  pdf: "PDF / Материал",
  task: "Даалгавар",
  chat: "Ярилцлага",
  challenge: "Challenge",
};

// Simple CSS-based confetti that runs on mount
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  const colors = ["#7c3aed", "#a855f7", "#f59e0b", "#10b981", "#ec4899", "#3b82f6"];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            backgroundColor: colors[i % colors.length],
            rotate: Math.random() * 360,
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, Math.random() * 720 - 360],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export default function CompletePage() {
  const router = useRouter();
  const { goals, level, learningStyles, weeklyDays, dailyMinutes, completeOnboarding } = useOnboardingStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!hasCompleted.current) {
      hasCompleted.current = true;
      completeOnboarding();
    }
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, [completeOnboarding]);

  const handleDashboard = () => {
    router.push("/student");
  };

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="relative flex w-full max-w-2xl flex-col items-center gap-6">
        {/* Mascot celebrate */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="drop-shadow-[0_20px_40px_rgba(139,92,246,0.5)]"
        >
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <MascotImage variant="celebrate" size={180} priority />
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="w-full rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl backdrop-blur-sm dark:bg-[#111028]/95"
        >
          <div className="mb-5 text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mb-1 text-2xl font-black text-foreground"
            >
              Бэлэн боллоо! 🎉
            </motion.h1>
            <p className="text-[14px] text-muted-foreground">
              Чиний сурах зам бэлэн боллоо. Одоо эхний course-оо эхлүүлцгээе.
            </p>
          </div>

          {/* XP bonus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
            className="mb-5 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 shadow-lg"
          >
            <Zap size={18} className="text-yellow-300" />
            <p className="text-[15px] font-black text-white">+50 XP эхлэлийн bonus</p>
          </motion.div>

          {/* Summary */}
          <div className="mb-6 space-y-3">
            {goals.length > 0 && (
              <SummaryRow
                icon={<GraduationCap size={15} className="text-violet-600" />}
                label="Зорилго"
                value={goals.map((g) => GOAL_LABELS[g] ?? g).join(", ")}
                delay={0.5}
              />
            )}
            {level && (
              <SummaryRow
                icon={<Flame size={15} className="text-orange-500" />}
                label="Түвшин"
                value={LEVEL_LABELS[level] ?? level}
                delay={0.55}
              />
            )}
            {learningStyles.length > 0 && (
              <SummaryRow
                icon={<BookOpen size={15} className="text-blue-500" />}
                label="Сурах хэв"
                value={learningStyles.map((s) => STYLE_LABELS[s] ?? s).join(", ")}
                delay={0.6}
              />
            )}
            {weeklyDays && dailyMinutes && (
              <SummaryRow
                icon={<Calendar size={15} className="text-emerald-500" />}
                label="Хуваарь"
                value={`${weeklyDays} өдөр / ${dailyMinutes} мин`}
                delay={0.65}
              />
            )}
          </div>

          {/* Completed steps */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              "Account created",
              "Goal selected",
              "Level set",
              "Style chosen",
              "Schedule set",
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-900/15 dark:text-emerald-400"
              >
                <Check size={10} />
                {step}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            type="button"
            onClick={handleDashboard}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-[15px] font-black text-white shadow-lg shadow-violet-200/50 transition-all hover:from-violet-500 hover:to-purple-500"
          >
            <Award size={18} />
            Dashboard руу орох
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5"
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}
