"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, CreditCard, ArrowRight, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  getPlanById,
  isFreePlan,
  isPaidPlan,
  normalizePlanId,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/billing/plans";

interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd?: boolean;
}

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

  const planId = normalizePlanId(subscription?.plan);
  const planConfig = getPlanById(planId);
  const status = subscription?.status ?? "ACTIVE";
  const isFree = isFreePlan(planId);
  const isCancelled = status === "CANCELLED" || cancelled;
  const isPastDue = status === "PAST_DUE";
  const statusInfo = SUBSCRIPTION_STATUS_LABELS[status] ?? {
    label: status,
    color: "text-muted-foreground",
  };

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
            <p className="text-[11px] text-muted-foreground">Одоогийн багц</p>
          </div>
        </div>
        {!isFree && !isCancelled && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[11px] font-bold">
            <Crown size={11} />
            {planConfig.name}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Багц</span>
          <span className="text-[13px] font-bold text-foreground">{planConfig.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Үнэ</span>
          <span className="text-[13px] font-bold text-foreground">
            {planConfig.priceMnt === 0 ? planConfig.displayPrice : `${planConfig.displayPrice} / сар`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Төлөв</span>
          <span className={`text-[13px] font-bold flex items-center gap-1 ${statusInfo.color}`}>
            {isCancelled ? (
              <>
                <XCircle size={13} /> Цуцлагдсан
              </>
            ) : status === "ACTIVE" || status === "TRIALING" ? (
              <>
                <CheckCircle2 size={13} /> {statusInfo.label}
              </>
            ) : (
              statusInfo.label
            )}
          </span>
        </div>
        {subscription?.currentPeriodEnd && isPaidPlan(planId) && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">
              {isCancelled || subscription.cancelAtPeriodEnd ? "Хандах хугацаа дуусах" : "Дараагийн сунгалт"}
            </span>
            <span className="text-[13px] font-bold text-foreground">
              {formatStableDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}
      </div>

      {isPastDue && statusInfo.userMessage && (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>{statusInfo.userMessage}</p>
        </div>
      )}

      {isCancelled && statusInfo.userMessage && (
        <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>{statusInfo.userMessage}</p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[12px] text-red-500 font-medium">{error}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {isFree ? (
          <Link
            href="/student/upgrade"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white hover:bg-primary/90"
          >
            Premium авах
            <ArrowRight size={14} />
          </Link>
        ) : (
          !isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {cancelling ? <Loader2 size={14} className="animate-spin" /> : null}
              Захиалга цуцлах
            </button>
          )
        )}
        {!isFree && planId === "PREMIUM" && (
          <Link
            href="/student/upgrade"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-[13px] font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300"
          >
            Pro руу шилжих
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </section>
  );
}
