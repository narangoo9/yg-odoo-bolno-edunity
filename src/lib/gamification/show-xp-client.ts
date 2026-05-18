"use client";

import { useXpToastStore } from "@/stores/xp-toast-store";

export function showXpGainOnClient(payload: {
  amount?: number;
  reason?: string;
  leveledUp?: boolean;
  level?: number;
}) {
  if (!payload.amount || payload.amount <= 0) return;
  useXpToastStore.getState().show({
    amount: payload.amount,
    reason: payload.reason ?? "XP олсон",
    leveledUp: payload.leveledUp,
    level: payload.level,
  });
}
