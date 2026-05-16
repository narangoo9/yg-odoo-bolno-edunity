"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AiAgentButton } from "@/components/ai-agent/AiAgentButton";
import { AiAgentPanel } from "@/components/ai-agent/AiAgentPanel";
import type { ChatMessage } from "@/components/ai-agent/AiAgentMessage";
import {
  clearRoboAgentStorage,
  loadRoboConversationId,
  loadRoboMessages,
  saveRoboConversationId,
  saveRoboMessages,
} from "@/lib/ai/robo-agent-storage";
import type { AgentAction } from "@/lib/agent/agent-types";
import { streamGroqAgent, type ToolChip } from "@/lib/ai/robo-agent-stream";

function getCourseIdFromPath(pathname: string): string | undefined {
  const m = pathname.match(/\/courses\/([^/]+)/);
  return m?.[1];
}

function getLessonIdFromPath(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("lessonId") ?? undefined;
}

interface RoboAgentProps {
  firstName?: string;
  level?: number;
  xp?: number;
  streak?: number;
}

export function RoboAgent({
  firstName = "Student",
  level = 1,
  xp = 0,
  streak = 0,
}: RoboAgentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [liveToolChips, setLiveToolChips] = useState<ToolChip[]>([]);
  const [liveActions, setLiveActions] = useState<AgentAction[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [scrollNonce, setScrollNonce] = useState(0);

  const persistReady = useRef(false);
  const bumpScroll = useCallback(() => setScrollNonce((n) => n + 1), []);

  useEffect(() => {
    setMessages(loadRoboMessages());
    setConversationId(loadRoboConversationId());
    setHydrated(true);
    requestAnimationFrame(() => {
      persistReady.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !persistReady.current) return;
    saveRoboMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated || !persistReady.current) return;
    saveRoboConversationId(conversationId);
  }, [conversationId, hydrated]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(bumpScroll, 50);
    const t2 = window.setTimeout(bumpScroll, 200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [open, messages, loading, streamingText, liveToolChips, bumpScroll]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setStreamingText("");
      setLiveToolChips([]);
      setLiveActions([]);
      setLiveSuggestions([]);
      setShowQuickActions(false);
      setLatestAssistantId(null);
      bumpScroll();

      try {
        const result = await streamGroqAgent({
          message: trimmed,
          conversationId,
          currentPage: pathname,
          currentCourseId: getCourseIdFromPath(pathname),
          currentLessonId: getLessonIdFromPath(),
          onConversationId: (id) => setConversationId(id),
          onText: (assembled) => {
            setStreamingText(assembled);
            bumpScroll();
          },
          onTool: (chip) => {
            setLiveToolChips((prev) => [...prev, chip]);
            bumpScroll();
          },
          onUi: ({ actions, suggestions }) => {
            setLiveActions(actions);
            setLiveSuggestions(suggestions);
            bumpScroll();
          },
        });

        if (result.ok && result.assistantMessage) {
          const msg = result.assistantMessage;
          setLatestAssistantId(msg.id);
          setMessages((prev) => [...prev, msg]);
          router.refresh();
        } else if (result.errorContent) {
          const errId = crypto.randomUUID();
          setLatestAssistantId(errId);
          setMessages((prev) => [
            ...prev,
            {
              id: errId,
              role: "assistant",
              content: result.errorContent!,
              timestamp: Date.now(),
            },
          ]);
        }
      } catch {
        const errId = crypto.randomUUID();
        setLatestAssistantId(errId);
        setMessages((prev) => [
          ...prev,
          {
            id: errId,
            role: "assistant",
            content: "Сүлжээний алдаа. Дахин оролдоно уу.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
        setStreamingText("");
        setLiveToolChips([]);
        setLiveActions([]);
        setLiveSuggestions([]);
        bumpScroll();
      }
    },
    [loading, conversationId, pathname, router, bumpScroll],
  );

  const handleSend = () => sendMessage(input);
  const handleQuickAction = (prompt: string) => sendMessage(prompt);

  const restoreChat = useCallback(() => {
    const restored = loadRoboMessages();
    setMessages(restored);
    setConversationId(loadRoboConversationId());
    setLatestAssistantId(null);
    setShowQuickActions(restored.length === 0);
    setStreamingText("");
    setLiveToolChips([]);
    setLiveActions([]);
    setLiveSuggestions([]);
    bumpScroll();
  }, [bumpScroll]);

  const clearChat = useCallback(() => {
    clearRoboAgentStorage();
    setMessages([]);
    setConversationId(null);
    setLatestAssistantId(null);
    setShowQuickActions(true);
    setStreamingText("");
    setLiveToolChips([]);
    setLiveActions([]);
    setLiveSuggestions([]);
    bumpScroll();
  }, [bumpScroll]);

  const panelTransition = shouldReduce
    ? { duration: 0.15 }
    : { type: "spring" as const, damping: 28, stiffness: 340 };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: panelTransition }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.14, ease: "easeIn" } }}
            role="dialog"
            aria-modal="true"
            aria-label="EduNity AI Agent"
            className={cn(
              "fixed z-[9995] flex flex-col overflow-hidden",
              "border border-violet-200/80 bg-white dark:border-violet-800/40 dark:bg-[#0f0c1f]",
              "shadow-2xl shadow-violet-500/20 dark:shadow-violet-900/30",
              "bottom-[88px] right-5 w-[360px] max-h-[calc(100vh-112px)] rounded-3xl",
              "max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-h-[88vh] max-sm:rounded-t-3xl max-sm:rounded-b-none",
            )}
          >
            <motion.div className="flex justify-center pt-2.5 pb-0.5 sm:hidden" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
            </motion.div>

            <AiAgentPanel
              firstName={firstName.split(" ")[0]}
              level={level}
              xp={xp}
              streak={streak}
              messages={messages}
              loading={loading}
              input={input}
              showQuickActions={showQuickActions}
              pageContext={pathname}
              latestAssistantId={latestAssistantId}
              streamingText={streamingText}
              liveToolChips={liveToolChips}
              liveActions={liveActions}
              liveSuggestions={liveSuggestions}
              scrollNonce={scrollNonce}
              onClose={() => setOpen(false)}
              onSend={handleSend}
              onInputChange={setInput}
              onQuickAction={handleQuickAction}
              onMessage={sendMessage}
              onClearChat={clearChat}
              onRestoreChat={restoreChat}
              onToggleQuickActions={() => setShowQuickActions((v) => !v)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AiAgentButton open={open} onClick={() => setOpen((v) => !v)} />
    </>
  );
}
