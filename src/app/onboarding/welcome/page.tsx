"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, BookOpen, Star, Target, Trophy, Zap } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";

const BENEFITS = [
  {
    icon: Target,
    label: "Хувь тохирсон замнал",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    icon: BookOpen,
    label: "Танай түвшинд таарсан хичээлүүд",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Star,
    label: "Тогтмол ахиц дэвшил",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Trophy,
    label: "Гэрчилгээ, амжилт хүлээн ав",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { setCurrentStep } = useOnboardingStore();

  const handleStart = () => {
    setCurrentStep("goal");
    router.push("/onboarding/goal");
  };

  return (
    <OnboardingCard
      headline="EduNity-д тавтай морил!"
      subheadline="Өөрийн сурах замаа тохируулж, тохирох course санал болгуулж, certificate цуглуулж эхлэ."
      mascotVariant="wave"
      mascotBubbleText="Би чамд эхний course-оо олоход тусална."
      mascotSize={210}
      step={0}
    >
      <div className="mb-5">
        <h2 className="text-[20px] font-black text-gray-800">Эхний алхамаа хий</h2>
        <p className="mt-1.5 text-[13px] text-gray-400">
          Хэдхэн минутад таны хувийн сурах замыг тохируулна.
        </p>
      </div>

      {/* Benefit rows */}
      <div className="mb-5 space-y-2.5">
        {BENEFITS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-2.5"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
            >
              <item.icon size={15} className={item.iconColor} />
            </div>
            <p className="text-[13px] font-medium text-gray-700">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* XP bonus banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.48 }}
        className="mb-6 flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
          <Zap size={15} className="text-white" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-violet-700">+50 XP Bonus</p>
          <p className="text-[11px] text-violet-400">Onboarding дуусгасны шагнал</p>
        </div>
        <Award size={20} className="ml-auto text-violet-300" />
      </motion.div>

      <OnboardingNavigation onNext={handleStart} nextLabel="Эхлэх" showBack={false} />

      <p className="mt-4 text-center text-[11px] text-gray-400">
        Шууд орох уу?{" "}
        <Link href="/dashboard" className="font-semibold text-violet-600 hover:underline">
          Алгасах
        </Link>
      </p>
    </OnboardingCard>
  );
}
