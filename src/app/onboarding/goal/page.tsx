"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Briefcase, Globe, Lightbulb, Monitor, Palette } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import type { LearningGoal } from "@/lib/onboarding/onboardingTypes";

const GOAL_OPTIONS: {
  id: LearningGoal;
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
}[] = [
  {
    id: "programming",
    label: "Програмчлал",
    desc: "Вэб, мобайл, хиймэл оюун ухаан",
    icon: <Monitor size={18} className="text-violet-600" />,
    iconBg: "bg-violet-100",
  },
  {
    id: "design",
    label: "Дизайн",
    desc: "UI/UX, график, бүтээлч дизайн",
    icon: <Palette size={18} className="text-pink-500" />,
    iconBg: "bg-pink-100",
  },
  {
    id: "business",
    label: "Бизнес",
    desc: "Маркетинг, менежмент, санхүү",
    icon: <Briefcase size={18} className="text-emerald-600" />,
    iconBg: "bg-emerald-100",
  },
  {
    id: "ai",
    label: "AI & Technology",
    desc: "Хиймэл оюун ухаан, дата шинжилгээ",
    icon: <Brain size={18} className="text-orange-500" />,
    iconBg: "bg-orange-100",
  },
  {
    id: "language",
    label: "Хэл",
    desc: "Англи хэл, Солонгос хэл, Хятад хэл",
    icon: <Globe size={18} className="text-blue-500" />,
    iconBg: "bg-blue-100",
  },
  {
    id: "personal-development",
    label: "Хувь хөгжил",
    desc: "Бүтээмж, сэтгэл зүй, харилцаа",
    icon: <Lightbulb size={18} className="text-amber-500" />,
    iconBg: "bg-amber-100",
  },
];

export default function GoalPage() {
  const router = useRouter();
  const { goals, setGoals, setCurrentStep } = useOnboardingStore();
  const [selected, setSelected] = useState<LearningGoal[]>(goals);

  const toggle = (id: LearningGoal) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleNext = () => {
    setGoals(selected);
    setCurrentStep("level");
    router.push("/onboarding/level");
  };

  return (
    <OnboardingCard
      headline="Юунд суралцахыг хүсэж байна?"
      subheadline="Дээд тал нь 3 зорилго сонгоно уу. Бид танд хамгийн тохирох хичээлүүдийг санал болгоно."
      mascotVariant="thinking"
      mascotBubbleText="Сонирхлоо сонгосноор би танд яг тохирох хичээл, замнал, тест даалгавар санал болгоно."
      mascotSize={200}
      step={1}
    >
      <div className="mb-4">
        <h2 className="text-[18px] font-bold text-gray-800">Сонирхлын чиглэлээ сонгоно уу</h2>
        <p className="mt-1 text-[13px] text-gray-400">
          Та хамгийн их сонирхож буй 3 чиглэлийг сонгох боломжтой.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {GOAL_OPTIONS.map((opt, i) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.desc}
            icon={opt.icon}
            iconBg={opt.iconBg}
            selected={selected.includes(opt.id)}
            onClick={() => toggle(opt.id)}
            disabled={!selected.includes(opt.id) && selected.length >= 3}
            index={i}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-[12px] font-semibold text-violet-600"
        >
          {selected.length} / 3 сонгосон
        </motion.p>
      )}

      <OnboardingNavigation
        onBack={() => router.push("/onboarding/welcome")}
        onNext={handleNext}
        nextDisabled={selected.length === 0}
        showBack
      />
    </OnboardingCard>
  );
}
