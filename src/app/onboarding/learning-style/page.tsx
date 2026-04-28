"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, MessageCircle, PlaySquare, Star, Wrench } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import type { LearningStyle } from "@/lib/onboarding/onboardingTypes";

const STYLE_OPTIONS: { id: LearningStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "video", label: "Video хичээл", desc: "Видео контент үзэж суралцах", icon: <PlaySquare size={18} className="text-violet-500" /> },
  { id: "pdf", label: "PDF / Материал", desc: "Уншиж, тэмдэглэл хийж суралцах", icon: <BookOpen size={18} className="text-blue-500" /> },
  { id: "task", label: "Даалгавар", desc: "Task хийж практик суралцах", icon: <Wrench size={18} className="text-orange-500" /> },
  { id: "chat", label: "Ярилцлага", desc: "Бусадтай ярилцаж суралцах", icon: <MessageCircle size={18} className="text-emerald-500" /> },
  { id: "challenge", label: "Challenge", desc: "XP цуглуулж тэмцэх", icon: <Star size={18} className="text-amber-500" /> },
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
      mascotVariant="book"
      mascotBubbleText="Сурах хэв маягаа сонговол би илүү зөв course санал болгоно."
      mascotSize={160}
      step={3}
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="mb-1 text-xl font-black text-foreground">
          Чи яаж сурах дуртай вэ?
        </h1>
        <p className="mb-5 text-[13px] text-muted-foreground">
          Нэг буюу хэд хэдэн сонголт хийж болно.
        </p>
      </motion.div>

      <div className="mb-5 space-y-2.5">
        {STYLE_OPTIONS.map((opt, i) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.desc}
            icon={opt.icon}
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
