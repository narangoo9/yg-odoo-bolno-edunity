"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingSkipLink() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleSkip = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: true }),
      });
    } catch {
      // Non-fatal; still navigate so user is never stuck
    }
    router.push("/student");
  };

  return (
    <button
      type="button"
      onClick={handleSkip}
      disabled={busy}
      className="rounded-xl border border-violet-200/80 bg-white/70 px-4 py-2 text-[12px] font-semibold text-violet-600 backdrop-blur-sm transition-all hover:bg-white hover:shadow-sm disabled:opacity-60"
    >
      Алгасах →
    </button>
  );
}
