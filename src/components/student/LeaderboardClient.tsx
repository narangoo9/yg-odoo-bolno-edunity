"use client";

import { useState } from "react";
import {
  Trophy, Zap, Flame, Users, Link2, Copy, Check,
  Crown, UserPlus, Gift, Target,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { MascotImage } from "@/components/brand/MascotImage";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string; name: string; avatarUrl: string | null;
  streak: number; level: number;
}
interface Entry {
  userId: string; totalXp: number; weeklyXp: number; rank: number | null; weeklyRank?: number | null;
  user: LeaderboardUser;
}
interface Props {
  globalEntries: Entry[];
  weeklyEntries: Entry[];
  friendEntries: Entry[];
  currentUserId: string;
  myEntry: { rank: number | null; weeklyXp: number; monthlyXp: number; totalXp: number; weeklyRank: number | null } | null;
  myUser: { name: string; avatarUrl: string | null; level: number; referralCode: string | null } | null;
  friendCount: number;
}

type Tab = "global" | "friends" | "weekly";

// gold / silver / bronze
const PODIUM = [
  { // #2 silver
    ring: "ring-slate-300 dark:ring-slate-600",
    podiumBg: "bg-gradient-to-t from-slate-300 to-slate-200",
    text: "text-slate-700",
    shadow: "shadow-slate-200/80 dark:shadow-slate-900/50",
    avatarFallback: "bg-slate-100 text-slate-600",
  },
  { // #1 gold
    ring: "ring-amber-400",
    podiumBg: "bg-gradient-to-t from-amber-400 to-yellow-300",
    text: "text-amber-900",
    shadow: "shadow-yellow-300/80 dark:shadow-yellow-900/50",
    avatarFallback: "bg-yellow-100 text-amber-700",
  },
  { // #3 bronze
    ring: "ring-orange-400",
    podiumBg: "bg-gradient-to-t from-orange-400 to-orange-300",
    text: "text-orange-900",
    shadow: "shadow-orange-300/80 dark:shadow-orange-900/50",
    avatarFallback: "bg-orange-100 text-orange-700",
  },
];

// Subtle confetti overlay (CSS-only, no deps)
function ConfettiDots() {
  const dots = [
    { color: "bg-yellow-400",  left: "8%",  delay: "0s",    dur: "2.6s", size: "w-2 h-2" },
    { color: "bg-violet-400",  left: "18%", delay: "0.4s",  dur: "3.1s", size: "w-1.5 h-1.5" },
    { color: "bg-pink-400",    left: "28%", delay: "0.8s",  dur: "2.4s", size: "w-2 h-2" },
    { color: "bg-emerald-400", left: "40%", delay: "1.2s",  dur: "2.9s", size: "w-1 h-1" },
    { color: "bg-sky-400",     left: "52%", delay: "0.2s",  dur: "3.3s", size: "w-1.5 h-1.5" },
    { color: "bg-rose-400",    left: "63%", delay: "0.6s",  dur: "2.7s", size: "w-2 h-2" },
    { color: "bg-amber-400",   left: "75%", delay: "1.0s",  dur: "2.5s", size: "w-1 h-1" },
    { color: "bg-fuchsia-400", left: "86%", delay: "0.3s",  dur: "3.0s", size: "w-1.5 h-1.5" },
    { color: "bg-lime-400",    left: "93%", delay: "0.9s",  dur: "2.8s", size: "w-1 h-1" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {dots.map((d, i) => (
        <span
          key={i}
          className={cn("absolute bottom-6 rounded-full animate-confetti", d.color, d.size)}
          style={{ left: d.left, animationDelay: d.delay, animationDuration: d.dur }}
        />
      ))}
    </div>
  );
}

function PodiumBlock({ entry, position, isMe }: { entry: Entry; position: 1 | 2 | 3; isMe: boolean }) {
  const pIdx = position === 1 ? 1 : position === 2 ? 0 : 2;
  const c = PODIUM[pIdx];
  const heights    = { 1: "h-[110px]", 2: "h-[80px]",  3: "h-[65px]" };
  const avatarCls  = { 1: "w-16 h-16 text-base", 2: "w-12 h-12 text-xs", 3: "w-10 h-10 text-xs" };
  const podiumW    = { 1: "w-[88px]", 2: "w-20",       3: "w-20" };
  const medals     = { 1: "🥇",       2: "🥈",          3: "🥉" };

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Crown on #1 */}
      {position === 1 ? (
        <Crown size={22} className="text-yellow-500 fill-yellow-400 drop-shadow" />
      ) : (
        <div className="h-[22px]" /> /* spacer keeps alignment */
      )}

      {/* Avatar + glow for #1 */}
      <div className="relative flex items-center justify-center">
        {position === 1 && (
          <div className="absolute inset-0 rounded-full bg-yellow-400/40 blur-xl animate-podium-glow" />
        )}
        <Avatar
          className={cn(
            "ring-4 ring-offset-2 ring-offset-background relative z-10",
            avatarCls[position],
            isMe ? "ring-violet-500" : c.ring,
          )}
        >
          <AvatarImage src={entry.user.avatarUrl ?? undefined} alt={entry.user.name} />
          <AvatarFallback
            className={cn("font-black", isMe ? "bg-violet-100 text-violet-700" : c.avatarFallback)}
          >
            {getInitials(entry.user.name)}
          </AvatarFallback>
        </Avatar>
        {/* Medal badge */}
        <span className="absolute -bottom-1 -right-1 text-sm z-20 drop-shadow">{medals[position]}</span>
      </div>

      {/* Name */}
      <p className={cn(
        "text-[11px] font-bold text-center max-w-[80px] truncate leading-tight",
        isMe ? "text-violet-600 dark:text-violet-400" : "text-foreground",
      )}>
        {entry.user.name}
        {isMe && <span className="block text-[9px] text-violet-500 font-black">YOU</span>}
      </p>

      {/* Podium pillar */}
      <div className="relative">
        {position === 1 && (
          <div className="absolute inset-x-2 -bottom-3 h-6 rounded-full bg-yellow-400/50 blur-lg animate-podium-glow" />
        )}
        <div className={cn(
          "rounded-t-2xl flex flex-col items-center justify-center gap-0.5 shadow-lg relative z-10",
          heights[position], podiumW[position], c.podiumBg, c.shadow,
        )}>
          <span className={cn("text-[20px] font-black leading-none", c.text)}>#{position}</span>
          <div className="flex items-center gap-0.5">
            <Zap size={9} className={c.text} />
            <span className={cn("text-[10px] font-black", c.text)}>{tab_xp(entry).toLocaleString()}</span>
          </div>
          <span className={cn("text-[9px] font-bold opacity-70", c.text)}>Lv.{entry.user.level}</span>
        </div>
      </div>
    </div>
  );
}

function tab_xp(e: Entry) { return e.totalXp; }

function RankRow({ entry, rank, currentUserId, xp }: { entry: Entry; rank: number; currentUserId: string; xp: number }) {
  const isMe = entry.userId === currentUserId;

  const topBg = {
    1: "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800/40",
    2: "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/20 dark:to-slate-600/10 border-slate-200 dark:border-slate-700/40",
    3: "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/40",
  } as Record<number, string>;

  return (
    <div className={cn(
      "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 border",
      isMe
        ? "bg-violet-50 dark:bg-violet-500/10 border-l-4 border-violet-400 dark:border-violet-500"
        : rank <= 3
          ? topBg[rank]
          : "hover:bg-muted/70 hover:-translate-y-px hover:shadow-sm border-transparent",
    )}>
      {/* Rank badge */}
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0",
        rank === 1 ? "bg-gradient-to-br from-yellow-300 to-amber-400 text-amber-900 shadow-sm" :
        rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-sm" :
        rank === 3 ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900 shadow-sm" :
        "bg-muted text-muted-foreground",
      )}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
      </div>

      <Avatar className="w-8 h-8 shrink-0 ring-1 ring-violet-100 dark:ring-violet-800/40">
        <AvatarImage src={entry.user.avatarUrl ?? undefined} alt={entry.user.name} />
        <AvatarFallback className="text-[10px] bg-violet-100 dark:bg-violet-800 text-violet-700 font-bold">
          {getInitials(entry.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-[13px] font-semibold truncate", isMe && "text-violet-700 dark:text-violet-300")}>
            {entry.user.name}
          </p>
          {isMe && (
            <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[9px] font-black rounded-full">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground font-medium">Lv.{entry.user.level}</span>
          {entry.user.streak > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-orange-500">
              <Flame size={8} className="fill-orange-500" />{entry.user.streak}d
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-0.5 justify-end">
          <Zap size={10} className="text-amber-500 fill-amber-500" />
          <span className="text-[13px] font-black text-amber-600 dark:text-amber-400">{xp.toLocaleString()}</span>
        </div>
        <span className="text-[9px] text-muted-foreground">XP</span>
      </div>
    </div>
  );
}

export function LeaderboardClient({
  globalEntries, weeklyEntries, friendEntries,
  currentUserId, myEntry, myUser, friendCount,
}: Props) {
  const [tab, setTab] = useState<Tab>("weekly");
  const [copied, setCopied] = useState(false);

  const entries = tab === "global" ? globalEntries : tab === "weekly" ? weeklyEntries : friendEntries;
  const getXp = (e: Entry) => tab === "weekly" ? e.weeklyXp : e.totalXp;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const inviteLink = typeof window !== "undefined" && myUser?.referralCode
    ? `${window.location.origin}/register?ref=${myUser.referralCode}`
    : "";

  const copyInvite = () => {
    if (inviteLink) navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const myPosition = entries.findIndex(e => e.userId === currentUserId);
  const myVisibleEntry = myPosition >= 0 ? entries[myPosition] : null;
  const myCurrentRank = myPosition >= 0 ? myPosition + 1 : tab === "weekly" ? myEntry?.weeklyRank : myEntry?.rank;
  const myCurrentXp = myVisibleEntry ? getXp(myVisibleEntry) : tab === "weekly" ? myEntry?.weeklyXp : myEntry?.totalXp;
  const nextEntry  = myPosition > 0 ? entries[myPosition - 1] : null;
  const xpToNext   = nextEntry ? (getXp(nextEntry) - (myCurrentXp ?? 0)) : null;

  const REWARDS = [
    {
      rank: "#1", icon: "🥇", label: "Алтан badge · 500 gem",
      cls: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800/40",
    },
    {
      rank: "#2-3", icon: "🥈", label: "Мөнгөн badge · 300 gem",
      cls: "from-slate-50 to-slate-100 dark:from-slate-700/20 dark:to-slate-600/10 border-slate-200 dark:border-slate-700/40",
    },
    {
      rank: "#4-10", icon: "🎁", label: "100 gem · Streak shield",
      cls: "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 border-violet-200 dark:border-violet-800/40",
    },
  ];

  const podiumOrder: [Entry, Entry, Entry] | null =
    top3.length === 3 ? [top3[1], top3[0], top3[2]] : null;

  return (
    <div className="animate-fade-up space-y-5">

      {/* ── HERO CARD ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl shadow-xl"
        style={{ background: "linear-gradient(135deg, #3b0764 0%, #5b21b6 40%, #7c3aed 70%, #a855f7 100%)" }}
      >
        {/* Geometric background elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-white/[0.04]" />
          <div className="absolute top-0 right-0 w-full h-full opacity-30"
            style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(168,85,247,0.4) 0%, transparent 60%)" }} />
          {/* Star dots */}
          {["10%,15%","25%,70%","45%,25%","60%,80%","78%,35%","90%,60%"].map((pos, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{ left: pos.split(",")[0], top: pos.split(",")[1] }} />
          ))}
        </div>

        <div className="relative z-10 p-5 sm:p-6">
          {/* Top row: badge + mascot */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                <Trophy size={11} className="text-yellow-300 fill-yellow-300" />
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">Тэмцэйн</span>
              </div>
              <h1 className="text-[1.75rem] sm:text-[2rem] font-black text-white leading-tight">
                Шилдэг суралцагчид
              </h1>
              <p className="text-[13px] text-violet-200/80 mt-1">
                TOP 3 → <span className="text-yellow-300 font-bold">🥇 500 XP + алтан badge</span>
              </p>
            </div>
            <div className="relative shrink-0 hidden sm:block">
              <div className="absolute inset-0 rounded-full bg-yellow-400/25 blur-2xl scale-150" />
              <MascotImage
                variant="celebrate"
                size={110}
                className="relative z-10 animate-float drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Stats row — my current standing */}
          {myEntry && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center">
                <p className="text-[18px] font-black text-white leading-none">
                  {myCurrentRank ? `#${myCurrentRank}` : "—"}
                </p>
                <p className="text-[10px] text-violet-200/80 mt-0.5 font-medium">Миний байр</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center">
                <p className="text-[18px] font-black text-yellow-300 leading-none">
                  {(myCurrentXp ?? 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-violet-200/80 mt-0.5 font-medium">XP</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center">
                <p className="text-[18px] font-black text-white leading-none">
                  {xpToNext ? `+${xpToNext.toLocaleString()}` : "🏆"}
                </p>
                <p className="text-[10px] text-violet-200/80 mt-0.5 font-medium">
                  {xpToNext ? "Дараагийн байранд" : "Шилдэг!"}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)" }}>
            {(["weekly", "global", "friends"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-150",
                  tab === t
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/15",
                )}
              >
                {t === "weekly" ? "7 хоног" : t === "friends" ? `Найзууд (${friendCount})` : "Глобал"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN LAYOUT ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-5">

        {/* LEFT: PODIUM + RANKINGS */}
        <div className="space-y-4">

          {/* Podium */}
          {podiumOrder && (
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm relative overflow-hidden">
              <ConfettiDots />
              {/* Top gradient tint */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-violet-50/70 to-transparent dark:from-violet-900/15 pointer-events-none rounded-t-3xl" />

              <div className="relative z-10 flex items-end justify-center gap-4 sm:gap-8">
                <PodiumBlock entry={podiumOrder[0]} position={2} isMe={podiumOrder[0].userId === currentUserId} />
                <PodiumBlock entry={podiumOrder[1]} position={1} isMe={podiumOrder[1].userId === currentUserId} />
                <PodiumBlock entry={podiumOrder[2]} position={3} isMe={podiumOrder[2].userId === currentUserId} />
              </div>
            </div>
          )}

          {/* Rankings list */}
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <Trophy size={13} className="text-amber-500 fill-amber-500/30" />
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Rankings
              </h3>
            </div>

            {top3.length > 0 && (
              <div className="px-3 pb-2 space-y-1">
                {top3.map((e, i) => (
                  <RankRow key={e.userId} entry={e} rank={i + 1} currentUserId={currentUserId} xp={getXp(e)} />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <>
                <div className="border-t border-dashed border-border mx-3" />
                <div className="px-3 pt-2 pb-3 space-y-1 max-h-[420px] overflow-y-auto">
                  {rest.map((e, i) => (
                    <RankRow key={e.userId} entry={e} rank={i + 4} currentUserId={currentUserId} xp={getXp(e)} />
                  ))}
                </div>
              </>
            )}

            {entries.length === 0 && (
              <div className="text-center py-12">
                <Users size={28} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {tab === "friends" ? "Найз байхгүй байна. Нэгийг урина уу!" : "Мэдээлэл байхгүй."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: STATS PANEL */}
        <div className="space-y-3">

          {/* My status card */}
          {myEntry && (
            <div className="rounded-3xl border-2 border-violet-200 dark:border-violet-700/50 bg-gradient-to-br from-violet-50 to-purple-50/60 dark:from-violet-900/10 dark:to-purple-900/10 p-4">
              <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-3">
                Чиний байдал
              </p>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10 ring-2 ring-violet-400 ring-offset-1 ring-offset-background">
                  <AvatarImage src={myUser?.avatarUrl ?? undefined} alt={myUser?.name} />
                  <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-sm">
                    {getInitials(myUser?.name ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[18px] font-black text-foreground leading-none">#{myCurrentRank ?? "—"}</p>
                  {myCurrentRank && myCurrentRank <= 10 && (
                    <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold mt-0.5">Top 10 байна! 🎉</p>
                  )}
                </div>
              </div>

              {nextEntry && xpToNext !== null && xpToNext > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground font-medium">{myCurrentXp?.toLocaleString()} XP</span>
                    <span className="text-muted-foreground font-medium">{getXp(nextEntry).toLocaleString()} XP</span>
                  </div>
                  <div className="h-2 bg-white dark:bg-violet-900/30 rounded-full overflow-hidden border border-violet-100 dark:border-violet-800/40">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, ((myCurrentXp ?? 0) / getXp(nextEntry)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold text-center">
                    Дахиад {xpToNext.toLocaleString()} XP → #{(myCurrentRank ?? 0) - 1}-р байр 💪
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rewards card — gold tint with mascot */}
          <div className="rounded-3xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50/40 dark:from-amber-900/15 dark:via-yellow-900/10 dark:to-orange-900/10 p-4 relative overflow-hidden">
            {/* Mascot watermark */}
            <div className="absolute -bottom-2 -right-2 opacity-[0.15] pointer-events-none rotate-[-8deg]">
              <MascotImage variant="certificate" size={72} />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Gift size={14} className="text-amber-600" />
              <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                Шагнал
              </p>
            </div>

            <div className="space-y-2">
              {REWARDS.map((r) => (
                <div
                  key={r.rank}
                  className={cn(
                    "flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r border",
                    r.cls,
                  )}
                >
                  <span className="text-lg shrink-0">{r.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-foreground">{r.rank}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* XP stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border border-violet-100 dark:border-violet-800/40 p-3 text-center">
              <Zap size={14} className="text-violet-500 fill-violet-500 mx-auto mb-1" />
              <p className="text-[16px] font-black text-foreground">{(myEntry?.weeklyXp ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Weekly XP</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/10 dark:to-pink-900/10 border border-fuchsia-100 dark:border-fuchsia-800/40 p-3 text-center">
              <Target size={14} className="text-fuchsia-500 mx-auto mb-1" />
              <p className="text-[16px] font-black text-foreground">{(myEntry?.totalXp ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Total XP</p>
            </div>
          </div>

          {/* Invite button */}
          <button
            onClick={copyInvite}
            disabled={!inviteLink}
            className="w-full py-3.5 rounded-2xl font-black text-[13px] text-white transition-all shadow-lg shadow-pink-200/60 dark:shadow-pink-900/30 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #f03e78 0%, #e64980 55%, #c2255c 100%)" }}
          >
            {copied ? <Check size={15} /> : <UserPlus size={15} />}
            {copied ? "Хуулагдлаа!" : "Найзаа урих"}
          </button>

          {inviteLink && (
            <div className="flex items-center gap-2 p-3 bg-card rounded-2xl border border-border">
              <Link2 size={12} className="text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground truncate flex-1">{inviteLink}</p>
              <button onClick={copyInvite} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors">
                {copied
                  ? <Check size={11} className="text-emerald-500" />
                  : <Copy size={11} className="text-muted-foreground" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
