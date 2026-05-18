"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { EduNityLogo } from "./EduNityLogo";
import { useState } from "react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

const NAV_LINKS = [
  { label: "Нүүр", href: "/" },
  { label: "Сургалтууд", href: "/courses" },
  { label: "Компаниуд", href: "/companies" },
  { label: "Үнэ", href: "/pricing" },
  { label: "Тухай", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const dashboardHref =
    session?.user.role === "SUPER_ADMIN" ? "/admin"
    : session?.user.role === "COMPANY" ? "/org"
    : "/student";

  const isDarkTheme = mounted && resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDarkTheme ? "light" : "dark");

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#150F22]/90 backdrop-blur-xl border-b border-[#E9DFFF] dark:border-[#2E2146] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/"><EduNityLogo /></Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-300 transition-colors rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: theme + auth */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-300"
            aria-label="Toggle theme"
          >
            {mounted ? (
              isDarkTheme ? <Sun size={16} /> : <Moon size={16} />
            ) : (
              <span aria-hidden="true" className="block h-4 w-4" />
            )}
          </button>

          {session ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl text-sm text-violet-700 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-500/20 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(session.user.name)}
              </div>
              Самбар
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
              >
                Нэвтрэх
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_14px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.45)]"
              >
                Бүртгүүлэх
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors text-[#6B7280] dark:text-[#A1A1AA]"
            aria-label="Toggle theme"
          >
            {mounted ? (
              isDarkTheme ? <Sun size={16} /> : <Moon size={16} />
            ) : (
              <span aria-hidden="true" className="block h-4 w-4" />
            )}
          </button>
          <button
            className="text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-500 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-[#150F22] border-t border-[#E9DFFF] dark:border-[#2E2146] px-4 py-4 space-y-1 animate-slide-up">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-300 py-2.5 text-sm transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <Link href={dashboardHref} className="block text-violet-600 dark:text-violet-300 font-medium py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Самбар</Link>
          ) : (
            <>
              <Link href="/login" className="block text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-300 py-2.5 text-sm transition-colors" onClick={() => setMobileOpen(false)}>Нэвтрэх</Link>
              <Link href="/register" className="block text-violet-600 dark:text-violet-300 font-semibold py-2.5 text-sm" onClick={() => setMobileOpen(false)}>Бүртгүүлэх</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
