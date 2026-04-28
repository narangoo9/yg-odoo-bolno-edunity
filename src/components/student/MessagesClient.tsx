"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Hash, Send, Search, Users, Smile, Image as ImageIcon,
  Plus, MoreVertical, X, ChevronRight, BookOpen,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { getInitials, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { postCourseMessage } from "@/modules/comments/application/actions";
import { MascotImage } from "@/components/brand/MascotImage";

// ── STICKER DATA ───────────────────────────────────────────────────────────────
const STICKER_PREFIX = "__sticker__";

const ROBO_STICKERS = [
  { key: "hi",        label: "Сайн уу!",             src: "/assets/stickers/robo/robo-hi.png" },
  { key: "goodjob",   label: "Гайхалтай!",           src: "/assets/stickers/robo/robo-goodjob.png" },
  { key: "streak",    label: "Streak үргэлжиллээ!",  src: "/assets/stickers/robo/robo-streak.png" },
  { key: "thinking",  label: "Бодлоо...",            src: "/assets/stickers/robo/robo-thinking.png" },
  { key: "xp",        label: "+XP авлаа!",           src: "/assets/stickers/robo/robo-xp.png" },
  { key: "heart",     label: "Баярлалаа!",           src: "/assets/stickers/robo/robo-heart.png" },
  { key: "confused",  label: "Ойлгосонгүй...",       src: "/assets/stickers/robo/robo-confused.png" },
  { key: "certified", label: "Сертификат!",          src: "/assets/stickers/robo/robo-certified.png" },
] as const;

const REACTION_STICKERS = [
  { key: "goodjob",  src: "/assets/stickers/robo/robo-goodjob.png" },
  { key: "heart",    src: "/assets/stickers/robo/robo-heart.png" },
  { key: "streak",   src: "/assets/stickers/robo/robo-streak.png" },
  { key: "thinking", src: "/assets/stickers/robo/robo-thinking.png" },
  { key: "xp",       src: "/assets/stickers/robo/robo-xp.png" },
] as const;

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface User { id: string; name: string; avatarUrl: string | null }
interface CourseChannel {
  id: string; title: string; thumbnailUrl: string | null;
  instructor: User;
  enrollments: { student: User }[];
}
interface Enrollment { course: CourseChannel }
interface ChannelMessage {
  id: string; body: string; createdAt: Date;
  contentId: string; author: User;
}
interface DM {
  id: string; body: string; createdAt: Date; isRead: boolean;
  senderId: string; recipientId: string;
  sender: User; recipient: User;
}
interface Props {
  currentUserId: string;
  currentUser: User;
  enrollments: Enrollment[];
  channelMessages: ChannelMessage[];
  dms: DM[];
}

type ChannelType = "course" | "dm";
interface ActiveChannel { type: ChannelType; id: string; name: string; avatar?: string | null }
interface Reaction { key: string; count: number }

// ── WELCOME BANNER ─────────────────────────────────────────────────────────────
function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-accent/80 via-accent/40 to-accent/60 dark:from-violet-900/30 dark:via-violet-900/10 dark:to-violet-900/20 p-5 mb-2 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[18px] font-black text-foreground mb-1.5">Сайн уу! 👋</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs">
            SQL өгөгдлийн сантай ажиллах тухай мэдээ, асуулт, ярилцлагаа хуваалцаарай.
          </p>
        </div>
        <div className="relative shrink-0 select-none">
          <span className="absolute -top-1 left-0 text-yellow-400 text-lg pointer-events-none">✦</span>
          <span className="absolute bottom-0 right-2 text-primary/50 text-sm pointer-events-none">✦</span>
          <MascotImage variant="wave" size={88} className="animate-float drop-shadow-lg" />
        </div>
      </div>
    </div>
  );
}

// ── REACTION POPUP ─────────────────────────────────────────────────────────────
function ReactionPopup({ onReact, onClose }: {
  onReact: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="animate-fade-in absolute -top-11 left-0 z-30 flex items-center gap-1 rounded-2xl border border-border bg-card px-2 py-1.5 shadow-lg">
      {REACTION_STICKERS.map(s => (
        <button
          key={s.key}
          onClick={() => { onReact(s.key); onClose(); }}
          className="relative w-7 h-7 transition-transform hover:scale-125 active:scale-95"
          title={s.key}
        >
          <Image src={s.src} alt={s.key} fill unoptimized className="object-contain" />
        </button>
      ))}
    </div>
  );
}

// ── MESSAGE BUBBLE ─────────────────────────────────────────────────────────────
function MessageBubble({
  msg, isMe, reactions, onReact,
}: {
  msg: { id: string; body: string; createdAt: Date | string; author: User };
  isMe: boolean;
  reactions: Reaction[];
  onReact: (key: string) => void;
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const isSticker  = msg.body.startsWith(STICKER_PREFIX);
  const stickerKey = isSticker ? msg.body.replace(STICKER_PREFIX, "") : null;
  const stickerData = stickerKey ? ROBO_STICKERS.find(s => s.key === stickerKey) : null;

  return (
    <div className={cn("group flex gap-2.5 animate-fade-in", isMe && "flex-row-reverse")}>
      {!isMe && (
        <Avatar className="w-8 h-8 shrink-0 mt-0.5 ring-2 ring-background shadow-sm">
          <AvatarImage src={msg.author.avatarUrl ?? undefined} alt={msg.author.name} />
          <AvatarFallback className="text-[9px] bg-accent text-primary font-bold">
            {getInitials(msg.author.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[72%] relative", isMe && "items-end flex flex-col")}>
        {!isMe && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[12px] font-semibold text-foreground">{msg.author.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
            </span>
          </div>
        )}

        <div className="relative">
          {/* Hover reaction trigger */}
          <div className={cn(
            "absolute top-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity",
            isMe ? "-left-8" : "-right-8",
          )}>
            <button
              onClick={() => setShowReactionPicker(v => !v)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
            >
              <Smile size={11} className="text-primary" />
            </button>
          </div>

          {showReactionPicker && (
            <ReactionPopup
              onReact={onReact}
              onClose={() => setShowReactionPicker(false)}
            />
          )}

          {isSticker && stickerData ? (
            <div className={cn("flex", isMe && "justify-end")}>
              <div className="relative w-24 h-24 drop-shadow-md transition-transform hover:scale-105 cursor-pointer">
                <Image src={stickerData.src} alt={stickerData.label} fill unoptimized className="object-contain" />
              </div>
            </div>
          ) : (
            <div className={cn(
              "px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm",
              isMe
                ? "bg-gradient-to-br from-primary to-violet-500 text-white rounded-tr-sm"
                : "bg-accent dark:bg-violet-900/30 text-foreground rounded-tl-sm",
            )}>
              {isMe && (
                <div className="flex items-center gap-1 mb-0.5 justify-end">
                  <span className="text-[10px] text-white/50">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                  <svg width="16" height="9" viewBox="0 0 16 9" fill="none" className="shrink-0">
                    <path d="M1 4.5L4.5 8L10 2"  stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 4.5L8.5 8L14 2" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              {msg.body.includes("\n") ? (
                <div className="whitespace-pre-line">{msg.body}</div>
              ) : (
                msg.body
              )}
            </div>
          )}
        </div>

        {/* Reaction chips */}
        {reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1.5", isMe && "justify-end")}>
            {reactions.map(r => {
              const sticker = REACTION_STICKERS.find(s => s.key === r.key);
              if (!sticker) return null;
              return (
                <button
                  key={r.key}
                  onClick={() => onReact(r.key)}
                  className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 hover:bg-accent transition-all shadow-sm"
                >
                  <div className="relative w-3.5 h-3.5">
                    <Image src={sticker.src} alt={r.key} fill unoptimized className="object-contain" />
                  </div>
                  <span className="text-[11px] font-bold text-primary">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STICKER PICKER PANEL ───────────────────────────────────────────────────────
function StickerPickerPanel({ onSelect, onClose }: {
  onSelect: (s: typeof ROBO_STICKERS[number]) => void;
  onClose: () => void;
}) {
  return (
    <div className="animate-slide-up border-t border-border bg-card px-4 pt-3 pb-2">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5">
            <Image src="/assets/stickers/robo/robo-hi.png" alt="" fill unoptimized className="object-contain" />
          </div>
          <span className="text-[12px] font-black text-foreground">Robo Stickers</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
        >
          <X size={13} />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {ROBO_STICKERS.map(s => (
          <button
            key={s.key}
            onClick={() => { onSelect(s); onClose(); }}
            title={s.label}
            className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:bg-accent hover:scale-110 active:scale-95"
          >
            <div className="relative w-9 h-9">
              <Image src={s.src} alt={s.label} fill unoptimized className="object-contain drop-shadow-sm" />
            </div>
            <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-1 w-full">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── STICKER BAR ────────────────────────────────────────────────────────────────
function StickerBar({ onSelect }: { onSelect: (s: typeof ROBO_STICKERS[number]) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0 pr-1.5 border-r border-border">
        <div className="relative w-4 h-4 shrink-0">
          <Image src="/assets/stickers/robo/robo-hi.png" alt="" fill unoptimized className="object-contain" />
        </div>
        <span className="text-[10px] font-black text-foreground whitespace-nowrap">Robo Stickers</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {ROBO_STICKERS.map(s => (
          <button
            key={s.key}
            onClick={() => onSelect(s)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 hover:bg-accent hover:border-primary/30 hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <div className="relative w-4 h-4">
              <Image src={s.src} alt={s.label} fill unoptimized className="object-contain" />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── RECOMMENDATION BANNER ──────────────────────────────────────────────────────
function RecommendationBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-background via-card to-accent/40 dark:from-card dark:via-card dark:to-violet-900/10 p-4 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-primary mb-0.5">Шинэ чадвар, шинэ боломж</p>
          <p className="text-[10px] text-muted-foreground mb-2.5">Танд санал болгож буй дараагийн курс</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent border border-border flex items-center justify-center shrink-0">
              <BookOpen size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-foreground truncate">Advanced Python Programming</p>
              <p className="text-[10px] text-muted-foreground">Батбаяр Эрдэнэ · Дунда тувшин</p>
            </div>
            <div className="hidden lg:flex items-center gap-4 ml-1">
              {[
                { value: "12",    label: "Хичээл" },
                { value: "Дунда", label: "Тувшин" },
                { value: "4.9",   label: "Үнэлгаа" },
              ].map(item => (
                <div key={item.label} className="text-center shrink-0">
                  <p className="text-[13px] font-black text-foreground">{item.value}</p>
                  <p className="text-[9px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <MascotImage variant="laptop" size={64} className="shrink-0 drop-shadow-md" />
          <button className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12px] font-bold text-white hover:bg-primary/90 active:scale-95 transition-all btn-purple-glow whitespace-nowrap shadow-md shadow-violet-200/40 dark:shadow-violet-900/40">
            Курс үзэх <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export function MessagesClient({
  currentUserId, currentUser, enrollments, channelMessages, dms,
}: Props) {
  const [active, setActive] = useState<ActiveChannel | null>(
    enrollments[0]
      ? { type: "course", id: enrollments[0].course.id, name: enrollments[0].course.title, avatar: enrollments[0].course.thumbnailUrl }
      : null,
  );
  const [input,           setInput]           = useState("");
  const [search,          setSearch]          = useState("");
  const [localMessages,   setLocalMessages]   = useState<ChannelMessage[]>(channelMessages);
  const [isPending,       startTransition]    = useTransition();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, Reaction[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active, localMessages]);

  const activeMessages = active?.type === "course"
    ? localMessages.filter(m => m.contentId === active.id)
    : dms
        .filter(m =>
          (m.senderId === currentUserId && m.recipientId === active?.id) ||
          (m.recipientId === currentUserId && m.senderId === active?.id),
        )
        .map(m => ({ ...m, author: m.sender, contentId: "" }));

  const activeCourse = active?.type === "course"
    ? enrollments.find(e => e.course.id === active.id)?.course
    : null;
  const members = activeCourse?.enrollments.map(e => e.student) ?? [];

  const filteredEnrollments = enrollments.filter(e =>
    e.course.title.toLowerCase().includes(search.toLowerCase()),
  );

  const unreadCounts: Record<string, number> = {};
  enrollments.forEach(({ course }) => {
    const count = channelMessages.filter(
      m => m.contentId === course.id && m.author.id !== currentUserId,
    ).length;
    if (count > 0) unreadCounts[course.id] = count;
  });

  const handleSend = () => {
    if (!input.trim() || !active) return;
    const body = input.trim();
    setInput("");

    if (active.type === "course") {
      const optimistic: ChannelMessage = {
        id: `opt-${Date.now()}`, body, createdAt: new Date(),
        contentId: active.id, author: currentUser,
      };
      setLocalMessages(prev => [...prev, optimistic]);
      startTransition(async () => {
        try { await postCourseMessage(active.id, body); }
        catch { setLocalMessages(prev => prev.filter(m => m.id !== optimistic.id)); }
      });
    }
  };

  const handleStickerSend = (sticker: typeof ROBO_STICKERS[number]) => {
    if (!active) return;
    const body = `${STICKER_PREFIX}${sticker.key}`;
    const optimistic: ChannelMessage = {
      id: `opt-sticker-${Date.now()}`, body, createdAt: new Date(),
      contentId: active.id, author: currentUser,
    };
    setLocalMessages(prev => [...prev, optimistic]);
    if (active.type === "course") {
      startTransition(async () => {
        try { await postCourseMessage(active.id, body); }
        catch { setLocalMessages(prev => prev.filter(m => m.id !== optimistic.id)); }
      });
    }
  };

  const handleReact = (msgId: string, key: string) => {
    setMessageReactions(prev => {
      const existing = prev[msgId] ?? [];
      const found    = existing.find(r => r.key === key);
      return {
        ...prev,
        [msgId]: found
          ? existing.map(r => r.key === key ? { ...r, count: r.count + 1 } : r)
          : [...existing, { key, count: 1 }],
      };
    });
  };

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 128px)" }}>

      {/* ── MAIN PANEL ── */}
      <div
        className="flex flex-1 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-2)" }}
      >
        {/* ── CHANNEL SIDEBAR ── */}
        <div className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">

          {/* Robo Messenger header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2.5 rounded-xl bg-muted border border-border px-3 py-2.5 mb-2.5">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/assets/mascot/mascot-wave.png" alt="Robo Messenger" fill unoptimized className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-foreground">Robo Messenger</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Message, discuss, and learn with AI
                </p>
              </div>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search channels..."
                className="w-full pl-8 pr-3 py-2 text-[12px] bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>
          </div>

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <div className="px-2 pt-1 pb-1.5">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Course Channels
              </span>
            </div>

            {filteredEnrollments.map(({ course }) => {
              const isActive = active?.id === course.id;
              const unread   = unreadCounts[course.id];
              return (
                <button
                  key={course.id}
                  onClick={() =>
                    setActive({ type: "course", id: course.id, name: course.title, avatar: course.thumbnailUrl })
                  }
                  className={cn(
                    "flex items-center gap-2 w-full px-2.5 py-2.5 rounded-xl text-[12px] font-medium transition-all",
                    isActive
                      ? "bg-accent text-primary dark:bg-violet-900/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Hash size={13} className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 truncate text-left leading-tight">{course.title}</span>
                  {unread !== undefined && (
                    <span className={cn(
                      "shrink-0 flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-black px-1",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredEnrollments.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground py-6">Курс олдсонгүй</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border space-y-1">
            <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-[12px] font-semibold text-primary hover:bg-accent transition-colors dark:hover:bg-violet-900/20">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Plus size={11} className="text-primary" />
              </div>
              Шинэ суваг үүсгэх
            </button>

            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl">
              <div className="relative shrink-0">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={currentUser.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-accent text-primary font-bold">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">{currentUser.name}</p>
                <p className="text-[9px] text-emerald-500 font-semibold">● Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CHAT AREA ── */}
        {active ? (
          <div className="flex flex-col flex-1 min-w-0 bg-background">

            {/* Channel header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Hash size={14} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-foreground truncate">{active.name}</p>
                  {activeCourse && (
                    <p className="text-[10px] text-muted-foreground">
                      {members.length} members · {activeCourse.instructor.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center">
                  {members.slice(0, 3).map((m, i) => (
                    <Avatar
                      key={m.id}
                      className="w-6 h-6 ring-2 ring-card shadow-sm"
                      style={{ marginLeft: i > 0 ? "-6px" : 0 }}
                    >
                      <AvatarImage src={m.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[8px] bg-accent text-primary font-bold">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 3 && (
                    <div
                      className="w-6 h-6 rounded-full bg-accent border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary shadow-sm"
                      style={{ marginLeft: "-6px" }}
                    >
                      +{members.length - 3}
                    </div>
                  )}
                </div>
                <button className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <Users size={15} className="text-muted-foreground" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <MoreVertical size={15} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              <WelcomeBanner />

              {activeMessages.length === 0 && (
                <div className="text-center py-8">
                  <MascotImage variant="thinking" size={64} className="mx-auto mb-2 animate-float" />
                  <p className="text-[13px] font-bold text-foreground">Анхны мессеж илгээгээрэй!</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Энэ сувгийн ярилцлагыг эхлүүл</p>
                </div>
              )}

              {activeMessages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.author.id === currentUserId}
                  reactions={messageReactions[msg.id] ?? []}
                  onReact={key => handleReact(msg.id, key)}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Sticker bar */}
            <StickerBar onSelect={handleStickerSend} />

            {/* Input area */}
            <div className="border-t border-border bg-card shrink-0">
              {showStickerPicker && (
                <StickerPickerPanel
                  onSelect={handleStickerSend}
                  onClose={() => setShowStickerPicker(false)}
                />
              )}
              <div className="p-3">
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-muted rounded-2xl border border-border focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder={`Message #${active.name.slice(0, 25)}...`}
                    className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowStickerPicker(v => !v)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        showStickerPicker ? "text-primary bg-accent" : "text-muted-foreground hover:text-primary hover:bg-accent",
                      )}
                    >
                      <Smile size={16} />
                    </button>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all">
                      <ImageIcon size={16} />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isPending}
                      className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-95 btn-purple-glow"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background">
            <MascotImage variant="wave" size={96} className="animate-mascot-bounce" />
            <div className="text-center">
              <p className="text-[14px] font-bold text-foreground">Сувгаа сонгоно уу</p>
              <p className="text-[12px] text-muted-foreground mt-1">Курсын сувгаа сонгоод чат эхлүүлэх!</p>
            </div>
          </div>
        )}
      </div>

      {/* ── RECOMMENDATION BANNER ── */}
      <RecommendationBanner />
    </div>
  );
}
