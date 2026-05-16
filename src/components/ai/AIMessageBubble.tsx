"use client";

import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";

export function AIMessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  return (
    <div className={cn("flex gap-2.5", role === "user" ? "justify-end" : "justify-start")}>
      {role === "assistant" && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          role === "user"
            ? "rounded-tr-sm bg-violet-600 text-white"
            : "rounded-tl-sm border border-border bg-muted dark:bg-white/5 text-foreground",
        )}
      >
        {content}
      </div>
      {role === "user" && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
          <User size={13} className="text-slate-600 dark:text-slate-300" />
        </div>
      )}
    </div>
  );
}
