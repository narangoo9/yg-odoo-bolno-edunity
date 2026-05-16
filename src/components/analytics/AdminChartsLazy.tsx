"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { AdminCharts } from "@/components/analytics/AdminCharts";

const Charts = dynamic(
  () => import("@/components/analytics/AdminCharts").then((m) => m.AdminCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[280px] animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    ),
  },
);

export function AdminChartsLazy(props: ComponentProps<typeof AdminCharts>) {
  return <Charts {...props} />;
}
