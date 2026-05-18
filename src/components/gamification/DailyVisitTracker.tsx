"use client";

import { useEffect, useRef } from "react";

/** Records daily visit once per browser session for streak/XP sidebar refresh */
export function DailyVisitTracker() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fetch("/api/v1/gamification/daily-visit", { method: "POST" }).catch(() => null);
  }, []);

  return null;
}
