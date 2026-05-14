"use client";

import Link from "next/link";
import { X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  reason?: string;
  requiredPlan?: "STANDARD" | "PRO";
  onClose: () => void;
}

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "0₮",
    tone: "border-slate-200 bg-white",
    features: ["First lesson only", "5 AI credits", "Basic XP", "Certificate locked"],
  },
  {
    id: "STANDARD",
    name: "Standard",
    price: "9,900₮ / сар",
    tone: "border-violet-300 bg-violet-50",
    features: ["First 5 lessons or 50% unlock", "100 AI credits/month", "Tasks + notes", "XP boost x1.2"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "19,900₮ / сар",
    tone: "border-fuchsia-300 bg-fuchsia-50",
    features: ["Full company access", "500 AI credits/month", "Final project + peer review", "Certificate included"],
  },
];

export function UpgradeModal({ open, reason, requiredPlan = "STANDARD", onClose }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl shadow-violet-950/20">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          aria-label="Upgrade modal хаах"
        >
          <X size={16} />
        </button>

        <div className="bg-gradient-to-r from-violet-700 via-violet-600 to-fuchsia-600 px-6 py-7 text-white">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black">
            <Sparkles size={14} /> EduNity upgrade
          </div>
          <h2 className="text-2xl font-black">Үргэлжлүүлэн сурах уу?</h2>
          <p className="mt-2 max-w-2xl text-sm text-violet-100">
            {reason ?? "Та free preview-ээ үзлээ. Илүү олон хичээл, AI туслах, task, certificate авахын тулд upgrade хийнэ үү."}
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          {plans.map((plan) => {
            const highlighted = plan.id === requiredPlan;
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl border p-4",
                  plan.tone,
                  highlighted && "ring-2 ring-violet-500 ring-offset-2",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">{plan.name}</p>
                    <p className="mt-1 text-lg font-black text-violet-700">{plan.price}</p>
                  </div>
                  {highlighted ? (
                    <span className="rounded-full bg-violet-600 px-2 py-1 text-[10px] font-black text-white">Needed</span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                      <Check size={13} className="mt-0.5 shrink-0 text-violet-600" /> {feature}
                    </p>
                  ))}
                </div>
                {plan.id !== "FREE" ? (
                  <Link
                    href={`/student/upgrade?plan=${plan.id === "STANDARD" ? "PREMIUM" : plan.id}`}
                    className={cn(
                      "mt-4 inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-black text-white transition-colors",
                      plan.id === "PRO" ? "bg-fuchsia-600 hover:bg-fuchsia-500" : "bg-violet-600 hover:bg-violet-500",
                    )}
                  >
                    {plan.id === "PRO" ? "Pro авах" : "Standard авах"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Одоо биш
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
