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
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 45, label: "45 мин" },
  { value: 60, label: "60 мин" },
];

function SelectGrid({
  options,
  selected,
  onSelect,
  accent,
}: {
  options: { value: number; label: string }[];
  selected: number | null;
  onSelect: (v: number) => void;
  accent: "violet" | "orange";
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((opt, i) => (
        <motion.button
          key={opt.value}
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(opt.value)}
          className={cn(
            "rounded-2xl border-2 py-2.5 text-center text-[12px] font-bold transition-all",
            selected === opt.value
              ? accent === "violet"
                ? "border-violet-500 bg-violet-500 text-white shadow-md"
                : "border-orange-400 bg-orange-400 text-white shadow-md"
              : "border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-600"
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
  const {
    weeklyDays: savedDays,
    dailyMinutes: savedMins,
    setSchedule,
    setCurrentStep,
  } = useOnboardingStore();
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
      headline="7 хоногийн сурах зорилго"
      subheadline="Жижиг зорилго ч гэсэн тогтмол байвал том ахиц гарна."
      mascotVariant="fire"
      mascotBubbleText="Жижиг зорилго ч гэсэн тогтмол байвал том ахиц гарна."
      mascotSize={200}
      step={4}
    >
      <div className="mb-5">
        <h2 className="text-[18px] font-bold text-gray-800">Хуваарь тохируулъя</h2>
        <p className="mt-1 text-[13px] text-gray-400">Хэр их цаг гаргах вэ?</p>
      </div>

      {/* Days */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
            <Calendar size={13} className="text-violet-600" />
          </div>
          <p className="text-[13px] font-semibold text-gray-700">7 хоногт хэдэн өдөр?</p>
        </div>
        <SelectGrid options={DAY_OPTIONS} selected={days} onSelect={setDays} accent="violet" />
      </div>

      {/* Minutes */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
            <Clock size={13} className="text-orange-600" />
          </div>
          <p className="text-[13px] font-semibold text-gray-700">Өдөрт хэдэн минут?</p>
        </div>
        <SelectGrid
          options={MINUTE_OPTIONS}
          selected={minutes}
          onSelect={setMinutes}
          accent="orange"
        />
      </div>

      {days && minutes && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-center"
        >
          <p className="text-[12px] font-semibold text-violet-700">
            7 хоногт нийт {days * minutes} минут — Гайхалтай зорилго!
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
