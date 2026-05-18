"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Settings,
  Users,
  Building2,
  ShieldCheck,
  CreditCard,
  CheckSquare,
  CalendarDays,
  StickyNote,
  Crown,
  Zap,
  Flame,
  GitMerge,
  ChevronLeft,
  Menu,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import type { ElementType } from "react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { isUpgradedStudentPlan } from "@/lib/subscription-access";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { settingsRouteByRole } from "@/lib/dashboard-routes";
import { EduNityLogo } from "./EduNityLogo";
import { useMobileSidebar } from "./DashboardLayoutClient";

interface NavItem {
  labelKey: string;
  href: string;
  icon: ElementType;
  badge?: number;
}

const exactMatchOnlyHrefs = new Set(["/student", "/instructor", "/org", "/admin"]);

const navConfig: Record<UserRole, NavItem[]> = {
  USER: [
    { labelKey: "nav.overview", href: "/student", icon: LayoutDashboard },
    { labelKey: "nav.lessons", href: "/student/courses", icon: BookOpen },
    { labelKey: "nav.catalog", href: "/student/catalog", icon: GraduationCap },
    { labelKey: "nav.leaderboard", href: "/student/leaderboard", icon: Trophy },
    { labelKey: "nav.skillGraph", href: "/student/progress", icon: BarChart3 },
    { labelKey: "nav.messages", href: "/student/messages", icon: MessageSquare },
    { labelKey: "nav.notes", href: "/student/notes", icon: StickyNote },
    { labelKey: "nav.peerReview", href: "/student/peer-review", icon: GitMerge },
    { labelKey: "nav.settings", href: "/student/settings", icon: Settings },
  ],
  COMPANY: [
    { labelKey: "nav.dashboard", href: "/org", icon: LayoutDashboard },
    { labelKey: "nav.members", href: "/org/members", icon: Users },
    { labelKey: "nav.courses", href: "/org/courses", icon: BookOpen },
    { labelKey: "nav.programs", href: "/org/programs", icon: GraduationCap },
    { labelKey: "nav.analytics", href: "/org/analytics", icon: BarChart3 },
    { labelKey: "nav.settings", href: "/org/settings", icon: Settings },
  ],
  SUPER_ADMIN: [
    { labelKey: "nav.dashboard", href: "/admin", icon: LayoutDashboard },
    { labelKey: "nav.users", href: "/admin/users", icon: Users },
    { labelKey: "nav.courses", href: "/admin/courses", icon: BookOpen },
    { labelKey: "nav.organizations", href: "/admin/organizations", icon: Building2 },
    { labelKey: "nav.analytics", href: "/admin/analytics", icon: BarChart3 },
    { labelKey: "nav.subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { labelKey: "nav.logs", href: "/admin/logs", icon: ShieldCheck },
    { labelKey: "nav.todos", href: "/admin/todos", icon: CheckSquare },
    { labelKey: "nav.calendar", href: "/admin/calendar", icon: CalendarDays },
    { labelKey: "nav.settings", href: "/admin/settings", icon: Settings },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "User",
  COMPANY: "Company",
  SUPER_ADMIN: "Super admin",
};

function subscriptionPlanLabel(plan?: string | null): string {
  const normalized = (plan ?? "STANDARD").toUpperCase();
  if (normalized === "PREMIUM") return "Premium";
  if (normalized === "PRO") return "Pro";
  return "Standard · Үнэгүй";
}

interface SidebarProps {
  role: UserRole;
  xp?: number;
  level?: number;
  streak?: number;
  subscriptionPlan?: string | null;
  messagesBadge?: number;
  userName?: string;
  userAvatar?: string | null;
}

export function DashboardSidebar({
  role,
  xp = 0,
  level = 1,
  streak = 0,
  subscriptionPlan,
  messagesBadge = 0,
  userName = "",
  userAvatar = null,
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { mobileOpen, closeSidebar } = useMobileSidebar();

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen]);
  const items = navConfig[role] ?? navConfig.USER;
  const isPremium = isUpgradedStudentPlan(subscriptionPlan);
  const isItemActive = (href: string) =>
    pathname === href || (!exactMatchOnlyHrefs.has(href) && pathname.startsWith(`${href}/`));

  const xpForLevel = (value: number) => {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, Infinity];
    return thresholds[value] ?? Infinity;
  };

  const xpPrev = xpForLevel(level - 1);
  const xpNext = xpForLevel(level);
  const progress =
    xpNext === Infinity
      ? 100
      : Math.min(100, Math.round(((xp - xpPrev) / (xpNext - xpPrev)) * 100));

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

    <aside
      className={cn(
        "relative flex h-full flex-shrink-0 flex-col border-r border-violet-100 bg-white transition-all duration-300 ease-in-out dark:border-violet-900/20 dark:bg-[#0d0b1f]",
        /* Desktop: normal inline sidebar */
        "hidden md:flex",
        collapsed ? "md:w-[72px]" : "md:w-[224px]",
        /* Mobile: fixed overlay sliding in from the left */
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[260px]",
        mobileOpen ? "max-md:flex max-md:translate-x-0" : "max-md:-translate-x-full",
      )}
    >
      <div
        className={cn(
          "relative flex h-16 items-center border-b border-violet-100 px-3 dark:border-violet-900/20",
          collapsed ? "justify-center" : "justify-start",
        )}
      >
        <EduNityLogo
          iconOnly={collapsed}
          className={cn(!collapsed && "pr-12")}
          iconClassName={collapsed ? "h-7" : "h-9"}
          textClassName="text-[1.8rem]"
        />
        <button
          onClick={() => setCollapsed((current) => !current)}
          className="absolute -right-4 top-1/2 z-10 hidden md:flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-violet-200/80 bg-white text-violet-600 shadow-[0_6px_18px_rgba(124,58,237,0.14)] backdrop-blur-sm transition-colors duration-100 hover:bg-violet-50 dark:border-violet-400/20 dark:bg-slate-950 dark:text-violet-200 dark:shadow-[0_8px_20px_rgba(2,6,23,0.72)] dark:hover:bg-violet-500/15"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </button>
        {/* Mobile-only close button */}
        <button
          onClick={closeSidebar}
          className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          aria-label="Хаах"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div
        className={cn(
          "shrink-0 border-b border-violet-100 dark:border-violet-900/20",
          collapsed ? "px-2 py-3" : "px-3 py-2.5",
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
              <span className="text-[11px] font-black text-white">{level}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-semibold text-orange-500">
                <Flame size={10} className="fill-orange-500" />
                <span>{streak}d</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                  <span className="text-[9px] font-black text-white">{level}</span>
                </div>
                <span className="text-xs font-bold text-foreground">Lv.{level}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                <Zap size={11} className="fill-violet-500 dark:fill-violet-400" />
                <span>{xp.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            {streak > 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                <Flame size={11} className="fill-orange-500 text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-500">{streak} өдрийн streak</span>
              </div>
            )}
          </>
        )}
      </div>

      {!collapsed && (
        <div className="shrink-0 px-4 pb-1 pt-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground/60">Menu</span>
        </div>
      )}

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-2", collapsed ? "px-1.5" : "px-2")}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          const badge = item.labelKey === "nav.messages" ? messagesBadge : item.badge;

          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t(item.labelKey)}
                className={cn(
                  "group relative flex h-10 w-full items-center justify-center overflow-hidden rounded-2xl border border-transparent transition-all duration-100",
                  active
                    ? "border-violet-300/40 bg-[#ede4fb] text-violet-700 shadow-[0_8px_18px_rgba(139,92,246,0.10)] dark:border-violet-400/10 dark:bg-[#261a35] dark:text-white"
                    : "text-slate-400 hover:bg-violet-50/80 hover:text-violet-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-100",
                )}
              >
                {active && (
                  <div className="absolute left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 via-fuchsia-400 to-violet-600 shadow-[0_0_12px_rgba(168,85,247,0.45)]" />
                )}
                <Icon
                  size={17}
                  className={cn(
                    "shrink-0 transition-colors",
                    active
                      ? "text-violet-700 dark:text-white"
                      : "text-slate-400 group-hover:text-violet-700 dark:text-slate-500 dark:group-hover:text-slate-100",
                  )}
                />
                {badge ? (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 overflow-hidden rounded-2xl border border-transparent px-3 py-2 text-[13px] font-medium transition-all duration-100",
                active
                  ? "border-violet-300/40 bg-[#ede4fb] text-violet-700 shadow-[0_8px_18px_rgba(139,92,246,0.10)] dark:border-violet-400/10 dark:bg-[#261a35] dark:text-white"
                  : "text-slate-500 hover:bg-violet-50/80 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100",
              )}
            >
              {active && (
                <div className="absolute left-1.5 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 via-fuchsia-400 to-violet-600 shadow-[0_0_12px_rgba(168,85,247,0.45)]" />
              )}
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  active
                    ? "text-violet-700 dark:text-white"
                    : "text-slate-400 group-hover:text-violet-700 dark:text-slate-500 dark:group-hover:text-slate-100",
                )}
              />
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
              {badge ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {role === "USER" && !isPremium && !collapsed && !profileOpen && (
        <div className="mx-3 mb-3 mt-2 shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl p-3"
            style={{ background: "linear-gradient(135deg, #3b0764 0%, #6d28d9 60%, #a855f7 100%)" }}
          >
            <div className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/10" />
            <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-white/5" />
            <div className="relative z-10 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-400/20">
                <Crown size={14} className="text-yellow-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold leading-tight text-white">{t("sidebar.upgrade.title")}</p>
                <p className="text-[10px] text-violet-200">{t("sidebar.upgrade.desc")}</p>
              </div>
            </div>
            <Link
              href="/student/upgrade"
              className="relative z-10 mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/15 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-white/25"
            >
              <Sparkles size={11} />
              {t("sidebar.upgrade.btn")}
            </Link>
          </div>
        </div>
      )}

      {role === "USER" && !isPremium && collapsed && (
        <div className="mb-2 mt-2 flex justify-center px-2">
          <Link
            href="/student/upgrade"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-md shadow-violet-200 transition-colors dark:shadow-violet-900/50"
            title="Upgrade"
          >
            <Crown size={16} className="text-yellow-300" />
          </Link>
        </div>
      )}

      {/* ── Profile section ──────────────────────────────────────────── */}
      <div
        ref={profileRef}
        className={cn(
          "relative shrink-0 border-t border-violet-100 dark:border-violet-900/20",
          collapsed ? "px-2 py-2.5" : "px-3 py-2.5",
          profileOpen && "z-50",
        )}
      >
        {profileOpen && collapsed && (
          <div className="absolute bottom-2 left-full z-50 ml-2 w-44 overflow-hidden rounded-2xl border border-violet-100 bg-white p-1.5 shadow-xl shadow-violet-200/70 dark:border-violet-800/40 dark:bg-[#13102a] dark:shadow-violet-950/50">
            <Link
              href={settingsRouteByRole[role]}
              onClick={() => setProfileOpen(false)}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-bold text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/25 dark:hover:text-violet-300"
            >
              <User size={14} className="text-violet-500" />
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="group mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}

        {profileOpen && !collapsed && (
          <div className="mb-2 overflow-hidden rounded-2xl border border-violet-100 bg-white p-1.5 shadow-lg shadow-violet-200/50 dark:border-violet-800/40 dark:bg-[#13102a] dark:shadow-violet-950/40">
            <Link
              href={settingsRouteByRole[role]}
              onClick={() => setProfileOpen(false)}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-bold text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/25 dark:hover:text-violet-300"
            >
              <User size={14} className="text-violet-500" />
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="group mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}

        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              title="Профайл"
              aria-expanded={profileOpen}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              {userAvatar ? (
                <Image
                  key={userAvatar}
                  src={userAvatar}
                  alt={userName || "Profile"}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-violet-300/50 dark:ring-violet-700/50 hover:ring-violet-500 transition-all"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-2 ring-violet-300/50 dark:ring-violet-700/50 hover:ring-violet-500 transition-all">
                  <span className="text-[13px] font-black text-white">
                    {userName ? userName[0].toUpperCase() : "?"}
                  </span>
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              aria-expanded={profileOpen}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              {userAvatar ? (
                <Image
                  key={userAvatar}
                  src={userAvatar}
                  alt={userName || "Profile"}
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-violet-300/50 dark:ring-violet-700/50"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-2 ring-violet-300/50 dark:ring-violet-700/50">
                  <span className="text-[12px] font-black text-white">
                    {userName ? userName[0].toUpperCase() : "?"}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold leading-tight text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                  {userName || "Хэрэглэгч"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {role === "USER" ? subscriptionPlanLabel(subscriptionPlan) : ROLE_LABELS[role]}
                </p>
              </div>
              <User size={13} className="shrink-0 text-muted-foreground/60 group-hover:text-violet-600 transition-colors" />
            </button>
          </div>
        )}
      </div>

    </aside>
  </>
  );
}
