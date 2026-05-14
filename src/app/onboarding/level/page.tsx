"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Flame, Sprout } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import type { SkillLevel } from "@/lib/onboarding/onboardingTypes";

const LEVEL_OPTIONS: {
  id: SkillLevel;
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
}[] = [
  {
    id: "beginner",
    label: "Анхлан суралцагч",
    desc: "Суурийг эхнээс суралцана",
    icon: <Sprout size={20} className="text-emerald-600" />,
    iconBg: "bg-emerald-100",
  },
  {
    id: "intermediate",
    label: "Дунд түвшин",
    desc: "Суурь мэдлэгтэй, цааш ахина",
    icon: <BarChart size={20} className="text-amber-600" />,
    iconBg: "bg-amber-100",
  },
  {
    id: "advanced",
    label: "Ахисан түвшин",
    desc: "Илүү гүнзгий суралцах",
    icon: <Flame size={20} className="text-orange-600" />,
    iconBg: "bg-orange-100",
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
      headline="Чиний одоогийн түвшин?"
      subheadline="Түвшин чинь ямар ч байсан зүгээр. Тохирох хичээлүүдийг санал болгоно."
      mascotVariant="thinking"
      mascotBubbleText="Түвшин чинь ямар ч байсан зүгээр. Би тохирох хичээлүүдийг санал болгоно."
      mascotSize={200}
      step={2}
    >
      <div className="mb-4">
        <h2 className="text-[18px] font-bold text-gray-800">Нэг түвшин сонгоно уу</h2>
        <p className="mt-1 text-[13px] text-gray-400">Хожим сольж болно.</p>
      </div>

      <div className="mb-5 space-y-2.5">
        {LEVEL_OPTIONS.map((opt, i) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.desc}
            icon={opt.icon}
            iconBg={opt.iconBg}
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
