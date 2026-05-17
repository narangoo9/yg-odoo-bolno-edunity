"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { MascotImage } from "@/components/brand/MascotImage";
import { AIMessageBubble } from "@/components/ai/AIMessageBubble";
import { AIToolActionCard } from "@/components/ai/AIToolActionCard";
import { AiAgentActionButton } from "@/components/ai-agent/AiAgentActionButton";
import { AiAgentSuggestions } from "@/components/ai-agent/AiAgentSuggestions";
import type { AgentAction } from "@/lib/agent/agent-types";
import { streamGroqAgent } from "@/lib/ai/robo-agent-stream";
import { cn } from "@/lib/utils";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolChips?: Array<{ id: string; title: string; detail?: string }>;
  actions?: AgentAction[];
  suggestions?: string[];
};

export function toolLabel(name: string): string {
  const map: Record<string, string> = {
    create_study_plan: "✓ Төлөвлөгөө үүсгэсэн",
    create_todo: "✓ Todo нэмэгдсэн",
    create_note: "✓ Тэмдэглэл хадгалагдсан",
    update_learning_profile: "✓ Профайл шинэчлэгдсэн",
    recommend_lessons: "✓ Хичээл санал болгосон",
    summarize_lesson: "✓ Хичээл тайлбарласан",
    generate_daily_tasks: "✓ Өдрийн даалгавар үүсгэсэн",
  };
  return map[name] ?? `✓ ${name}`;
}

export function toolDetail(name: string, output: unknown): string | undefined {
  try {
    const o = output as Record<string, unknown>;
    if (name === "create_study_plan" && o?.todosCreated != null) {
      return `Todo: ${String(o.todosCreated)} · Plan: ${String(o.studyPlanId ?? "")}`;
    }
    if (name === "create_todo" && o?.todoId) return String(o.todoId);
    if (name === "create_note" && o?.noteId) return String(o.noteId);
    if (name === "recommend_lessons" && Array.isArray(o?.items)) return `${o.items.length} хичээл`;
    if (name === "generate_daily_tasks" && o?.count != null) return `${String(o.count)} todo`;
    return JSON.stringify(output).slice(0, 160);
  } catch {
    return undefined;
  }
}

export function agentHttpErrorMn(status: number, serverError?: string): string {
  if (status === 401) {
    return "Нэвтрэх шаардлагатай. Дахин нэвтэрнэ үү.";
  }
  if (status === 429) {
    return "Хэт олон хүсэлт илгээлээ. Хэсэг хугацааны дараа дахин оролдоно уу.";
  }
  if (status === 503 && serverError?.includes("GROQ_API_KEY")) {
    return "Сервер дээр GROQ_API_KEY тохируулаагүй байна. `blue_work/.env` эсвэл `.env.local` файлд түлхүүрээ нэмээд `npm run dev`-ийг бүрэн дахин асаана уу.";
  }
  if (status === 400) {
    return serverError ? `Хүсэлт буруу: ${serverError}` : "Хүсэлт буруу байна.";
  }
  if (serverError) {
    return `Серверийн алдаа (${status}): ${serverError}`;
  }
  return `Серверийн алдаа (${status}). Сүлжээ, Groq түлхүүр, эсвэл өгөгдлийн сангийн холболтоо шалгана уу.`;
}

export function AIAgentChat({
  firstName,
  level,
  xp,
  streak,
  currentPage,
  currentCourseId,
  currentLessonId,
}: {
  firstName: string;
  level: number;
  xp: number;
  streak: number;
  currentPage?: string;
  currentCourseId?: string;
  currentLessonId?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [streamingText, setStreamingText] = useState("");
  const [liveTools, setLiveTools] = useState<Array<{ id: string; title: string; detail?: string }>>([]);
  const [liveActions, setLiveActions] = useState<AgentAction[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const userTurn: ChatTurn = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((m) => [...m, userTurn]);
    setInput("");
    setStreamingText("");
    setLiveTools([]);
    setLiveActions([]);
    setLiveSuggestions([]);

    startTransition(async () => {
      try {
        const result = await streamGroqAgent({
          message: trimmed,
          conversationId,
          currentPage,
          currentCourseId,
          currentLessonId,
          onConversationId: setConversationId,
          onText: (t) => {
            setStreamingText(t);
            scrollDown();
          },
          onTool: (chip) => {
            setLiveTools((prev) => [...prev, chip]);
            scrollDown();
          },
          onUi: ({ actions, suggestions }) => {
            setLiveActions(actions);
            setLiveSuggestions(suggestions);
            scrollDown();
          },
        });

        if (result.ok && result.assistantMessage) {
          const msg = result.assistantMessage;
          setMessages((m) => [
            ...m,
            {
              id: msg.id,
              role: "assistant",
              content: msg.content,
              toolChips: msg.toolChips,
              actions: msg.actions,
              suggestions: msg.suggestions,
            },
          ]);
          router.refresh();
        } else if (result.errorContent) {
          setMessages((m) => [
            ...m,
            { id: crypto.randomUUID(), role: "assistant", content: result.errorContent ?? "" },
          ]);
        }
      } catch {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: "Сүлжээний алдаа. Дахин оролдоно уу." },
        ]);
      } finally {
        setStreamingText("");
        setLiveTools([]);
        setLiveActions([]);
        setLiveSuggestions([]);
        scrollDown();
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{ minHeight: 520, maxHeight: "min(720px, 80vh)" }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3 dark:from-violet-900/15 dark:to-purple-900/10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
          </div>
          <div>
            <p className="text-[13px] font-black text-foreground">EduNity AI Agent</p>
            <p className="text-[10px] text-muted-foreground">
              Groq · Lv.{level} · {xp} XP · 🔥{streak}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setConversationId(null);
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw size={11} />
          Шинэ чат
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !streamingText ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
            <MascotImage variant="thinking" size={72} className="animate-float" />
            <div>
              <p className="text-[14px] font-bold text-foreground">Сайн уу, {firstName}!</p>
              <p className="mx-auto mt-1 max-w-sm text-[12px] text-muted-foreground">
                Би төлөвлөгөө, todo, тэмдэглэл, хичээлийн саналуудыг <b>бодитоор үүсгэж</b> өгнө. Жишээ нь: «Би React
                сурмаар байна, өдөрт 2 цаг завтай».
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Би frontend сурмаар байна. Өдөрт 2 цаг завтай. Хаанаас эхлэх вэ?",
                "Өнөөдөр юу хийх вэ?",
                "Надад 7 хоногийн сурах төлөвлөгөө гарга",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isPending}
                  onClick={() => send(q)}
                  className="max-w-[280px] rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-left text-[10px] font-semibold text-violet-800 transition-colors hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800/40 dark:bg-violet-500/10 dark:text-violet-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                <AIMessageBubble role={m.role} content={m.content} />
                {m.role === "assistant" && m.toolChips?.length ? (
                  <div className="flex flex-col gap-1.5 pl-0 sm:pl-9">
                    {m.toolChips.map((c) => (
                      <AIToolActionCard key={c.id} title={c.title} detail={c.detail} />
                    ))}
                  </div>
                ) : null}
                {m.role === "assistant" && m.actions?.length ? (
                  <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-9">
                    {m.actions.map((action, i) => (
                      <AiAgentActionButton key={`${m.id}-a-${i}`} action={action} onMessage={send} />
                    ))}
                  </div>
                ) : null}
                {m.role === "assistant" && m.suggestions?.length ? (
                  <div className="pl-0 sm:pl-9">
                    <AiAgentSuggestions chips={m.suggestions} onSelect={send} />
                  </div>
                ) : null}
              </div>
            ))}
            {(streamingText || liveTools.length > 0 || liveActions.length > 0) && (
              <div className="space-y-2">
                {liveTools.length > 0 && (
                  <div className="flex flex-col gap-1.5 sm:pl-9">
                    {liveTools.map((c) => (
                      <AIToolActionCard key={c.id} title={c.title} detail={c.detail} variant="muted" />
                    ))}
                  </div>
                )}
                {streamingText ? <AIMessageBubble role="assistant" content={streamingText} /> : null}
                {liveActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-9">
                    {liveActions.map((action, i) => (
                      <AiAgentActionButton key={`live-a-${i}`} action={action} onMessage={send} />
                    ))}
                  </div>
                )}
                {liveSuggestions.length > 0 && (
                  <div className="pl-0 sm:pl-9">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Дараагийн асуулт</p>
                    <AiAgentSuggestions chips={liveSuggestions} onSelect={send} />
                  </div>
                )}
                {isPending && !streamingText ? (
                  <div className="flex items-center gap-2 pl-9 text-[11px] text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    Бодож байна…
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            disabled={isPending}
            placeholder="Зорилгоо бичнэ үү (жишээ нь React 30 хоног)…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-violet-400 focus:bg-white disabled:opacity-50 dark:focus:bg-violet-950/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-colors",
              input.trim() && !isPending ? "bg-violet-600 hover:bg-violet-500" : "cursor-not-allowed bg-violet-400/50",
            )}
            aria-label="Илгээх"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">Enter — илгээх · Shift+Enter — шинэ мөр</p>
      </form>
    </div>
  );
}
