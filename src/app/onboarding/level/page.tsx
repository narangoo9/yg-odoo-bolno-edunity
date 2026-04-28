"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart, Flame, Sprout } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import type { SkillLevel } from "@/lib/onboarding/onboardingTypes";

const LEVEL_OPTIONS: { id: SkillLevel; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "Анхлан суралцагч",
    icon: <Sprout size={18} className="text-emerald-500" />,
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "Суурь мэдлэгтэй",
    icon: <BarChart size={18} className="text-amber-500" />,
  },
  {
    id: "advanced",
    label: "Advanced",
    desc: "Илүү гүнзгий суралцах",
    icon: <Flame size={18} className="text-orange-500" />,
  },
];

export default function LevelPage() {
  const router = useRouter();
  const { level: savedLevel, setLevel, setCurrentStep } = useOnboardingStore();
  const [selected, setSelected] = useState<SkillLevel | null>(savedLevel);

  const handleNext = () => {
    if (!selected) return;
    setLevel(selected);
    setCurrentStep("learning-style");
    router.push("/onboarding/learning-style");
  };

  return (
    <OnboardingCard
      mascotVariant="thinking"
      mascotBubbleText="Түвшин чинь ямар ч байсан зүгээр. Би тохирох хичээлүүдийг санал болгоно."
      mascotSize={160}
      step={2}
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="mb-1 text-xl font-black text-foreground">
          Чиний одоогийн түвшин?
        </h1>
        <p className="mb-5 text-[13px] text-muted-foreground">
          Нэг түвшинг сонгоно уу. Хожим солих боломжтой.
        </p>
      </motion.div>

      <div className="mb-5 space-y-2.5">
        {LEVEL_OPTIONS.map((opt, i) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.desc}
            icon={opt.icon}
            selected={selected === opt.id}
            onClick={() => setSelected(opt.id)}
            index={i}
          />
        ))}
      </div>

      <OnboardingNavigation
        onBack={() => router.push("/onboarding/goal")}
        onNext={handleNext}
        nextDisabled={!selected}
        showBack
      />
    </OnboardingCard>
  );
}
