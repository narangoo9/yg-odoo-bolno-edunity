import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/index";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";

export const metadata: Metadata = { title: "Хэрэглэгчид" };

const roleLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive" | "outline" }> = {
  STUDENT:     { label: "User",        variant: "secondary"  },
  INSTRUCTOR:  { label: "Company",     variant: "warning"     },
  ORG_ADMIN:   { label: "Company",     variant: "warning"     },
  SUPER_ADMIN: { label: "Super admin", variant: "destructive" },
};

const statusLabels: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" }> = {
  ACTIVE:               { label: "Идэвхтэй",        variant: "success"     },
  INACTIVE:             { label: "Идэвхгүй",         variant: "secondary"   },
  SUSPENDED:            { label: "Хаагдсан",         variant: "destructive" },
  PENDING_VERIFICATION: { label: "Хүлээгдэж байна", variant: "warning"     },
};

interface PageProps {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const sp    = await searchParams;
  const page  = Number(sp.page ?? 1);
  const limit = 20;

  const where = {
    ...(sp.search && {
      OR: [
        { name:  { contains: sp.search, mode: "insensitive" as const } },
        { email: { contains: sp.search, mode: "insensitive" as const } },
      ],
    }),
    ...(sp.role && { role: sp.role as "STUDENT" | "ORG_ADMIN" | "SUPER_ADMIN" }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, role: true, status: true,
        createdAt: true, lastLoginAt: true, avatarUrl: true,
        _count: { select: { enrollments: true, coursesCreated: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return (
    <div className="space-y-6 animate-fade-up max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Хэрэглэгчид</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Нийт {total} хэрэглэгч</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Нэр, имэйлээр хайх..."
            className="pl-9 pr-4 py-2 text-sm border border-border rounded-2xl bg-card focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 w-60 text-foreground placeholder:text-muted-foreground"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          {["", "STUDENT", "ORG_ADMIN", "SUPER_ADMIN"].map((r) => (
            <a key={r}
              href={`?${new URLSearchParams({ ...(sp.search ? { search: sp.search } : {}), ...(r ? { role: r } : {}) })}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                (sp.role ?? "") === r
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-card text-muted-foreground border-border hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-700/40 hover:text-violet-700 dark:hover:text-violet-300"
              }`}>
              {r ? roleLabels[r]?.label : "Бүгд"}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Хэрэглэгч</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Эрх</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Бүртгэл</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Сүүлд нэвтэрсэн</th>
              <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const rl = roleLabels[user.role];
              const sl = statusLabels[user.status];
              return (
                <tr key={user.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0 overflow-hidden">
                        {user.avatarUrl
                          ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                          : user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <Badge variant={rl?.variant ?? "secondary"}>{rl?.label ?? user.role}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={sl?.variant ?? "secondary"}>{sl?.label ?? user.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground hidden xl:table-cell">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/admin/users/${user.id}`}
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 px-2.5 py-1 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
                        Дэлгэрэнгүй
                      </a>
                      <DeleteUserButton userId={user.id} userName={user.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {total} хэрэглэгчийн {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-card border border-border rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-700/40 transition-colors text-foreground">
                  ← Өмнөх
                </a>
              )}
              {page * limit < total && (
                <a href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-card border border-border rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-700/40 transition-colors text-foreground">
                  Дараах →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
