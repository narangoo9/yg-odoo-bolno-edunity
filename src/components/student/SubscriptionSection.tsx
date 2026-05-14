"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, CreditCard, ArrowRight, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Үнэгүй",
  STUDENT: "Оюутан",
  PREMIUM: "Premium",
  PRO: "Pro",
  INSTRUCTOR: "Багш",
  ORGANIZATION: "Байгууллага",
  ENTERPRISE: "Enterprise",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Идэвхтэй", color: "text-emerald-600" },
  CANCELLED: { label: "Цуцлагдсан", color: "text-red-500" },
  EXPIRED: { label: "Хугацаа дууссан", color: "text-amber-600" },
  PAST_DUE: { label: "Төлбөр хоцорсон", color: "text-red-500" },
  TRIALING: { label: "Туршилтын хугацаа", color: "text-violet-600" },
};

function formatStableDate(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

export function SubscriptionSection({ subscription }: { subscription: SubscriptionInfo | null }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = subscription?.plan ?? "FREE";
  const status = subscription?.status ?? "ACTIVE";
  const isFree = plan === "FREE";
  const isCancelled = status === "CANCELLED" || cancelled;
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const statusInfo = STATUS_LABELS[status] ?? { label: status, color: "text-muted-foreground" };

  async function handleCancel() {
    if (!confirm("Захиалгаа цуцлахдаа итгэлтэй байна уу? Хугацаа дуустал хандах боломжтой хэвээр байна.")) return;

    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/payments/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Алдаа гарлаа");
      } else {
        setCancelled(true);
      }
    } catch {
      setError("Сүлжээний алдаа гарлаа");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-1)" }}>
      <div className="flex items-center justify-between gap-2.5 mb-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-black text-foreground">Захиалга</h2>
            <p className="text-[11px] text-muted-foreground">Одоогийн тарифийн мэдээлэл</p>
          </div>
        </div>
        {!isFree && !isCancelled && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[11px] font-bold">
            <Crown size={11} />
            {planLabel}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Тарифийн төлөвлөгөө</span>
          <span className="text-[13px] font-bold text-foreground">{planLabel}</span>
        </div>
        {!isFree && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Төлөв</span>
            <span className={`text-[13px] font-bold flex items-center gap-1 ${statusInfo.color}`}>
              {isCancelled ? (
                <><XCircle size={13} /> Цуцлагдсан</>
              ) : status === "ACTIVE" ? (
                <><CheckCircle2 size={13} /> Идэвхтэй</>
              ) : (
                statusInfo.label
              )}
            </span>
          </div>
        )}
        {subscription?.currentPeriodEnd && !isFree && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">{isCancelled ? "Хандах хугацаа дуусах" : "Дараагийн төлбөр"}</span>
            <span className="text-[13px] font-bold text-foreground">
              {formatStableDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-2.5 text-[12px] text-red-600 dark:text-red-400">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {isCancelled && !isFree && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-100 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 text-[12px] text-amber-700 dark:text-amber-400">
          <AlertTriangle size={13} />
          Захиалга цуцлагдлаа. Хугацаа дуустал хандах боломжтой.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isFree ? (
          <Link
            href="/student/upgrade"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-bold rounded-xl transition-colors"
          >
            <Crown size={13} /> Upgrade хийх <ArrowRight size={12} />
          </Link>
        ) : (
          <>
            {!isCancelled && (
              <>
                <Link
                  href="/student/upgrade"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-[12px] font-bold rounded-xl transition-colors"
                >
                  <Crown size={13} /> Тарифаа дээшлүүлэх
                </Link>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 text-[12px] font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {cancelling ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  {cancelling ? "Цуцалж байна..." : "Захиалга цуцлах"}
                </button>
              </>
            )}
            {isCancelled && (
              <Link
                href="/student/upgrade"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-bold rounded-xl transition-colors"
              >
                <Crown size={13} /> Дахин захиалах <ArrowRight size={12} />
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
