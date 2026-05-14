"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, Maximize2, Pause, Play, X } from "lucide-react";
import { usePersistentVideoStore } from "@/lib/learning-player-store";
import { formatSeconds } from "@/lib/youtube-course";

const MINI_PLAYER_POSITION_KEY = "edunity-mini-player-position";

export function PersistentMiniPlayer() {
  const pathname = usePathname();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const {
    lessonUrl,
    lessonTitle,
    sectionTitle,
    videoId,
    timestamp,
    isPlaying,
    minimized,
    setPlaying,
    setMinimized,
    clear,
  } = usePersistentVideoStore();

  useEffect(() => {
    const saved = window.localStorage.getItem(MINI_PLAYER_POSITION_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { x?: number; y?: number };
      setPosition({ x: parsed.x ?? 0, y: parsed.y ?? 0 });
    } catch {
      setPosition({ x: 0, y: 0 });
    }
  }, []);

  if (!videoId || !lessonUrl || !minimized || pathname === lessonUrl) return null;

  const src = `https://www.youtube.com/embed/${videoId}?start=${Math.max(0, Math.floor(timestamp))}&rel=0&enablejsapi=1&modestbranding=1&playsinline=1${isPlaying ? "&autoplay=1" : ""}`;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.04}
      animate={position}
      onDragEnd={(_, info) => {
        const next = { x: position.x + info.offset.x, y: position.y + info.offset.y };
        setPosition(next);
        window.localStorage.setItem(MINI_PLAYER_POSITION_KEY, JSON.stringify(next));
      }}
      className="fixed bottom-5 right-5 z-[9998] w-[340px] overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl shadow-violet-200/60 dark:border-violet-800 dark:bg-card dark:shadow-black/40"
    >
      <div className="flex cursor-move items-center border-b border-violet-100 bg-violet-50/90 px-3 py-2 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200">
        <div className="flex min-w-0 items-center gap-2 text-xs font-black">
          <GripHorizontal size={15} />
          <span className="truncate">Mini player</span>
        </div>
      </div>
      <div className="aspect-video bg-black">
        <iframe
          key={`${videoId}-${isPlaying}`}
          className="h-full w-full"
          title={sectionTitle || lessonTitle}
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-foreground">{lessonTitle}</p>
          <p className="truncate text-xs text-muted-foreground">
            {sectionTitle} · {formatSeconds(timestamp)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPlaying(!isPlaying)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-500"
            aria-label={isPlaying ? "Pause mini player" : "Play mini player"}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <Link
            href={lessonUrl}
            onClick={() => setMinimized(false)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100"
          >
            <Maximize2 size={14} /> Back to lesson
          </Link>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close mini player"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
