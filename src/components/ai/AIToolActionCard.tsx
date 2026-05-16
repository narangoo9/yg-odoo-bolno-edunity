"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIToolActionCard({
  title,
  detail,
  variant = "success",
}: {
  title: string;
  detail?: string;
  variant?: "success" | "muted";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-2.5 py-2 text-[11px]",
        variant === "success"
          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-100"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0">
        <p className="font-bold leading-tight">{title}</p>
        {detail ? <p className="mt-0.5 text-[10px] leading-snug opacity-90">{detail}</p> : null}
      </div>
    </div>
  );
}
