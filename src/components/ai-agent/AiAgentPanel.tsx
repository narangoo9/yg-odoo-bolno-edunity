"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckSquare,
  Flame,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentAction } from "@/lib/agent/agent-types";
import { AiAgentMessage, type ChatMessage } from "./AiAgentMessage";
import { AiAgentSuggestions } from "./AiAgentSuggestions";
import { AiAgentActionButton } from "./AiAgentActionButton";

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "Course санал болго",
    Icon: BookOpen,
    color: "text-violet-600 dark:text-violet-400",
    prompt: "Миний progress дээр үндэслээд надад тохирох course санал болго.",
  },
  {
    label: "7 хоногийн план",
    Icon: CalendarDays,
    color: "text-blue-500 dark:text-blue-400",
    prompt: "7 хоногийн study plan гарга.",
  },
  {
    label: "Өнөөдөр юу хийх вэ?",
    Icon: Target,
    color: "text-fuchsia-500 dark:text-fuchsia-400",
    prompt: "Өнөөдөр EduNity дээр юу сурах ёстойг миний progress дээр үндэслээд хэл.",
  },
  {
    label: "Certificate авах алхам",
    Icon: Award,
    color: "text-amber-500 dark:text-amber-400",
    prompt: "Certificate авахад юу дутуу вэ?",
  },
  {
    label: "Task хийхэд туслаач",
    Icon: CheckSquare,
    color: "text-emerald-500 dark:text-emerald-400",
    prompt: "Final task хийхэд туслаач.",
  },
  {
    label: "Streak хадгалах план",
    Icon: Flame,
    color: "text-orange-500 dark:text-orange-400",
    prompt: "Миний streak таслахгүй байхад зориулсан богино план гарга.",
  },
] as const;

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1 py-0.5" role="status" aria-label="AI бичиж байна">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-violet-400 motion-safe:animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  firstName: string;
  level: number;
  xp: number;
  streak: number;
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  showQuickActions: boolean;
  pageContext: string;
  latestAssistantId: string | null;
  onClose: () => void;
  onSend: () => void;
  onInputChange: (v: string) => void;
  onQuickAction: (prompt: string) => void;
  onMessage: (prompt: string) => void;
  onClearChat: () => void;
  onRestoreChat: () => void;
  onToggleQuickActions: () => void;
  streamingText?: string;
  liveToolChips?: Array<{ id: string; title: string; detail?: string }>;
  liveActions?: AgentAction[];
  liveSuggestions?: string[];
  scrollNonce?: number;
}

export function AiAgentPanel({
  firstName,
  level,
  xp,
  streak,
  messages,
  loading,
  input,
  showQuickActions,
  pageContext,
  latestAssistantId,
  onClose,
  onSend,
  onInputChange,
  onQuickAction,
  onMessage,
  onClearChat,
  onRestoreChat,
  onToggleQuickActions,
  streamingText = "",
  liveToolChips = [],
  liveActions = [],
  liveSuggestions = [],
  scrollNonce = 0,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0 || !!streamingText;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const run = () => {
      el.scrollTop = el.scrollHeight;
    };
    run();
    requestAnimationFrame(run);
  }, [scrollNonce, messages.length, loading, streamingText, liveToolChips.length, liveActions.length, liveSuggestions.length]);

  // Suggestions from the last assistant message
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions =
    !loading && lastAssistant?.suggestions?.length
      ? lastAssistant.suggestions
      : !loading && liveSuggestions.length > 0
        ? liveSuggestions
        : [];

  const chipSuggestions =
    loading && liveSuggestions.length > 0 ? liveSuggestions : suggestions;

  function greetingSuggestion() {
    if (pageContext.includes("catalog")) return "Catalog дээрх хичээлүүдийг шүүж хамгийн тохирсонг нь эхлүүл!";
    if (pageContext.includes("courses")) return "Хичээлийг үргэлжлүүлэн streak-ээ хадгалаарай!";
    if (pageContext.includes("leaderboard")) return "XP нэмэгдүүлж leaderboard дээр дээшил!";
    return "Өнөөдөр нэг хичээл дуусгаад streak-ээ хадгалаарай!";
  }

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-violet-100/80 bg-white px-4 py-3 dark:border-violet-900/30 dark:bg-[#0f0c1f]">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Image
            src="/brand/ai_agent_icon.png"
            alt="Robo Mentor"
            width={46}
            height={46}
            className="scale-125 object-contain"
            priority
          />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400 dark:border-[#0f0c1f]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black leading-tight text-foreground">AI Agent</p>
          <p className="text-[11px] text-muted-foreground">Groq · төлөвлөгөө, todo, санал ✨</p>
        </div>
        <motion.div className="flex shrink-0 items-center gap-0.5">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={onRestoreChat}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Сүүлийн чатыг сэргээх"
                aria-label="Сүүлийн чатыг сэргээх"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={onClearChat}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Чат цэвэрлэх"
                aria-label="Чат цэвэрлэх"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Хаах"
          >
            <X size={15} />
          </button>
        </motion.div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {/* Welcome cards (no messages) */}
        {!hasMessages && (
          <>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5 dark:border-violet-800/30 dark:bg-violet-900/10">
              <p
                className="text-[14px] font-black"
                style={{
                  background: "linear-gradient(90deg,#7c3aed,#ec4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Сайн уу, {firstName}! 👋
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Тохирох хичээл, progress, certificate болон study plan-д тусална.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3.5 dark:border-violet-800/30 dark:bg-violet-900/10">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600">
                  <Calendar size={14} className="text-white" />
                </div>
                <span className="text-[12px] font-black text-foreground">Өнөөдрийн санал</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {greetingSuggestion()}
              </p>
              <Link
                href="/student/courses"
                onClick={onClose}
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-violet-600 py-2 text-[12px] font-black text-white shadow-md shadow-violet-500/20 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Үргэлжлүүлэх →
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 dark:border-orange-800/30 dark:bg-orange-900/10">
                <div className="mb-1 flex items-center gap-1.5">
                  <Flame size={14} className="shrink-0 fill-orange-500 text-orange-500" />
                  <span className="text-[11px] font-black text-foreground">Streak</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {streak > 0
                    ? `Өнөөдөр 1 хичээл үзвэл ${streak + 1} өдрийн streak болно 🔥`
                    : "Өнөөдөр 1 хичээл үзвэл streak эхэлнэ 🔥"}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <BarChart3 size={11} className="text-violet-500" />
                  <span className="text-[11px] font-black text-foreground">Статистик</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { icon: <Zap size={10} className="fill-violet-500 text-violet-500" />, value: xp.toLocaleString(), label: "XP" },
                    { icon: <BarChart3 size={10} className="text-violet-500" />, value: `Lv.${level}`, label: "Түвшин" },
                    { icon: <Flame size={10} className="fill-orange-500 text-orange-500" />, value: streak, label: "Streak" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-muted/40 p-1.5 text-center dark:bg-white/5">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">{s.icon}<span className="text-[10px] font-black text-foreground">{s.value}</span></div>
                      <p className="text-[9px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <AiAgentMessage
            key={msg.id}
            message={msg}
            isLatest={msg.id === latestAssistantId}
            onNavigate={onClose}
            onMessage={onMessage}
            disabled={loading}
          />
        ))}

        {loading && streamingText && (
          <motion.div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Image src="/brand/ai_agent_icon.png" alt="" width={34} height={34} className="scale-125 object-contain" />
            </div>
            <div className="max-w-[84%] rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-[12px] leading-relaxed text-foreground dark:bg-white/5">
              <span className="whitespace-pre-wrap">{streamingText}</span>
              {liveToolChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {liveToolChips.map((chip) => (
                    <span
                      key={chip.id}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                      {chip.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {loading && !streamingText && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Image src="/brand/ai_agent_icon.png" alt="" width={34} height={34} className="scale-125 object-contain" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2.5 dark:bg-white/5">
              <TypingDots />
            </div>
          </div>
        )}

        {loading && liveActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-9">
            {liveActions.map((action, i) => (
              <AiAgentActionButton
                key={`act-${action.label}-${i}`}
                action={action}
                onNavigate={onClose}
                onMessage={onMessage}
              />
            ))}
          </div>
        )}

        {chipSuggestions.length > 0 && (
          <div className="pl-0 sm:pl-9">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Дараагийн асуулт
            </p>
            <AiAgentSuggestions chips={chipSuggestions} onSelect={onMessage} disabled={loading} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions grid */}
      {showQuickActions && (
        <div className="shrink-0 border-t border-border/40 bg-muted/20 p-3 dark:bg-white/[0.02]">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Түргэн үйлдлүүд
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.Icon;
              return (
                <button
                  key={a.label}
                  onClick={() => onQuickAction(a.prompt)}
                  disabled={loading}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-2 text-left text-[11px] font-medium text-foreground transition-colors hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:hover:border-violet-700 dark:hover:bg-violet-900/20"
                >
                  <Icon size={13} className={cn("shrink-0", a.color)} />
                  <span className="line-clamp-1">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Show quick actions toggle */}
      {hasMessages && !showQuickActions && (
        <div className="shrink-0 border-t border-border/40 px-4 py-1.5">
          <button
            onClick={onToggleQuickActions}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Sparkles size={11} />
            Түргэн үйлдлүүд харах
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-border/40 p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2 transition-colors focus-within:border-violet-400 dark:bg-white/5 dark:focus-within:border-violet-600">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Асуултаа бичнэ үү…"
            disabled={loading}
            aria-label="AI Agent-т мессеж илгээх"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || loading}
            aria-label="Мессеж илгээх"
            className="flex h-8 w-8 cursor-pointer shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
        {messages.length > 0 && (
          <div className="mt-1.5 flex justify-center gap-4">
            <button
              type="button"
              onClick={onRestoreChat}
              className="cursor-pointer text-[10px] text-muted-foreground transition-colors hover:text-violet-600 focus-visible:outline-none focus-visible:underline"
            >
              Сэргээх
            </button>
            <button
              type="button"
              onClick={onClearChat}
              className="cursor-pointer text-[10px] text-muted-foreground transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:underline"
            >
              Цэвэрлэх
            </button>
          </div>
        )}
      </div>
    </>
  );
}
