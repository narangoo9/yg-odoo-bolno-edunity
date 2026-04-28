"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, BookOpen, Star, Trophy, Zap } from "lucide-react";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNavigation } from "@/components/onboarding/OnboardingNavigation";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import { MascotImage } from "@/components/brand/MascotImage";

const FLOATERS = [
  { icon: BookOpen, label: "Course", color: "bg-violet-100 text-violet-600", x: "-left-4", y: "top-8" },
  { icon: Trophy, label: "100 XP", color: "bg-amber-100 text-amber-600", x: "right-2", y: "top-4" },
  { icon: Award, label: "Certificate", color: "bg-emerald-100 text-emerald-600", x: "-left-2", y: "bottom-6" },
  { icon: Star, label: "4.9 ★", color: "bg-fuchsia-100 text-fuchsia-600", x: "right-0", y: "bottom-10" },
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
      mascotVariant="wave"
      mascotBubbleText="Би чамд эхний course-оо олоход тусална."
      mascotSize={180}
      step={0}
    >
      {/* Floating illustration elements (decorative) */}
      <div className="relative mb-6">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
          {/* Center mascot small (mobile visible version) */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <MascotImage variant="wave" size={80} className="drop-shadow-lg lg:hidden" />
          </motion.div>

          {/* Floating badges */}
          {FLOATERS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
              className={`absolute ${f.x} ${f.y} hidden lg:flex`}
            >
              <div className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold shadow-sm ${f.color}`}>
                <f.icon size={11} />
                {f.label}
              </div>
            </motion.div>
          ))}

          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-2xl" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="mb-2 text-2xl font-black tracking-tight text-foreground">
          EduNity-д тавтай морил 👋
        </h1>
        <p className="mb-6 text-[14px] leading-relaxed text-muted-foreground">
          Өөрийн сурах замаа сонгоод, тохирох course санал болгуулж, certificate цуглуулж эхлээрэй.
        </p>

        {/* XP reward hint */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 flex items-center gap-2.5 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-800/30 dark:bg-violet-900/15"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-violet-700 dark:text-violet-300">+50 XP Bonus</p>
            <p className="text-[11px] text-muted-foreground">Onboarding дуусгасны шагнал</p>
          </div>
        </motion.div>
      </motion.div>

      <OnboardingNavigation
        onNext={handleStart}
        nextLabel="Эхлэх"
        showBack={false}
      />

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Шууд орох уу?{" "}
        <Link href="/student" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
          Алгасах
        </Link>
      </p>
    </OnboardingCard>
  );
}
