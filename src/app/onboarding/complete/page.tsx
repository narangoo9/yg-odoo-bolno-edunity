"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Award, BookOpen, Calendar, Check, Flame, GraduationCap, Zap } from "lucide-react";
import { MascotImage } from "@/components/brand/MascotImage";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";

const GOAL_LABELS: Record<string, string> = {
  programming: "Програмчлал",
  design: "Дизайн",
  business: "Бизнес",
  ai: "AI & Technology",
  language: "Хэл",
  "personal-development": "Хувь хөгжил",
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: "Анхлан суралцагч",
  intermediate: "Дунд түвшин",
  advanced: "Ахисан түвшин",
};
const STYLE_LABELS: Record<string, string> = {
  video: "Video хичээл",
  pdf: "PDF / Материал",
  task: "Даалгавар",
  chat: "Ярилцлага",
  challenge: "Challenge",
};

const COMPLETED_CHIPS = [
  "Account created",
  "Goal selected",
  "Level set",
  "Style chosen",
  "Schedule set",
];

function Confetti() {
  const pieces = Array.from({ length: 44 }, (_, i) => i);
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
            duration: 2.2 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
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
      className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-2.5"
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 text-[12.5px] font-semibold text-gray-800">{value}</p>
      </div>
    </motion.div>
  );
}

export default function CompletePage() {
  const router = useRouter();
  const { goals, level, learningStyles, weeklyDays, dailyMinutes, completeOnboarding } =
    useOnboardingStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!hasCompleted.current) {
      hasCompleted.current = true;
      completeOnboarding();
      fetch("/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goals[0],
          level: level ?? undefined,
        }),
      }).catch(() => {
        // Non-fatal — user can re-trigger by visiting again
      });
    }
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, [completeOnboarding, goals, level]);

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="flex w-full items-center justify-center px-5 py-8">
        <div className="flex w-full max-w-[500px] flex-col items-center gap-4">
          {/* Floating celebrate mascot */}
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="drop-shadow-[0_16px_36px_rgba(139,92,246,0.4)]"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <MascotImage variant="celebrate" size={160} priority />
            </motion.div>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="w-full rounded-3xl bg-white p-7 shadow-[0_8px_48px_rgba(109,40,217,0.11)]"
          >
            {/* Title */}
            <div className="mb-5 text-center">
              <motion.h1
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="mb-1 text-[24px] font-black text-gray-900"
              >
                Бэлэн боллоо!
              </motion.h1>
              <p className="text-[13.5px] text-gray-400">
                Чиний сурах зам бэлэн боллоо. Одоо эхний course-оо эхлүүлцгээе.
              </p>
            </div>

            {/* XP bonus banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.42, type: "spring", stiffness: 200 }}
              className="mb-5 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.35)]"
            >
              <Zap size={18} className="text-yellow-300" />
              <p className="text-[15px] font-black text-white">+50 XP эхлэлийн bonus</p>
            </motion.div>

            {/* Summary rows */}
            <div className="mb-5 space-y-2.5">
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
                  delay={0.56}
                />
              )}
              {learningStyles.length > 0 && (
                <SummaryRow
                  icon={<BookOpen size={15} className="text-blue-500" />}
                  label="Сурах хэв"
                  value={learningStyles.map((s) => STYLE_LABELS[s] ?? s).join(", ")}
                  delay={0.62}
                />
              )}
              {weeklyDays && dailyMinutes && (
                <SummaryRow
                  icon={<Calendar size={15} className="text-emerald-500" />}
                  label="Хуваарь"
                  value={`${weeklyDays} өдөр / ${dailyMinutes} мин`}
                  delay={0.68}
                />
              )}
            </div>

            {/* Completed chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {COMPLETED_CHIPS.map((chip, i) => (
                <motion.div
                  key={chip}
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.72 + i * 0.07 }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                >
                  <Check size={10} />
                  {chip}
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              type="button"
              onClick={() => router.push("/register")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-[15px] font-black text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)] transition-all hover:from-violet-500 hover:to-purple-500"
            >
              <Award size={18} />
              Бүртгэлээ дуусгах
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
