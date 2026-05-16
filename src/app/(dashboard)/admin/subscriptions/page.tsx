import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/index";

export const metadata: Metadata = { title: "Захиалга" };

const planLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive" | "outline" }> = {
  FREE:         { label: "Үнэгүй", variant: "secondary" },
  STUDENT:      { label: "Оюутан", variant: "info" },
  INSTRUCTOR:   { label: "Багш", variant: "success" },
  ORGANIZATION: { label: "Байгууллага", variant: "warning" },
  ENTERPRISE:   { label: "Корпорат", variant: "destructive" },
};

const statusLabels: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" | "outline" }> = {
  ACTIVE:    { label: "Идэвхтэй", variant: "success" },
  CANCELLED: { label: "Цуцалсан", variant: "destructive" },
  EXPIRED:   { label: "Дуусгавар", variant: "secondary" },
  PAST_DUE:  { label: "Хугацаа хэтэрсэн", variant: "warning" },
  TRIALING:  { label: "Туршилт", variant: "outline" },
};

interface PageProps {
  searchParams: Promise<{ status?: string; plan?: string; page?: string }>;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 20;

  const where = {
    ...(sp.status && { status: sp.status as "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING" }),
    ...(sp.plan && { plan: sp.plan as "FREE" | "STUDENT" | "INSTRUCTOR" | "ORGANIZATION" | "ENTERPRISE" }),
  };

  const [subscriptions, total, stats] = await Promise.all([
    db.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        createdAt: true,
        user: { select: { name: true, email: true, avatarUrl: true } },
      },
    }),
    db.subscription.count({ where }),
    db.subscription.groupBy({
      by: ["plan"],
      _count: { _all: true },
    }).catch(() => []),
  ]);

  const subscriptionIds = subscriptions.map((s) => s.id);
  const paidBySubscription =
    subscriptionIds.length > 0
      ? await db.payment.groupBy({
          by: ["subscriptionId"],
          _sum: { amount: true },
          where: {
            subscriptionId: { in: subscriptionIds },
            status: "COMPLETED",
          },
        })
      : [];
  const paidMap = new Map(
    paidBySubscription
      .filter((p): p is typeof p & { subscriptionId: string } => Boolean(p.subscriptionId))
      .map((p) => [p.subscriptionId, Number(p._sum.amount ?? 0)]),
  );

  const totalRevenue = await db.payment.aggregate({
    _sum: { amount: true },
    where: { status: "COMPLETED" },
  }).catch(() => ({ _sum: { amount: 0 } }));

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-slate-100">Захиалга</h1>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1">Нийт {total} захиалга</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
          <p className="text-blue-200 text-xs">Нийт орлого</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(Number(totalRevenue._sum.amount ?? 0))}</p>
        </div>
        {stats.slice(0, 3).map((s) => {
          const pl = planLabels[s.plan];
          return (
            <div key={s.plan} className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border p-4">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">{pl?.label ?? s.plan}</p>
              <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{s._count._all}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {["", "ACTIVE", "TRIALING", "CANCELLED", "EXPIRED"].map((s) => (
            <a
              key={s}
              href={`?${new URLSearchParams({ ...(sp.plan ? { plan: sp.plan } : {}), ...(s ? { status: s } : {}) })}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                (sp.status ?? "") === s
                  ? "bg-violet-600 dark:bg-muted text-white dark:text-foreground border-border dark:border-border"
                  : "bg-card dark:bg-[#1e1b4b] text-muted-foreground dark:text-muted-foreground/60 border-border dark:border-border hover:bg-muted dark:hover:bg-slate-700"
              }`}
            >
              {s ? (statusLabels[s]?.label ?? s) : "Бүгд"}
            </a>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {["", "FREE", "STUDENT", "INSTRUCTOR", "ORGANIZATION"].map((p) => (
            <a
              key={p}
              href={`?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(p ? { plan: p } : {}) })}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                (sp.plan ?? "") === p
                  ? "bg-violet-600 dark:bg-muted text-white dark:text-foreground border-border dark:border-border"
                  : "bg-card dark:bg-[#1e1b4b] text-muted-foreground dark:text-muted-foreground/60 border-border dark:border-border hover:bg-muted dark:hover:bg-slate-700"
              }`}
            >
              {p ? (planLabels[p]?.label ?? p) : "Бүх төлөвлөгөө"}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted dark:bg-slate-700/50 border-b border-border dark:border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Хэрэглэгч</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider hidden md:table-cell">Төлөвлөгөө</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Дуусах огноо</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Нийт төлбөр</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <CreditCard size={32} className="mx-auto text-muted-foreground/60 dark:text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Захиалга байхгүй байна</p>
                </td>
              </tr>
            ) : subscriptions.map((sub) => {
              const pl = planLabels[sub.plan];
              const sl = statusLabels[sub.status];
              const totalPaid = paidMap.get(sub.id) ?? 0;
              return (
                <tr key={sub.id} className="hover:bg-muted dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-muted-foreground dark:text-muted-foreground/60 shrink-0">
                        {sub.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground dark:text-slate-100">{sub.user.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <Badge variant={pl?.variant ?? "secondary"}>{pl?.label ?? sub.plan}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={sl?.variant ?? "secondary"}>{sl?.label ?? sub.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground dark:text-muted-foreground hidden lg:table-cell">
                    {formatDate(sub.currentPeriodEnd)}
                    {sub.cancelAtPeriodEnd && (
                      <span className="ml-1 text-red-400">(цуцлагдах)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border dark:border-border">
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{total} захиалгын {(page - 1) * limit + 1}–{Math.min(page * limit, total)}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                  className="px-3 py-1 text-xs bg-card dark:bg-slate-700 border border-border dark:border-border rounded hover:bg-muted dark:hover:bg-slate-600 text-foreground dark:text-slate-200">← Өмнөх</a>
              )}
              {page * limit < total && (
                <a href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                  className="px-3 py-1 text-xs bg-card dark:bg-slate-700 border border-border dark:border-border rounded hover:bg-muted dark:hover:bg-slate-600 text-foreground dark:text-slate-200">Дараах →</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
