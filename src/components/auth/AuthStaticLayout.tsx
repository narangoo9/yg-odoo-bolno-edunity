"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Shield, Star, Award, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { EduNityLogo } from "@/components/layout/EduNityLogo";

const features = [
  { icon: Shield, title: "Хамгаалалттай", text: "Таны мэдээлэл найдвартай хамгаалагдана." },
  { icon: Star, title: "Суралц. Хөгж. Ахиц.", text: "XP цуглуулж, ахицаа хянаарай." },
  { icon: Award, title: "Гэрчилгээ авах боломжтой", text: "Суралцсанаа баталгаажуулж, certificate аваарай." },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:text-violet-600 dark:bg-white/10 dark:text-gray-300 dark:hover:text-violet-300"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function HeroPanel() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src="/assets/mascot/login_bg.png"
        alt="EduNity hero scene"
        fill
        className="object-cover object-center"
        priority
        unoptimized
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg,rgba(30,5,70,.52) 0%,rgba(70,20,150,.12) 45%,rgba(30,5,70,.58) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Wave on right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[3] w-20 dark:hidden">
        <svg className="h-full w-full" viewBox="0 0 80 1000" preserveAspectRatio="none">
          <path d="M 80 0 L 80 1000 L 28 1000 C 66 820 4 615 64 500 C 4 385 66 180 28 0 Z" fill="#F8F7FF" />
        </svg>
      </div>
      <div className="pointer-events-none absolute -left-12 -top-24 z-[1] h-72 w-72 rounded-full bg-purple-400/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-10 right-0 z-[1] h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[80px]" />
      <div className="relative z-[4] flex h-full flex-col">
        <div className="flex justify-end p-8">
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "backOut" }}
            className="relative max-w-[220px] rounded-[20px] px-5 py-4 shadow-xl"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <Shield size={13} className="shrink-0 text-violet-300" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/80">EduNity</span>
            </div>
            <p className="text-[13px] font-bold leading-snug text-white">Сайн уу! EduNity-д<br />тавтай морил.</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/65">Хичээл үзэж, XP цуглуулж,<br />certificate аваарай.</p>
            <span className="absolute bottom-3 right-4 select-none text-base text-yellow-300">✦</span>
          </motion.div>
        </div>
        <div className="relative flex-1">
          <motion.div className="absolute left-[14%] top-[8%]" animate={{ y: [0, -12, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }}>
              <GraduationCap size={28} className="text-white" />
            </div>
          </motion.div>
          <motion.div className="absolute right-[9%] top-[22%]" animate={{ y: [0, -10, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }}>
              <BookOpen size={22} className="text-violet-200" />
            </div>
          </motion.div>
        </div>
        <div className="px-10 pb-8">
          <div className="grid grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }} className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <Icon size={16} className="text-violet-200" />
                </div>
                <div>
                  <p className="text-[11px] font-bold leading-snug text-white">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-white/55">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthStaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── DESKTOP (lg+) ── */}
      <div className="relative hidden min-h-screen bg-[#F8F7FF] dark:bg-[#0f0e1a] lg:flex">
        <ThemeToggle />

        {/* Hero – left 52% */}
        <div className="relative w-[52%] flex-shrink-0">
          <HeroPanel />
        </div>

        {/* Form – right flex */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-[500px]">
            <Link href="/" className="mb-8 inline-flex">
              <EduNityLogo iconClassName="h-8" textClassName="text-xl" />
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="rounded-[32px] bg-white p-10 dark:bg-[#1a1630]"
              style={{ boxShadow: "0 8px 48px rgba(109,40,217,0.10),0 2px 12px rgba(0,0,0,0.06)" }}
            >
              {children}
            </motion.div>
            <p className="mt-6 text-center text-[11px] text-gray-400">
              © 2026 EduNity. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </div>
        </div>
      </div>

      {/* ── MOBILE (<lg) ── */}
      <div className="relative min-h-screen bg-[#F8F7FF] dark:bg-[#0f0e1a] lg:hidden">
        <ThemeToggle />
        <div className="relative h-44 overflow-hidden">
          <Image src="/assets/mascot/login_bg.png" alt="EduNity hero" fill className="object-cover object-center" priority unoptimized />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(30,5,70,.4) 0%,rgba(70,20,150,.1) 60%,rgba(248,247,255,1) 100%)" }} />
        </div>
        <div className="relative z-10 -mt-6 px-4 pb-8">
          <Link href="/" className="mb-4 inline-flex">
            <EduNityLogo iconClassName="h-7" textClassName="text-lg" />
          </Link>
          <div className="rounded-[28px] bg-white p-7 dark:bg-[#1a1630]" style={{ boxShadow: "0 8px 48px rgba(109,40,217,0.10),0 2px 12px rgba(0,0,0,0.06)" }}>
            {children}
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-400">
            © 2026 EduNity. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </>
  );
}
