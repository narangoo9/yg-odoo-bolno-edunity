"use client";

import dynamic from "next/dynamic";

const RoboAgent = dynamic(
  () => import("@/components/ai/RoboAgent").then((m) => ({ default: m.RoboAgent })),
  { ssr: false, loading: () => null },
);

interface RoboAgentClientProps {
  firstName?: string;
  level?: number;
  xp?: number;
  streak?: number;
}

export function RoboAgentClient(props: RoboAgentClientProps) {
  return <RoboAgent {...props} />;
}
