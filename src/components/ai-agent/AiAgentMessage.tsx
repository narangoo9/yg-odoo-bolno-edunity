"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentAction } from "@/lib/agent/agent-types";
import { AiAgentActionButton } from "./AiAgentActionButton";

// ── Streaming text ────────────────────────────────────────────────────────────

function StreamingText({ text, isNew }: { text: string; isNew: boolean }) {
  const shouldReduce = useReducedMotion();
  const [displayed, setDisplayed] = useState(isNew && !shouldReduce ? "" : text);

  useEffect(() => {
    if (!isNew || shouldReduce) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    setDisplayed("");
    const id = window.setInterval(() => {
      i += 2;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text, isNew, shouldReduce]);

  return <span className="whitespace-pre-wrap">{displayed}</span>;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function RobotAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/ai_agent_icon.png"
        alt=""
        width={size + 8}
        height={size + 8}
        className="scale-125 object-contain"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  actions?: AgentAction[];
  suggestions?: string[];
  toolChips?: Array<{ id: string; title: string; detail?: string }>;
}

interface Props {
  message: ChatMessage;
  isLatest: boolean;
  onNavigate?: () => void;
  onMessage?: (prompt: string) => void;
  disabled?: boolean;
}

export function AiAgentMessage({ message, isLatest, onNavigate, onMessage, disabled }: Props) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex gap-2", isAssistant ? "flex-row" : "flex-row-reverse")}>
      {isAssistant && <RobotAvatar size={28} />}

      <div className={cn("flex flex-col gap-2", isAssistant ? "items-start" : "items-end", "max-w-[84%]")}>
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-[12px] leading-relaxed",
            isAssistant
              ? "rounded-tl-sm bg-muted/60 text-foreground dark:bg-white/5"
              : "rounded-tr-sm bg-violet-600 text-white",
          )}
        >
          {isAssistant ? (
            <StreamingText text={message.content} isNew={isLatest} />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>

        {isAssistant && message.toolChips && message.toolChips.length > 0 && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-1"
          >
            {message.toolChips.map((chip) => (
              <span
                key={chip.id}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                title={chip.detail}
              >
                {chip.title}
              </span>
            ))}
          </motion.div>
        )}

        {/* Action buttons (assistant only) */}
        {isAssistant && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.actions.map((action, i) => (
              <AiAgentActionButton
                key={i}
                action={action}
                onNavigate={onNavigate}
                onMessage={onMessage}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
