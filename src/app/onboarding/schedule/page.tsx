"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import { cn } from "@/lib/utils";

const DAY_OPTIONS = [
  { value: 2, label: "2 өдөр" },
  { value: 3, label: "3 өдөр" },
  { value: 5, label: "5 өдөр" },
  { value: 7, label: "Өдөр бүр" },
];

const MINUTE_OPTIONS = [
  { value: 15, label: "15 минут" },
  { value: 30, label: "30 минут" },
  { value: 45, label: "45 минут" },
  { value: 60, label: "60 минут" },
];

function SelectGrid({
  options,
  selected,
  onSelect,
  color,
}: {
  options: { value: number; label: string }[];
  selected: number | null;
  onSelect: (v: number) => void;
  color: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt, i) => (
        <motion.button
          key={opt.value}
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(opt.value)}
          className={cn(
            "rounded-2xl border-2 py-3 text-center text-[13px] font-bold transition-all",
            selected === opt.value
              ? `${color} shadow-md`
              : "border-border bg-white text-foreground hover:border-violet-300 dark:bg-card"
          )}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const { weeklyDays: savedDays, dailyMinutes: savedMins, setSchedule, setCurrentStep } = useOnboardingStore();
  const [days, setDays] = useState<number | null>(savedDays);
  const [minutes, setMinutes] = useState<number | null>(savedMins);

  const handleNext = () => {
    if (!days || !minutes) return;
    setSchedule(days, minutes);
    setCurrentStep("complete");
    router.push("/onboarding/complete");
  };

  return (
    <OnboardingCard
      mascotVariant="fire"
      mascotBubbleText="Жижиг зорилго ч гэсэн тогтмол байвал том ахиц гарна."
      mascotSize={160}
      step={4}
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="mb-1 text-xl font-black text-foreground">
          7 хоногийн сурах зорилго
        </h1>
        <p className="mb-5 text-[13px] text-muted-foreground">
          Хэр их цаг гаргах вэ? Тохируулъя.
        </p>
      </motion.div>

      {/* Days */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <Calendar size={14} className="text-violet-600" />
          <p className="text-[13px] font-bold text-foreground">7 хоногт хэдэн өдөр?</p>
        </div>
        <SelectGrid
          options={DAY_OPTIONS}
          selected={days}
          onSelect={setDays}
          color="border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
        />
      </div>

      {/* Minutes */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <Clock size={14} className="text-orange-500" />
          <p className="text-[13px] font-bold text-foreground">Өдөрт хэдэн минут?</p>
        </div>
        <SelectGrid
          options={MINUTE_OPTIONS}
          selected={minutes}
          onSelect={setMinutes}
          color="border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
        />
      </div>

      {days && minutes && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-2.5 text-center dark:border-violet-800/30 dark:bg-violet-900/10"
        >
          <p className="text-[12px] font-semibold text-violet-700 dark:text-violet-300">
            7 хоногт {days * minutes} минут — Гайхалтай зорилго! 🔥
          </p>
        </motion.div>
      )}

      <OnboardingNavigation
        onBack={() => router.push("/onboarding/learning-style")}
        onNext={handleNext}
        nextDisabled={!days || !minutes}
        showBack
      />
    </OnboardingCard>
  );
}
