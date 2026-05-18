"use client";

import { Sparkles, X } from "lucide-react";
import { useXpToastStore } from "@/stores/xp-toast-store";

export function XpToastHost() {
  const toasts = useXpToastStore((s) => s.toasts);
  const dismiss = useXpToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[300] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-xl border border-violet-200/80 bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4 fade-in dark:border-violet-800/50"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">+{toast.amount} XP</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{toast.reason}</p>
              {toast.leveledUp && toast.level ? (
                <p className="mt-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  Level {toast.level} боллоо!
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Хаах"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
