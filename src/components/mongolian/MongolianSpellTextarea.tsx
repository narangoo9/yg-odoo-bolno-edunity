"use client";

import { useId } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, SpellCheck } from "lucide-react";
import { useMongolianSpellcheck } from "@/hooks/use-mongolian-spellcheck";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Block is visual only; parent should call checkNow on submit */
  showApplyHint?: boolean;
  onApplyHint?: (hint: string) => void;
}

export function MongolianSpellTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
  className,
  label = "Монгол текст",
  showApplyHint = true,
  onApplyHint,
}: Props) {
  const id = useId();
  const { issues, loading, hasErrors, normalizedHint, checkNow } =
    useMongolianSpellcheck(value, {
      enabled: !disabled,
      minLength: 6,
    });

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-[12px] font-bold text-foreground">
            {label}
          </label>
          <Link
            href="https://spellcheck.mn/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:underline dark:text-violet-400"
          >
            <SpellCheck size={12} />
            spellcheck.mn
            <ExternalLink size={10} />
          </Link>
        </div>
      ) : null}

      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => void checkNow(value)}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        lang="mn"
        className={cn(
          "w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          hasErrors
            ? "border-amber-400 focus:ring-amber-200 dark:border-amber-600"
            : "border-border focus:ring-violet-200 dark:focus:ring-violet-800",
          className,
        )}
      />

      <div className="flex items-start gap-2 text-[11px]">
        {loading ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 size={12} className="animate-spin" /> Шалгаж байна…
          </span>
        ) : hasErrors ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
            <AlertCircle size={12} />
            {issues.length} алдаа / анхааруулга
          </span>
        ) : value.trim().length >= 6 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={12} /> Бичиг зөв
          </span>
        ) : (
          <span className="text-muted-foreground">Монгол эсвэл латинаар бичиж болно</span>
        )}
      </div>

      {(hasErrors || issues.some((i) => i.severity === "hint")) ? (
        <ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/80 p-2 dark:border-amber-800/40 dark:bg-amber-950/20">
          {issues.slice(0, 8).map((issue, index) => (
            <li key={`${issue.type}-${index}`} className="text-[11px] leading-snug text-amber-900 dark:text-amber-200">
              {issue.message}
              {issue.suggestion ? (
                <button
                  type="button"
                  className="ml-1 font-bold text-violet-700 underline dark:text-violet-300"
                  onClick={() => {
                    if (!issue.word || !issue.suggestion) return;
                    onChange(value.replace(issue.word, issue.suggestion));
                  }}
                >
                  → {issue.suggestion}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {showApplyHint && normalizedHint && issues.length > 0 ? (
        <button
          type="button"
          onClick={() => (onApplyHint ? onApplyHint(normalizedHint) : onChange(normalizedHint))}
          className="text-[11px] font-bold text-violet-600 hover:underline dark:text-violet-400"
        >
          Санал болгосон кирилл хувилбарыг ашиглах
        </button>
      ) : null}
    </div>
  );
}

/** Returns false if Mongolian validation fails (for submit handlers). */
export async function assertMongolianSpellOk(text: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch("/api/v1/spellcheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, requireCyrillic: false, allowLatinTransliteration: true }),
  });
  const json = (await res.json()) as {
    data?: { ok: boolean; issues: Array<{ message: string; severity?: "hint" | "error" }> };
  };
  const blocking = (json.data?.issues ?? []).filter((i) => i.severity !== "hint");
  if (!json.data?.ok && blocking.length > 0) {
    return {
      ok: false,
      message: blocking.slice(0, 3).map((i) => i.message).join(" "),
    };
  }
  return { ok: true };
}
