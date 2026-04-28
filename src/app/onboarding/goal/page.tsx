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

const GOAL_OPTIONS: { id: LearningGoal; label: string; icon: React.ReactNode }[] = [
  { id: "programming", label: "Programming", icon: <Monitor size={18} /> },
  { id: "design", label: "Design", icon: <Palette size={18} /> },
  { id: "business", label: "Business", icon: <Briefcase size={18} /> },
  { id: "ai", label: "AI & Technology", icon: <Brain size={18} /> },
  { id: "language", label: "Language", icon: <Globe size={18} /> },
  { id: "personal-development", label: "Personal Development", icon: <Lightbulb size={18} /> },
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
      mascotVariant="thinking"
      mascotBubbleText="Сонголт дээр үндэслээд EduNity чамд тохирох course санал болгоно."
      mascotSize={160}
      step={1}
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="mb-1 text-xl font-black text-foreground">
          Чи юунд суралцахыг хүсэж байна?
        </h1>
        <p className="mb-5 text-[13px] text-muted-foreground">
          Дээд тал нь 3 зорилго сонгоно уу.
        </p>
      </motion.div>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        {GOAL_OPTIONS.map((opt, i) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            icon={opt.icon}
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
          className="mb-4 text-[11px] text-violet-600 dark:text-violet-400"
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
