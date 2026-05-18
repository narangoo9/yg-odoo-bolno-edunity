"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpellIssue } from "@/lib/mongolian/spellcheck";

interface Options {
  debounceMs?: number;
  minLength?: number;
  enabled?: boolean;
}

export function useMongolianSpellcheck(text: string, options: Options = {}) {
  const { debounceMs = 600, minLength = 8, enabled = true } = options;
  const [issues, setIssues] = useState<SpellIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [cyrillicRatio, setCyrillicRatio] = useState(1);
  const [normalizedHint, setNormalizedHint] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNow = useCallback(async (value: string) => {
    if (!enabled || value.trim().length < minLength) {
      setIssues([]);
      setCyrillicRatio(1);
      setNormalizedHint(undefined);
      return { ok: true, issues: [] as SpellIssue[] };
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/spellcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          requireCyrillic: false,
          allowLatinTransliteration: true,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          ok: boolean;
          issues: SpellIssue[];
          cyrillicRatio: number;
          normalizedHint?: string;
        };
      };
      if (!res.ok || !json.data) {
        setIssues([]);
        return { ok: true, issues: [] as SpellIssue[] };
      }
      setIssues(json.data.issues);
      setCyrillicRatio(json.data.cyrillicRatio);
      setNormalizedHint(json.data.normalizedHint);
      return { ok: json.data.ok, issues: json.data.issues };
    } catch {
      setIssues([]);
      return { ok: true, issues: [] as SpellIssue[] };
    } finally {
      setLoading(false);
    }
  }, [enabled, minLength]);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void checkNow(text);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, debounceMs, enabled, checkNow]);

  const blockingIssues = issues.filter((i) => i.severity !== "hint");

  return {
    issues,
    blockingIssues,
    loading,
    cyrillicRatio,
    normalizedHint,
    hasErrors: blockingIssues.length > 0,
    checkNow,
  };
}
