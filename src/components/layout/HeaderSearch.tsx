"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { BookOpen, Loader2, Search, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { searchResultsPath } from "@/lib/search-routes";
import type { SearchResultItem } from "@/app/api/v1/search/route";

interface Props {
  role: UserRole;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}

export function HeaderSearch({ role, placeholder, className, inputClassName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQuery = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery, pathname]);

  const navigateToResults = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const path = searchResultsPath(role, trimmed);
      setOpen(false);
      router.push(path);
    },
    [role, router],
  );

  const fetchResults = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}`);
      const json = (await res.json()) as { data?: { results: SearchResultItem[] } };
      setResults(json.data?.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void fetchResults(query);
    }, 280);
    return () => clearTimeout(timer);
  }, [query, open, fetchResults]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      setOpen(false);
      router.push(results[activeIndex].href);
      return;
    }
    navigateToResults(query);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full rounded-xl border border-violet-200/60 bg-[#f5f3ff] py-2 pl-9 pr-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground/80 focus:border-violet-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 dark:border-violet-800/30 dark:bg-violet-900/10 dark:focus:bg-violet-900/20",
            inputClassName,
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-violet-100 hover:text-foreground dark:hover:bg-violet-900/30"
            aria-label="Цэвэрлэх"
          >
            <X size={14} />
          </button>
        ) : null}
      </form>

      <AnimatePresence>
        {open && (query.trim().length >= 2 || loading) ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] overflow-hidden rounded-xl border border-violet-100 bg-white shadow-xl shadow-violet-200/40 dark:border-violet-800/40 dark:bg-[#13102a] dark:shadow-violet-900/30"
          >
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Хайж байна…
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Илэрц олдсонгүй</div>
            ) : (
              <ul className="max-h-[min(320px,50vh)] overflow-y-auto py-1">
                {results.map((item, index) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                        setActiveIndex(-1);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 transition-colors",
                        activeIndex === index
                          ? "bg-violet-50 dark:bg-violet-900/25"
                          : "hover:bg-violet-50/80 dark:hover:bg-violet-900/15",
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        ) : item.type === "user" ? (
                          <User size={16} className="text-violet-500" />
                        ) : (
                          <BookOpen size={16} className="text-violet-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-foreground">{item.title}</p>
                        {item.subtitle ? (
                          <p className="truncate text-[11px] text-muted-foreground">{item.subtitle}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                        {item.type === "user" ? "User" : "Курс"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {query.trim().length >= 2 ? (
              <button
                type="button"
                onClick={() => navigateToResults(query)}
                className="w-full border-t border-border px-4 py-2.5 text-left text-[12px] font-bold text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
              >
                «{query}» — бүх илэрцийг харах
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
