"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MessageCircle, PlaySquare, Star, Wrench } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import type { LearningStyle } from "@/lib/onboarding/onboardingTypes";

const STYLE_OPTIONS: {
  id: LearningStyle;
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
}[] = [
  {
    id: "video",
    label: "Video хичээл",
    desc: "Видео контент үзэж суралцах",
    icon: <PlaySquare size={18} className="text-violet-600" />,
    iconBg: "bg-violet-100",
  },
  {
    id: "pdf",
    label: "PDF / Материал",
    desc: "Уншиж, тэмдэглэл хийж суралцах",
    icon: <BookOpen size={18} className="text-blue-600" />,
    iconBg: "bg-blue-100",
  },
  {
    id: "task",
    label: "Даалгавар",
    desc: "Task хийж практик суралцах",
    icon: <Wrench size={18} className="text-orange-600" />,
    iconBg: "bg-orange-100",
  },
  {
    id: "chat",
    label: "Ярилцлага",
    desc: "Бусадтай ярилцаж суралцах",
    icon: <MessageCircle size={18} className="text-emerald-600" />,
    iconBg: "bg-emerald-100",
  },
  {
    id: "challenge",
    label: "Challenge",
    desc: "XP цуглуулж тэмцэх",
    icon: <Star size={18} className="text-amber-600" />,
    iconBg: "bg-amber-100",
  },
];

export default function LearningStylePage() {
  const router = useRouter();
  const { learningStyles: saved, setLearningStyles, setCurrentStep } = useOnboardingStore();
  const [selected, setSelected] = useState<LearningStyle[]>(saved);

  const toggle = (id: LearningStyle) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setLearningStyles(selected);
    setCurrentStep("schedule");
    router.push("/onboarding/schedule");
  };

  return (
    <OnboardingCard
      headline="Чи яаж сурах дуртай вэ?"
      subheadline="Нэг буюу хэд хэдэн сонголт хийж болно. Хичээлийн арга барилыг тохируулна."
      mascotVariant="book"
      mascotBubbleText="Сурах хэв маягаа сонговол би илүү зөв course санал болгоно."
      mascotSize={200}
      step={3}
    >
      <div className="mb-4">
        <h2 className="text-[18px] font-bold text-gray-800">Сурах хэв маягаа сонгоно уу</h2>
        <p className="mt-1 text-[13px] text-gray-400">Нэг буюу хэд хэдэн сонголт хийж болно.</p>
      </div>

      <div className="mb-5 space-y-2.5">
        {STYLE_OPTIONS.map((opt, i) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.desc}
            icon={opt.icon}
            iconBg={opt.iconBg}
            selected={selected.includes(opt.id)}
            onClick={() => toggle(opt.id)}
            index={i}
          />
        ))}
      </div>

      <OnboardingNavigation
        onBack={() => router.push("/onboarding/level")}
        onNext={handleNext}
        nextDisabled={selected.length === 0}
        showBack
      />
    </OnboardingCard>
  );
}
