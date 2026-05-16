import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Системийн лог" };

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  LOGIN:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT: "bg-muted text-muted-foreground dark:bg-slate-700 dark:text-muted-foreground/60",
};

interface PageProps {
  searchParams: Promise<{ action?: string; entity?: string; page?: string; search?: string }>;
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const limit = 30;

  const where = {
    ...(sp.action && { action: { contains: sp.action, mode: "insensitive" as const } }),
    ...(sp.entity && { entity: { equals: sp.entity } }),
    ...(sp.search && {
      OR: [
        { action: { contains: sp.search, mode: "insensitive" as const } },
        { entity: { contains: sp.search, mode: "insensitive" as const } },
        { entityId: { contains: sp.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const getCachedLogEntities = unstable_cache(
    () => db.auditLog.groupBy({ by: ["entity"], _count: { _all: true } }),
    ["admin-log-entities"],
    { revalidate: 120 },
  );

  const [logs, total, entities] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ipAddress: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
    getCachedLogEntities().catch(() => []),
  ]);

  const topEntities = entities
    .map((e) => ({
      entity: e.entity,
      count: typeof e._count === "object" && e._count && "_all" in e._count ? e._count._all ?? 0 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-slate-100">Системийн лог</h1>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1">Нийт {total} үйлдэл бүртгэгдсэн</p>
      </div>

      {/* Entity distribution */}
      {topEntities.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {topEntities.map((e) => (
            <a
              key={e.entity}
              href={`?${new URLSearchParams({ entity: e.entity })}`}
              className={`bg-card dark:bg-[#1e1b4b] rounded-2xl border p-3 text-center hover:border-border transition-colors cursor-pointer ${
                sp.entity === e.entity ? "border-border dark:border-border" : "border-border dark:border-border"
              }`}
            >
              <p className="text-lg font-bold text-foreground dark:text-white">{e.count}</p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate">{e.entity}</p>
            </a>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative">
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Хайх..."
            className="pl-3 pr-4 py-2 text-sm border border-border dark:border-border rounded-xl bg-card dark:bg-[#1e1b4b] focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 w-48 text-foreground dark:text-slate-100"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          {["", "CREATE", "UPDATE", "DELETE", "LOGIN"].map((a) => (
            <a
              key={a}
              href={`?${new URLSearchParams({ ...(sp.search ? { search: sp.search } : {}), ...(sp.entity ? { entity: sp.entity } : {}), ...(a ? { action: a } : {}) })}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                (sp.action ?? "") === a
                  ? "bg-violet-600 dark:bg-muted text-white dark:text-foreground border-border dark:border-border"
                  : "bg-card dark:bg-[#1e1b4b] text-muted-foreground dark:text-muted-foreground/60 border-border dark:border-border hover:bg-muted dark:hover:bg-slate-700"
              }`}
            >
              {a || "Бүгд"}
            </a>
          ))}
        </div>
        {(sp.entity || sp.action || sp.search) && (
          <a href="/admin/logs" className="text-xs text-red-500 hover:underline ml-auto">Шүүлтүүр цэвэрлэх</a>
        )}
      </div>

      {/* Logs table */}
      <div className="bg-card dark:bg-[#1e1b4b] rounded-2xl border border-border dark:border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted dark:bg-slate-700/50 border-b border-border dark:border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase">Огноо</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase">Үйлдэл</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase hidden md:table-cell">Обьект</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase hidden lg:table-cell">Хэрэглэгч</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase hidden xl:table-cell">IP хаяг</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <ShieldCheck size={32} className="mx-auto text-muted-foreground/60 dark:text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Лог байхгүй байна</p>
                </td>
              </tr>
            ) : logs.map((log) => {
              const color = actionColors[log.action.toUpperCase()] ?? "bg-muted text-muted-foreground dark:bg-slate-700 dark:text-muted-foreground/60";
              return (
                <tr key={log.id} className="hover:bg-muted dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted-foreground dark:text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs font-medium text-foreground dark:text-muted-foreground/60">{log.entity}</p>
                    {log.entityId && <p className="text-xs text-muted-foreground font-mono">{log.entityId.slice(0, 12)}…</p>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {log.user ? (
                      <div>
                        <p className="text-xs font-medium text-foreground dark:text-muted-foreground/60">{log.user.name}</p>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Систем</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden xl:table-cell">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border dark:border-border">
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{total} бүртгэлийн {(page - 1) * limit + 1}–{Math.min(page * limit, total)}</p>
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
