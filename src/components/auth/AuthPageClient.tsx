"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, Shield, Star, Award, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { EduNityLogo } from "@/components/layout/EduNityLogo";
import { LoginForm } from "@/components/forms/LoginForm";
import { RegisterForm } from "@/components/forms/RegisterForm";

type AuthMode = "login" | "register";

const SLIDE_DURATION = 0.78;
const SLIDE_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];

const features = [
  { icon: Shield, title: "Хамгаалалттай", text: "Таны мэдээлэл найдвартай хамгаалагдана." },
  { icon: Star, title: "Суралц. Хөгж. Ахиц.", text: "XP цуглуулж, ахицаа хянаарай." },
  { icon: Award, title: "Гэрчилгээ авах боломжтой", text: "Суралцсанаа баталгаажуулж, certificate аваарай." },
];

// ── Dark-mode-aware theme toggle ────────────────────────────────────────────
function ThemeToggle({ className }: { className?: string }) {
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
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm transition-all",
        "bg-white/80 text-gray-500 shadow-sm hover:text-violet-600",
        "dark:bg-white/10 dark:text-gray-300 dark:hover:text-violet-300",
        className
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

// ── Purple hero panel ────────────────────────────────────────────────────────
function HeroPanel({ isRegister }: { isRegister: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src="/assets/mascot/login_bg.png"
        alt="EduNity hero"
        fill
        className="object-cover object-center"
        priority
        unoptimized
      />
      {/* dark gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg,rgba(30,5,70,.52) 0%,rgba(70,20,150,.12) 45%,rgba(30,5,70,.58) 100%)",
        }}
      />
      {/* grid */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Wave – right edge (login mode: hero is LEFT) */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 z-[3] w-20 dark:hidden"
        animate={{ opacity: isRegister ? 0 : 1 }}
        transition={{ duration: 0.18, delay: isRegister ? 0 : 0.64 }}
      >
        <svg className="h-full w-full" viewBox="0 0 80 1000" preserveAspectRatio="none">
          <path d="M 80 0 L 80 1000 L 28 1000 C 66 820 4 615 64 500 C 4 385 66 180 28 0 Z" fill="#F8F7FF" />
        </svg>
      </motion.div>

      {/* Wave – left edge (register mode: hero is RIGHT) */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-20 dark:hidden"
        animate={{ opacity: isRegister ? 1 : 0 }}
        transition={{ duration: 0.18, delay: isRegister ? 0.64 : 0 }}
      >
        <svg className="h-full w-full" viewBox="0 0 80 1000" preserveAspectRatio="none">
          <path d="M 0 0 L 0 1000 L 52 1000 C 14 820 76 615 16 500 C 76 385 14 180 52 0 Z" fill="#F8F7FF" />
        </svg>
      </motion.div>

      {/* glow blobs */}
      <div className="pointer-events-none absolute -left-12 -top-24 z-[1] h-72 w-72 rounded-full bg-purple-400/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-10 right-0 z-[1] h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[80px]" />

      {/* Content layer */}
      <div className="relative z-[4] flex h-full flex-col">
        {/* Speech bubble */}
        <div className={`flex p-8 ${isRegister ? "justify-start" : "justify-end"}`}>
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "backOut" }}
            className="relative max-w-[220px] rounded-[20px] px-5 py-4 shadow-xl"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <Shield size={13} className="shrink-0 text-violet-300" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/80">
                EduNity
              </span>
            </div>
            <p className="text-[13px] font-bold leading-snug text-white">
              Сайн уу! EduNity-д
              <br />
              тавтай морил.
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/65">
              Хичээл үзэж, XP цуглуулж,
              <br />
              certificate аваарай.
            </p>
            <span className="absolute bottom-3 right-4 select-none text-base text-yellow-300">
              ✦
            </span>
          </motion.div>
        </div>

        {/* Floating icon bubbles */}
        <div className="relative flex-1">
          <motion.div
            className="absolute left-[14%] top-[8%]"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.22)",
              }}
            >
              <GraduationCap size={28} className="text-white" />
            </div>
          </motion.div>
          <motion.div
            className="absolute right-[9%] top-[22%]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.22)",
              }}
            >
              <BookOpen size={22} className="text-violet-200" />
            </div>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="px-10 pb-8">
          <div className="grid grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                className="flex items-start gap-2.5"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
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

// ── Shared card wrapper ──────────────────────────────────────────────────────
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[28px] bg-white p-8 dark:bg-[#1a1630]"
      style={{ boxShadow: "0 8px 48px rgba(109,40,217,0.10),0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function AuthPageClient({
  initialMode,
  registered,
  referralCode,
}: {
  initialMode: AuthMode;
  registered?: string;
  referralCode?: string;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const isRegister = mode === "register";

  const switchToLogin = useCallback(() => setMode("login"), []);
  const switchToRegister = useCallback(() => setMode("register"), []);

  return (
    <>
      {/* ══ DESKTOP (lg+) ═══════════════════════════════════════════════════ */}
      <div className="relative hidden min-h-screen overflow-hidden bg-[#F8F7FF] dark:bg-[#0f0e1a] lg:block">
        {/* Theme toggle – top right, above hero panel */}
        <ThemeToggle className="absolute right-4 top-4 z-30" />

        {/* ── Register form – always LEFT half ── */}
        <div className="no-scrollbar absolute left-0 top-0 flex h-full w-1/2 flex-col overflow-y-auto px-10 xl:px-14">
          <div className="mx-auto my-auto w-full max-w-[440px] py-8">
            <Link href="/" className="mb-6 inline-flex">
              <EduNityLogo iconClassName="h-7" textClassName="text-lg" />
            </Link>
            <AuthCard>
              <div className="mb-5">
                <h1 className="text-[25px] font-black text-gray-900 dark:text-white">
                  Бүртгүүлэх
                </h1>
                <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                  Бүртгэл байна уу?{" "}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-semibold text-violet-600 hover:underline"
                  >
                    Нэвтрэх
                  </button>
                </p>
              </div>
              <RegisterForm referralCode={referralCode} />
            </AuthCard>
            <p className="mt-5 text-center text-[10px] text-gray-400">
              © 2026 EduNity. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </div>
        </div>

        {/* ── Login form – always RIGHT half ── */}
        <div className="no-scrollbar absolute right-0 top-0 flex h-full w-1/2 flex-col overflow-y-auto px-10 xl:px-14">
          <div className="mx-auto my-auto w-full max-w-[440px] py-8">
            <Link href="/" className="mb-6 inline-flex">
              <EduNityLogo iconClassName="h-7" textClassName="text-lg" />
            </Link>
            <AuthCard>
              <div className="mb-5">
                <h1 className="text-[25px] font-black text-gray-900 dark:text-white">
                  Нэвтрэх
                </h1>
                <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                  Бүртгэл байхгүй юу?{" "}
                  <button
                    type="button"
                    onClick={switchToRegister}
                    className="font-semibold text-violet-600 hover:underline"
                  >
                    Бүртгүүлэх
                  </button>
                </p>
              </div>
              {registered === "1" && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800/40 dark:bg-green-900/15 dark:text-green-400">
                  Бүртгэл амжилттай! Одоо нэвтэрнэ үү.
                </div>
              )}
              <LoginForm />
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-[13px] text-gray-400 transition-colors hover:text-violet-600"
                >
                  Нууц үг мартсан уу?
                </Link>
              </div>
            </AuthCard>
            <p className="mt-5 text-center text-[10px] text-gray-400">
              © 2026 EduNity. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </div>
        </div>

        {/* ── Purple hero panel – slides OVER the forms ── */}
        <motion.div
          className="absolute left-0 top-0 z-20 h-full w-1/2"
          animate={{ x: isRegister ? "100%" : "0%" }}
          transition={{ duration: SLIDE_DURATION, ease: SLIDE_EASE }}
        >
          <HeroPanel isRegister={isRegister} />
        </motion.div>
      </div>

      {/* ══ MOBILE (<lg) ════════════════════════════════════════════════════ */}
      <div className="no-scrollbar relative min-h-screen overflow-y-auto bg-[#F8F7FF] dark:bg-[#0f0e1a] lg:hidden">
        <ThemeToggle className="absolute right-4 top-4 z-20" />

        {/* Hero banner */}
        <div className="relative h-44 overflow-hidden">
          <Image
            src="/assets/mascot/login_bg.png"
            alt="EduNity hero"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,rgba(30,5,70,.4) 0%,rgba(70,20,150,.1) 60%,rgba(248,247,255,1) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 -mt-6 px-4 pb-8">
          <Link href="/" className="mb-4 inline-flex">
            <EduNityLogo iconClassName="h-7" textClassName="text-lg" />
          </Link>

          <AuthCard>
            {/* Tab toggle */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/10">
              {(["login", "register"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-lg py-2 text-[13px] font-semibold transition-all",
                    mode === m
                      ? "bg-white text-violet-700 shadow-sm dark:bg-[#1a1630] dark:text-violet-300"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {m === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="m-login"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  {registered === "1" && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      Бүртгэл амжилттай! Одоо нэвтэрнэ үү.
                    </div>
                  )}
                  <LoginForm />
                  <div className="mt-4 text-center">
                    <Link
                      href="/forgot-password"
                      className="text-[13px] text-gray-400 transition-colors hover:text-violet-600"
                    >
                      Нууц үг мартсан уу?
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="m-register"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  <RegisterForm referralCode={referralCode} />
                </motion.div>
              )}
            </AnimatePresence>
          </AuthCard>

          <p className="mt-4 text-center text-[11px] text-gray-400">
            © 2026 EduNity. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </>
  );
}
