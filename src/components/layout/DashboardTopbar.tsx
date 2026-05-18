"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { Bell, Search, Sun, Moon, Languages, BookOpen, Trophy, Award, MessageSquare, X, GitMerge, CheckCheck, Menu, Bookmark } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { getInitials } from "@/lib/utils";
import { settingsRouteByRole } from "@/lib/dashboard-routes";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMobileSidebar } from "@/components/layout/DashboardLayoutClient";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { localeLabels, type Locale } from "@/lib/i18n/translations";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TopbarUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
}

interface NotifItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}

const locales: Locale[] = ["mn", "en", "de", "ko", "ja", "zh"];

// Map notification types to icons
function NotifIcon({ type }: { type: string }) {
  const cls = "shrink-0";
  if (type.includes("CERTIFICATE")) return <Award size={13} className={cn(cls, "text-amber-500")} />;
  if (type.includes("QUIZ"))        return <Trophy size={13} className={cn(cls, "text-violet-500")} />;
  if (type.includes("ENROLLMENT"))  return <BookOpen size={13} className={cn(cls, "text-blue-500")} />;
  if (type.includes("MESSAGE"))     return <MessageSquare size={13} className={cn(cls, "text-emerald-500")} />;
  if (type.includes("PEER"))        return <GitMerge size={13} className={cn(cls, "text-fuchsia-500")} />;
  return <Bell size={13} className={cn(cls, "text-muted-foreground")} />;
}

const dropdownVariants: Variants = {
  hidden:  { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.13, ease: "easeIn" } },
};

export function DashboardTopbar({
  user,
  unreadNotifications,
  savedCoursesCount = 0,
}: {
  user: TopbarUser;
  unreadNotifications: number;
  /** Student: total saved courses (catalog bookmark); shown as red badge like notifications */
  savedCoursesCount?: number;
}) {
  const [langOpen,  setLangOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs,    setNotifs]    = useState<NotifItem[]>([]);
  const [notifCount, setNotifCount] = useState(unreadNotifications);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [themeSpin, setThemeSpin] = useState(false);
  const [bellShake, setBellShake] = useState(notifCount > 0);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedCourses, setSavedCourses] = useState<{ id: string; title: string; slug: string; thumbnailUrl: string | null; instructor: { name: string | null } }[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedBadgeCount, setSavedBadgeCount] = useState(savedCoursesCount);
  const [savedBadgeShake, setSavedBadgeShake] = useState(savedCoursesCount > 0);

  const langRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const mounted  = useMounted();
  const { openSidebar } = useMobileSidebar();
  const savedSeenStorageKey = `saved-courses-seen:${user.id}`;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale, t }    = useLanguage();
  const isDarkTheme = mounted && resolvedTheme === "dark";
  const profileHref = settingsRouteByRole[user.role];

  // Close all dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current  && !langRef.current.contains(e.target as Node))  setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (savedRef.current && !savedRef.current.contains(e.target as Node)) setSavedOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openSavedCourses = useCallback(async () => {
    setSavedOpen((isOpen) => {
      const nextOpen = !isOpen;
      if (nextOpen) {
        setSavedBadgeCount(0);
        setSavedBadgeShake(false);
        try {
          window.localStorage.setItem(savedSeenStorageKey, String(savedCoursesCount));
        } catch {
          // localStorage can be unavailable in restricted browser contexts.
        }
      }
      return nextOpen;
    });
    if (savedCourses.length > 0) return;
    setLoadingSaved(true);
    try {
      const res = await fetch("/api/v1/saved-courses");
      const data = await res.json();
      setSavedCourses(data.courses ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingSaved(false);
    }
  }, [savedCourses.length, savedCoursesCount, savedSeenStorageKey]);

  // Bell shake on mount if there are unread notifications
  useEffect(() => {
    if (notifCount > 0) {
      setBellShake(true);
      const t = setTimeout(() => setBellShake(false), 800);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let seenCount = 0;
    try {
      seenCount = Number(window.localStorage.getItem(savedSeenStorageKey) ?? "0");
    } catch {
      seenCount = 0;
    }
    const unseenCount = Math.max(savedCoursesCount - seenCount, 0);
    setSavedBadgeCount(unseenCount);
    setSavedBadgeShake(unseenCount > 0);
  }, [savedCoursesCount, savedSeenStorageKey]);

  useEffect(() => {
    if (savedCoursesCount > 0) {
      const t = setTimeout(() => setSavedBadgeShake(false), 800);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNotifications = useCallback(async () => {
    setNotifOpen((v) => !v);
    if (notifs.length > 0) return; // already loaded

    setLoadingNotifs(true);
    try {
      const res  = await fetch("/api/v1/notifications");
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setNotifCount(0); // mark as seen
    } catch {
      // silently fail — keep count visible
    } finally {
      setLoadingNotifs(false);
    }
  }, [notifs.length]);

  const handleThemeToggle = () => {
    setTheme(isDarkTheme ? "light" : "dark");
    setThemeSpin(true);
    setTimeout(() => setThemeSpin(false), 420);
  };

  return (
    <header className="relative h-16 shrink-0 bg-white dark:bg-[#0d0b1f] border-b border-violet-100 dark:border-violet-900/20 flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4 shadow-sm shadow-violet-100/50 dark:shadow-none transition-colors duration-300">
      {/* Mobile hamburger */}
      <button
        onClick={openSidebar}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 text-muted-foreground transition-colors shrink-0"
        aria-label="Меню нээх"
      >
        <Menu size={20} />
      </button>

      <Suspense
        fallback={
          <div className="hidden md:block flex-1 max-w-sm h-9 rounded-xl bg-muted/50 animate-pulse" />
        }
      >
        <HeaderSearch
          role={user.role}
          placeholder={t("topbar.search")}
          className="hidden md:block flex-1 max-w-sm"
        />
      </Suspense>

      <button
        type="button"
        onClick={() => setMobileSearchOpen((v) => !v)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 text-muted-foreground shrink-0"
        aria-label={t("topbar.search")}
      >
        <Search size={18} />
      </button>

      <div className="flex items-center gap-2 ml-auto">

        {/* ── Language switcher ─────────────────────────────── */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-muted-foreground"
            title={t("topbar.language")}
          >
            <Languages size={18} />
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-44 origin-top-right bg-white dark:bg-[#13102a] rounded-xl border border-violet-100 dark:border-violet-800/30 shadow-lg shadow-violet-100/50 dark:shadow-violet-900/20 py-1 z-50"
              >
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setLangOpen(false); }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors",
                      locale === l
                        ? "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-medium"
                        : "text-foreground dark:text-muted-foreground/60 hover:bg-violet-50 dark:hover:bg-violet-900/20",
                    )}
                  >
                    <span>{localeLabels[l]}</span>
                    <span className="text-xs text-muted-foreground/80 uppercase">{l}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Theme toggle ──────────────────────────────────── */}
        <button
          onClick={handleThemeToggle}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-muted-foreground"
          title={mounted ? (isDarkTheme ? t("topbar.theme.dark") : t("topbar.theme.light")) : undefined}
          aria-label={mounted ? (isDarkTheme ? t("topbar.theme.dark") : t("topbar.theme.light")) : undefined}
        >
          {mounted ? (
            <span className={cn("block", themeSpin && "animate-spin-once")}>
              {isDarkTheme ? <Moon size={16} /> : <Sun size={16} />}
            </span>
          ) : (
            <span aria-hidden="true" className="block h-4 w-4" />
          )}
        </button>

        {/* ── Saved courses (students only) ─────────────────── */}
        {user.role === "USER" && (
          <div className="relative" ref={savedRef}>
            <button
              onClick={openSavedCourses}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              aria-label={
                savedBadgeCount > 0
                  ? `Хадгалсан курсууд (${savedBadgeCount})`
                  : "Хадгалсан курсууд"
              }
              title={
                savedBadgeCount > 0
                  ? `Хадгалсан: ${savedBadgeCount} курс`
                  : "Хадгалсан курсууд"
              }
            >
              <Bookmark
                size={18}
                className={cn(
                  "transition-colors",
                  savedOpen ? "text-violet-600 fill-violet-100" : "text-muted-foreground",
                  savedBadgeShake && "animate-bell-shake",
                )}
              />
              <AnimatePresence>
                {savedBadgeCount > 0 && (
                  <motion.span
                    key="saved-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="animate-notif-ring absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-semibold"
                  >
                    {savedBadgeCount > 9 ? "9+" : savedBadgeCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <AnimatePresence>
              {savedOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 mt-2 w-72 max-h-[380px] overflow-hidden origin-top-right bg-white dark:bg-[#13102a] rounded-2xl border border-violet-100 dark:border-violet-800/30 shadow-xl shadow-violet-100/50 dark:shadow-violet-900/30 z-50 flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <Bookmark size={14} className="text-violet-500" />
                      <span className="text-[13px] font-black text-foreground">Хадгалсан курсууд</span>
                      {savedBadgeCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {savedBadgeCount > 9 ? "9+" : savedBadgeCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSavedOpen(false)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {loadingSaved ? (
                      <div className="space-y-2 p-3">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex gap-2 animate-pulse">
                            <div className="h-10 w-14 rounded-lg bg-muted shrink-0" />
                            <div className="flex-1 space-y-1.5 py-1">
                              <div className="h-2.5 w-3/4 rounded bg-muted" />
                              <div className="h-2 w-1/2 rounded bg-muted" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : savedCourses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bookmark size={24} className="mb-2 text-violet-300" />
                        <p className="text-[12px] font-semibold text-foreground">Хадгалсан курс байхгүй</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Каталогоос курс хадгалаарай</p>
                      </div>
                    ) : (
                      <ul className="py-1">
                        {savedCourses.map((course) => (
                          <li key={course.id}>
                            <Link
                              href={`/courses/${course.slug}`}
                              onClick={() => setSavedOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 dark:hover:bg-white/5 transition-colors"
                            >
                              <div className="h-10 w-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                                {course.thumbnailUrl ? (
                                  <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-violet-100 dark:bg-violet-900/30">
                                    <BookOpen size={14} className="text-violet-500" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-foreground line-clamp-1">{course.title}</p>
                                <p className="text-[11px] text-muted-foreground">{course.instructor.name}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {savedCourses.length > 0 && (
                    <div className="border-t border-border p-2 shrink-0">
                      <Link
                        href="/student/saved"
                        onClick={() => setSavedOpen(false)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 text-[12px] font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors"
                      >
                        Бүгдийг харах
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Notification bell ─────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ""}`}
          >
            <Bell
              size={18}
              className={cn(
                "text-muted-foreground transition-colors",
                bellShake && "animate-bell-shake",
              )}
            />
            <AnimatePresence>
              {notifCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="animate-notif-ring absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center"
                >
                  {notifCount > 9 ? "9+" : notifCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Notification panel */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-hidden origin-top-right bg-white dark:bg-[#13102a] rounded-2xl border border-violet-100 dark:border-violet-800/30 shadow-xl shadow-violet-100/50 dark:shadow-violet-900/30 z-50 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-violet-500" />
                    <span className="text-[13px] font-black text-foreground">Мэдэгдэл</span>
                    {notifCount > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                  {loadingNotifs ? (
                    <div className="space-y-2 p-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex gap-2 animate-pulse">
                          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2.5 w-3/4 rounded bg-muted" />
                            <div className="h-2 w-1/2 rounded bg-muted" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <CheckCheck size={28} className="mb-2 text-violet-400" />
                      <p className="text-[13px] font-semibold text-foreground">Бүгд уншигдсан</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Шинэ мэдэгдэл байхгүй байна.</p>
                    </div>
                  ) : (
                    <ul className="py-1">
                      {notifs.map((n, i) => (
                        <li
                          key={n.id}
                          className="animate-notif-item flex items-start gap-3 px-4 py-3 hover:bg-muted/40 dark:hover:bg-white/5 transition-colors border-b border-border/40 last:border-0"
                          style={{ animationDelay: `${i * 0.04}s` }}
                        >
                          <div className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            n.isRead ? "bg-muted" : "bg-violet-100 dark:bg-violet-900/30",
                          )}>
                            <NotifIcon type={n.type} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-[12px] leading-snug",
                              n.isRead ? "text-muted-foreground font-medium" : "text-foreground font-bold",
                            )}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground/60">
                              {formatDistanceToNow(new Date(n.sentAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden="true" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── User avatar → profile ─────────────────────────── */}
        <Link
          href={profileHref}
          className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-violet-400/60 transition-all"
          title={t("topbar.profile")}
        >
          <Avatar key={user.image ?? "no-avatar"} className="w-8 h-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-xs bg-muted dark:bg-slate-700 text-foreground dark:text-slate-200">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Mobile search panel */}
      <AnimatePresence>
        {mobileSearchOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute left-0 right-0 top-16 z-50 border-b border-violet-100 bg-white px-3 py-3 dark:border-violet-900/30 dark:bg-[#0d0b1f]"
          >
            <Suspense fallback={<div className="h-9 rounded-xl bg-muted/50 animate-pulse" />}>
              <HeaderSearch
                role={user.role}
                placeholder={t("topbar.search")}
                className="w-full"
              />
            </Suspense>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
