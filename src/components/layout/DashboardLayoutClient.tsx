"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { DailyVisitTracker } from "@/components/gamification/DailyVisitTracker";
import { XpToastHost } from "@/components/gamification/XpToastHost";

type MobileSidebarContextValue = {
  mobileOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function useMobileSidebar() {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) {
    throw new Error("useMobileSidebar must be used within DashboardLayoutClient");
  }
  return ctx;
}

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openSidebar = useCallback(() => setMobileOpen(true), []);
  const closeSidebar = useCallback(() => setMobileOpen(false), []);

  return (
    <MobileSidebarContext.Provider value={{ mobileOpen, openSidebar, closeSidebar }}>
      <DailyVisitTracker />
      {children}
      <XpToastHost />
    </MobileSidebarContext.Provider>
  );
}
