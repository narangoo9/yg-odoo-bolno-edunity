"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "offline";

type Props = {
  state: ChatConnectionState;
  className?: string;
  onRetry?: () => void;
};

const LABELS: Record<ChatConnectionState, string> = {
  connecting: "Холбогдож байна…",
  connected: "Холбогдсон",
  reconnecting: "Дахин холбогдож байна…",
  disconnected: "Холболт тасарсан",
  offline: "Офлайн байна",
};

export function ChatConnectionStatus({ state, className, onRetry }: Props) {
  const [showConnected, setShowConnected] = useState(false);

  useEffect(() => {
    if (state === "connected") {
      setShowConnected(true);
      const t = setTimeout(() => setShowConnected(false), 2500);
      return () => clearTimeout(t);
    }
    setShowConnected(false);
  }, [state]);

  const visible =
    state === "connecting" ||
    state === "reconnecting" ||
    state === "disconnected" ||
    state === "offline" ||
    showConnected;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3 py-1.5 text-[11px] font-medium",
          state === "connected" &&
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
          (state === "connecting" || state === "reconnecting") &&
            "border-violet-500/20 bg-violet-500/10 text-violet-200",
          (state === "disconnected" || state === "offline") &&
            "border-amber-500/20 bg-amber-500/10 text-amber-200",
          className,
        )}
      >
        <span className="flex items-center gap-1.5">
          {state === "connecting" || state === "reconnecting" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : state === "connected" ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          {LABELS[state]}
        </span>
        {(state === "disconnected" || state === "offline") && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold hover:bg-white/20"
          >
            <RefreshCw size={10} />
            Дахин оролдох
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
