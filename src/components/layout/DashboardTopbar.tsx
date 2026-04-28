"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { Bell, Search, LogOut, User, ChevronDown, Sun, Moon, Languages } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { getInitials } from "@/lib/utils";
import { notificationsRouteByRole, settingsRouteByRole } from "@/lib/dashboard-routes";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { localeLabels, type Locale } from "@/lib/i18n/translations";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

interface TopbarUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
}

const locales: Locale[] = ["mn", "en", "de", "ko", "ja", "zh"];

export function DashboardTopbar({
  user,
  unreadNotifications,
}: {
  user: TopbarUser;
  unreadNotifications: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const profileHref = settingsRouteByRole[user.role];
  const notificationHref = notificationsRouteByRole[user.role];

  const isDarkTheme = mounted && resolvedTheme === "dark";
  const themeTitle = isDarkTheme ? t("topbar.theme.dark") : t("topbar.theme.light");

  return (
    <header className="h-16 bg-white dark:bg-[#0d0b1f] border-b border-violet-100 dark:border-violet-900/20 flex items-center justify-between px-6 gap-4 shrink-0 shadow-sm shadow-violet-100/50 dark:shadow-none">
      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 dark:text-muted-foreground" />
        <input
          type="search"
          placeholder={t("topbar.search")}
          className="w-full pl-9 pr-4 py-2 text-sm bg-[#f5f3ff] dark:bg-violet-900/10 border border-violet-200/60 dark:border-violet-800/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:bg-white dark:focus:bg-violet-900/20 text-foreground dark:text-slate-100 placeholder:text-muted-foreground/80 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Language switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-muted-foreground dark:text-muted-foreground/60"
            title={t("topbar.language")}
          >
            <Languages size={18} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#13102a] rounded-xl border border-violet-100 dark:border-violet-800/30 shadow-lg shadow-violet-100/50 dark:shadow-violet-900/20 py-1 z-50">
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLocale(l); setLangOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors",
                    locale === l
                      ? "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-medium"
                      : "text-foreground dark:text-muted-foreground/60 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  )}
                >
                  <span>{localeLabels[l]}</span>
                  <span className="text-xs text-muted-foreground/80 uppercase">{l}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-muted-foreground dark:text-muted-foreground/60"
          title={mounted ? themeTitle : undefined}
          aria-label={mounted ? themeTitle : undefined}
        >
          {mounted ? (
            isDarkTheme ? <Moon size={16} /> : <Sun size={16} />
          ) : (
            <span aria-hidden="true" className="block h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <Link
          href={notificationHref}
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
        >
          <Bell size={18} className="text-muted-foreground dark:text-muted-foreground/60" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-xs bg-muted dark:bg-slate-700 text-foreground dark:text-slate-200">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground dark:text-slate-100 leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-0.5">{user.email}</p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground/80 hidden md:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#13102a] rounded-xl border border-violet-100 dark:border-violet-800/30 shadow-lg shadow-violet-100/50 dark:shadow-violet-900/20 py-1 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-border dark:border-slate-700">
                <p className="text-sm font-medium text-foreground dark:text-slate-100 truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 truncate">{user.email}</p>
              </div>
              <Link
                href={profileHref}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground dark:text-muted-foreground/60 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                <User size={14} />
                {t("topbar.profile")}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} />
                {t("topbar.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
