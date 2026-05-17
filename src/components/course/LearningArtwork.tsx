import type { ElementType } from "react";
import { Code2, Palette, Cpu, BarChart2, Globe, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    // Deep violet — tech/programming
    bg: "from-[#1a0533] via-[#3b0764] to-[#6d28d9]",
    accent: "bg-violet-400/20",
    accentB: "bg-fuchsia-300/15",
    dot: "bg-white/10",
    icon: Code2,
    iconColor: "text-violet-200",
    tagBg: "bg-violet-500/25 text-violet-100",
    stripe: "rgba(139,92,246,0.12)",
  },
  {
    // Ocean blue — data/analytics
    bg: "from-[#0c1a3a] via-[#1e3a8a] to-[#0ea5e9]",
    accent: "bg-sky-300/20",
    accentB: "bg-blue-200/15",
    dot: "bg-white/10",
    icon: BarChart2,
    iconColor: "text-sky-200",
    tagBg: "bg-sky-500/25 text-sky-100",
    stripe: "rgba(14,165,233,0.10)",
  },
  {
    // Forest teal — design/creative
    bg: "from-[#0d2620] via-[#065f46] to-[#10b981]",
    accent: "bg-emerald-300/20",
    accentB: "bg-teal-200/15",
    dot: "bg-white/10",
    icon: Palette,
    iconColor: "text-emerald-200",
    tagBg: "bg-emerald-500/25 text-emerald-100",
    stripe: "rgba(16,185,129,0.10)",
  },
  {
    // Crimson rose — business/marketing
    bg: "from-[#2d0a18] via-[#9f1239] to-[#f43f5e]",
    accent: "bg-rose-300/20",
    accentB: "bg-pink-200/12",
    dot: "bg-white/10",
    icon: Globe,
    iconColor: "text-rose-200",
    tagBg: "bg-rose-500/25 text-rose-100",
    stripe: "rgba(244,63,94,0.10)",
  },
  {
    // Amber orange — engineering/hardware
    bg: "from-[#1c0f00] via-[#92400e] to-[#f59e0b]",
    accent: "bg-amber-300/20",
    accentB: "bg-orange-200/12",
    dot: "bg-white/10",
    icon: Cpu,
    iconColor: "text-amber-200",
    tagBg: "bg-amber-500/25 text-amber-100",
    stripe: "rgba(245,158,11,0.10)",
  },
  {
    // Indigo — security/infra
    bg: "from-[#0f0c29] via-[#302b63] to-[#4f46e5]",
    accent: "bg-indigo-300/20",
    accentB: "bg-purple-200/15",
    dot: "bg-white/10",
    icon: Lock,
    iconColor: "text-indigo-200",
    tagBg: "bg-indigo-500/25 text-indigo-100",
    stripe: "rgba(99,102,241,0.12)",
  },
];

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface LearningArtworkProps {
  title: string;
  subtitle?: string | null;
  badge?: string;
  className?: string;
  compact?: boolean;
  icon?: ElementType;
}

export function LearningArtwork({
  title,
  subtitle,
  badge = "Курс",
  className,
  compact = false,
  icon: IconOverride,
}: LearningArtworkProps) {
  const seed = hashSeed(title);
  const theme = THEMES[seed % THEMES.length];
  const ThemeIcon = IconOverride ?? theme.icon;

  if (compact) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div className={cn("absolute inset-0 bg-gradient-to-br", theme.bg)} />
        {/* Subtle diagonal stripes */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${theme.stripe} 0px, ${theme.stripe} 1px, transparent 1px, transparent 12px)`,
          }}
        />
        <div className={cn("absolute rounded-full blur-2xl", theme.accent, "right-[-12px] top-[-10px] h-16 w-16")} />
        <div className={cn("absolute rounded-full blur-2xl", theme.accentB, "bottom-[-10px] left-[-8px] h-12 w-12")} />
        {/* Icon center */}
        <div className="relative flex h-full w-full items-center justify-center">
          <ThemeIcon size={20} className={cn("opacity-80", theme.iconColor)} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br", theme.bg)} />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Diagonal accent stripes */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${theme.stripe} 0px, ${theme.stripe} 1px, transparent 1px, transparent 20px)`,
        }}
      />
      {/* Glow blobs */}
      <div className={cn("absolute rounded-full blur-3xl", theme.accent, "right-[-30px] top-[-20px] h-40 w-40")} />
      <div className={cn("absolute rounded-full blur-3xl", theme.accentB, "bottom-[-24px] left-[-18px] h-32 w-32")} />
      {/* Decorative dots */}
      <div className={cn("absolute rounded-full", theme.dot, "left-5 top-5 h-10 w-10")} />
      <div className={cn("absolute rounded-full", theme.dot, "right-12 top-8 h-3 w-3")} />
      <div className={cn("absolute rounded-full", theme.dot, "right-6 bottom-8 h-5 w-5 opacity-50")} />

      {/* Content */}
      <div className="relative flex h-full w-full flex-col justify-between p-5 text-white">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm", theme.tagBg)}>
            <Zap size={9} />
            {badge}
          </span>
          <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-sm">
            <ThemeIcon size={17} className={cn(theme.iconColor)} />
          </div>
        </div>

        {/* Bottom text */}
        <div className="max-w-[88%]">
          <p className="line-clamp-2 text-[18px] font-black leading-snug tracking-tight text-white drop-shadow-sm">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 line-clamp-1 text-[11px] font-medium text-white/65">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
