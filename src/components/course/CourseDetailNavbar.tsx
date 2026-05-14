"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowLeft, Globe, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { EduNityLogo } from "@/components/layout/EduNityLogo";
import { useMounted } from "@/lib/use-mounted";
import { getInitials } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localeLabels, type Locale } from "@/lib/i18n/translations";

const LOCALES = Object.keys(localeLabels) as Locale[];

export function CourseDetailNavbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const { locale, setLocale, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const isDark = mounted && resolvedTheme === "dark";

  const dashboardHref =
    session?.user.role === "SUPER_ADMIN" ? "/admin"
    : session?.user.role === "INSTRUCTOR" ? "/instructor"
    : session?.user.role === "ORG_ADMIN" ? "/org"
    : "/student";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    if (langOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [langOpen]);

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white/95 dark:bg-[#0D0720]/95 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[#1E1B2E]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">

        {/* Left: back + logo + mascot */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-[#2E2146] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-200 dark:hover:border-violet-700 transition-all"
            aria-label="Буцах"
          >
            <ArrowLeft size={16} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <EduNityLogo />
            <Image
              src="/assets/mascot/mascot-wave.png"
              alt=""
              width={28}
              height={28}
              className="select-none hidden sm:block"
              aria-hidden
            />
          </Link>
        </div>

        {/* Right: lang + theme + user */}
        <div className="flex items-center gap-2">

          {/* Language picker */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2E2146] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-200 dark:hover:border-violet-700 transition-all text-xs font-medium"
              aria-label={t("topbar.language")}
            >
              <Globe size={13} />
              <span className="hidden sm:inline">{localeLabels[locale]}</span>
              <ChevronDown size={11} className={`transition-transform duration-150 ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#120E20] border border-[#E5E7EB] dark:border-[#2E2146] rounded-xl shadow-lg overflow-hidden z-50">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      l === locale
                        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                        : "text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1628]"
                    }`}
                  >
                    {localeLabels[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E5E7EB] dark:border-[#2E2146] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-200 dark:hover:border-violet-700 transition-all"
            aria-label="Toggle theme"
          >
            {mounted
              ? isDark ? <Sun size={15} /> : <Moon size={15} />
              : <span className="block w-4 h-4" aria-hidden />}
          </button>

          {/* User / Login */}
          {session ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 h-9 px-3 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                {session.user.image
                  ? <img src={session.user.image} className="w-full h-full object-cover" alt="" />
                  : getInitials(session.user.name)}
              </div>
              <span className="hidden sm:inline">{t("course.myCourses")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="h-9 px-4 flex items-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all"
            >
              Нэвтрэх
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
