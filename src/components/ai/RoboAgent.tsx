"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Flame, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoboAgentProps {
  firstName?: string;
}

export function RoboAgent({ firstName = "Student" }: RoboAgentProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleSend = () => {
    if (!input.trim()) return;
    setInput("");
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="AI Mentor"
          className="fixed bottom-[92px] right-5 z-[9999] w-[340px] max-w-[calc(100vw-32px)] animate-slide-up rounded-3xl border border-violet-200 bg-white shadow-2xl shadow-violet-500/20 dark:border-violet-800/50 dark:bg-[#13102a]"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600">
              <Image
                src="/brand/ai_agent_icon.png"
                alt=""
                width={46}
                height={46}
                className="scale-125 object-contain"
                priority
              />
            </div>
            <p className="min-w-0 flex-1 text-[15px] font-black text-foreground">AI Mentor</p>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close AI Mentor"
            >
              <X size={15} />
            </button>
          </div>

          <div className="max-h-[min(620px,calc(100vh-132px))] space-y-3 overflow-y-auto p-4">
            <div className="rounded-2xl border border-violet-100 bg-white p-3.5 dark:border-violet-800/30 dark:bg-violet-900/10">
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
                Би чамд сурах аялалд туслах AI туслах байна.
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
                Python хичээлийн дараагийн сэдвийг үзэхэд тохиромжтой!
              </p>
              <Link
                href="/student/courses"
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-violet-600 py-2 text-[12px] font-black text-white shadow-md shadow-violet-500/20 transition-colors hover:bg-violet-500"
                onClick={() => setOpen(false)}
              >
                Үргэлжлүүлэх →
              </Link>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-orange-100 bg-orange-50/70 p-3 dark:border-orange-800/30 dark:bg-orange-900/10">
              <Flame size={16} className="mt-0.5 shrink-0 fill-orange-500 text-orange-500" />
              <div>
                <p className="text-[12px] font-black text-foreground">Streak-ийг хадгал!</p>
                <p className="text-[11px] text-muted-foreground">Өнөөдөр хичээл үзээрэй.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/15">
                    <Calendar size={14} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[12px] font-black text-foreground">Өнөөдрийн зорилго</span>
                </div>
                <span className="text-[11px] text-muted-foreground">0/1</span>
              </div>
              <p className="mb-2 text-[11px] text-muted-foreground">1 хичээл дуусгах</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-400" />
              </div>
            </div>

            <div>
              <p className="mb-2 text-center text-[11px] italic text-muted-foreground">
                Асуулт байна уу? Намаас асуугаарай! 🤖
              </p>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSend();
                  }}
                  placeholder="Асуултаа бичнэ үү..."
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                  aria-label="Send AI Mentor message"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-[9px] right-7 h-0 w-0 border-l-[9px] border-r-[9px] border-t-[10px] border-l-transparent border-r-transparent border-t-white dark:border-t-[#13102a]" />
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "fixed bottom-5 right-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full",
          "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500 shadow-xl shadow-violet-500/30",
          "transition-all hover:scale-105 active:scale-95",
        )}
        aria-label="Open AI Mentor"
        aria-expanded={open}
        title="AI Mentor"
      >
        <Image
          src="/brand/ai_agent_icon.png"
          alt=""
          width={60}
          height={60}
          className="scale-110 object-contain drop-shadow-sm"
          priority
        />
        <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-white bg-red-500 dark:border-[#09090b]" />
      </button>
    </>
  );
}
