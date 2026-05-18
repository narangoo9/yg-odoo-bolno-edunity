"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Hash, Loader2, MessageCircle, Send, Smile, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLessonSocket } from "@/lib/socket";
import { cn, getInitials } from "@/lib/utils";

type ChatUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type LessonChatMessage = {
  id: string;
  lessonId: string;
  userId: string;
  text: string;
  createdAt: string | Date;
  user?: ChatUser;
};

type HistoryPayload = {
  lessonId: string;
  onlineCount: number;
  messages: LessonChatMessage[];
};

type PresencePayload = {
  lessonId: string;
  onlineCount: number;
};

type TypingPayload = {
  lessonId: string;
  userId: string;
  name?: string;
};

type TokenResponse = {
  token?: string;
  error?: string;
};

type LessonChatProps = {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  currentUserId: string;
  className?: string;
};

function formatMessageTime(value: string | Date) {
  return new Intl.DateTimeFormat("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LessonChat({
  courseId,
  lessonId,
  lessonTitle,
  currentUserId,
  className,
}: LessonChatProps) {
  const [messages, setMessages] = useState<LessonChatMessage[]>([]);
  const [text, setText] = useState("");
  const [onlineCount, setOnlineCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStartSentRef = useRef(false);

  const typingLabel = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} бичиж байна`;
    return `${names.slice(0, 2).join(", ")} бичиж байна`;
  }, [typingUsers]);

  useEffect(() => {
    let cancelled = false;
    const socket = getLessonSocket();

    async function connect() {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch("/api/v1/socket-token", { cache: "no-store" });
        const body = (await response.json()) as TokenResponse;

        if (!response.ok || !body.token) {
          throw new Error(body.error ?? "Socket token авахад алдаа гарлаа");
        }

        if (cancelled) return;

        socket.auth = { token: body.token };
        if (!socket.connected) socket.connect();

        socket.emit("lesson:join", { lessonId, courseId });
      } catch (connectError) {
        if (cancelled) return;
        setStatus("error");
        setError(connectError instanceof Error ? connectError.message : "Chat холбогдсонгүй");
      }
    }

    function handleHistory(payload: HistoryPayload) {
      if (payload.lessonId !== lessonId) return;
      setMessages(payload.messages);
      setOnlineCount(payload.onlineCount);
      setStatus("ready");
    }

    function handleNewMessage(message: LessonChatMessage) {
      if (message.lessonId !== lessonId) return;
      setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
    }

    function handlePresence(payload: PresencePayload) {
      if (payload.lessonId !== lessonId) return;
      setOnlineCount(payload.onlineCount);
    }

    function handleTypingStart(payload: TypingPayload) {
      if (payload.lessonId !== lessonId || payload.userId === currentUserId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.name ?? "Someone",
      }));
    }

    function handleTypingStop(payload: TypingPayload) {
      if (payload.lessonId !== lessonId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    }

    function handleMessageError(payload: { message?: string }) {
      setError(payload.message ?? "Chat action failed");
      setStatus((prev) => (prev === "loading" ? "error" : prev));
    }

    socket.on("message:history", handleHistory);
    socket.on("message:new", handleNewMessage);
    socket.on("user:online", handlePresence);
    socket.on("user:offline", handlePresence);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:error", handleMessageError);
    const handleConnectError = async (connectError: Error) => {
      const message = connectError.message.toLowerCase();
      if (message.includes("unauthorized") || message.includes("jwt")) {
        try {
          const response = await fetch("/api/v1/socket-token", { cache: "no-store" });
          const body = (await response.json()) as TokenResponse;
          if (response.ok && body.token) {
            socket.auth = { token: body.token };
            socket.connect();
            return;
          }
        } catch {
          /* fall through */
        }
      }
      setStatus("error");
      setError(connectError.message);
    };

    socket.on("connect_error", handleConnectError);

    connect();

    return () => {
      cancelled = true;
      socket.emit("lesson:leave", { lessonId });
      socket.off("message:history", handleHistory);
      socket.off("message:new", handleNewMessage);
      socket.off("user:online", handlePresence);
      socket.off("user:offline", handlePresence);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:error", handleMessageError);
      socket.off("connect_error", handleConnectError);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [courseId, currentUserId, lessonId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function emitTyping(value: string) {
    const socket = getLessonSocket();

    if (!socket.connected) return;
    if (value.trim() && !typingStartSentRef.current) {
      socket.emit("typing:start", { lessonId });
      typingStartSentRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { lessonId });
      typingStartSentRef.current = false;
    }, 900);
  }

  function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = text.trim();

    if (!trimmed || status !== "ready") return;

    const socket = getLessonSocket();
    socket.emit("message:send", {
      lessonId,
      courseId,
      text: trimmed,
    });
    socket.emit("typing:stop", { lessonId });
    setText("");
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-l border-violet-100 bg-[#111827] text-white shadow-[-10px_0_30px_rgba(15,23,42,0.12)] lg:w-[360px]",
        className,
      )}
    >
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-black">
              <Hash size={16} className="text-violet-300" />
              <span className="truncate">{lessonTitle}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
              <Users size={13} />
              <span>{onlineCount} online</span>
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
            <MessageCircle size={17} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {status === "loading" ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-300">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-violet-300" />
            Chat ачаалж байна
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
              <Hash size={22} />
            </div>
            <p className="text-sm font-bold text-white">Энэ lesson-д анхны message бичээрэй</p>
            <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-400">
              Нэг lesson үзэж байгаа хүмүүс энд realtime чатлана.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const mine = message.userId === currentUserId;
              const name = message.user?.name ?? (mine ? "You" : "Learner");

              return (
                <div key={message.id} className={cn("flex gap-2", mine && "justify-end")}>
                  {!mine ? (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-[11px] font-black text-slate-100">
                      {getInitials(name)}
                    </div>
                  ) : null}
                  <div className={cn("min-w-0 max-w-[82%]", mine && "text-right")}>
                    <div className={cn("mb-1 flex items-center gap-2 text-[11px] text-slate-400", mine && "justify-end")}>
                      <span className="truncate font-bold text-slate-200">{name}</span>
                      <span>{formatMessageTime(message.createdAt)}</span>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2 text-left text-sm leading-relaxed shadow-sm",
                        mine ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100",
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="h-5 text-xs text-violet-200">{typingLabel}</div>
        {error ? <div className="mb-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-100">{error}</div> : null}
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl bg-slate-800 px-3 ring-1 ring-white/10 focus-within:ring-violet-400">
            <Smile size={16} className="shrink-0 text-slate-400" />
            <textarea
              value={text}
              maxLength={2000}
              rows={1}
              disabled={status !== "ready"}
              onChange={(event) => {
                setText(event.target.value);
                emitTyping(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message бичих..."
              className="max-h-24 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={status !== "ready" || !text.trim()}
            className="h-10 w-10 shrink-0 rounded-xl bg-violet-600 text-white hover:bg-violet-500"
            aria-label="Send message"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </aside>
  );
}
