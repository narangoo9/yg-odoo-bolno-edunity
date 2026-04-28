import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "default" | "blue" | "green" | "amber" | "purple" | "violet" | "fuchsia";
  className?: string;
}

const colorMap = {
  default: { bg: "bg-muted", icon: "text-muted-foreground" },
  blue:    { bg: "bg-blue-100 dark:bg-blue-500/15",    icon: "text-blue-600 dark:text-blue-400" },
  green:   { bg: "bg-emerald-100 dark:bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400" },
  amber:   { bg: "bg-amber-100 dark:bg-amber-500/15",  icon: "text-amber-600 dark:text-amber-400" },
  purple:  { bg: "bg-violet-100 dark:bg-violet-500/15", icon: "text-violet-600 dark:text-violet-400" },
  violet:  { bg: "bg-violet-100 dark:bg-violet-500/15", icon: "text-violet-600 dark:text-violet-400" },
  fuchsia: { bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15", icon: "text-fuchsia-600 dark:text-fuchsia-400" },
};

export function StatsCard({ title, value, description, icon: Icon, trend, color = "default", className }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-5 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-violet-900/10 transition-shadow", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon size={17} className={c.icon} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
          <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
