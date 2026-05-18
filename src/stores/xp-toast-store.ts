"use client";

import { create } from "zustand";

export type XpToastPayload = {
  id: string;
  amount: number;
  reason: string;
  leveledUp?: boolean;
  level?: number;
};

type XpToastState = {
  toasts: XpToastPayload[];
  show: (payload: Omit<XpToastPayload, "id">) => void;
  dismiss: (id: string) => void;
};

export const useXpToastStore = create<XpToastState>((set) => ({
  toasts: [],
  show: (payload) => {
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { ...payload, id }],
    }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
