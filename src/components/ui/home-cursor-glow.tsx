"use client";

import dynamic from "next/dynamic";

const CursorGlow = dynamic(
  () => import("@/components/ui/cursor-glow").then((mod) => mod.CursorGlow),
  { ssr: false },
);

export function HomeCursorGlow() {
  return <CursorGlow />;
}
