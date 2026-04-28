"use client";

import { useState, useTransition } from "react";
import { removeMember, updateMemberRole } from "@/modules/organizations/application/actions";
import type { OrgMemberRole } from "@prisma/client";

interface Member {
  id: string;
  role: OrgMemberRole;
  status: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    lastLoginAt: Date | null;
  };
}

const ROLE_LABELS: Record<OrgMemberRole, string> = {
  OWNER: "Эзэн",
  ADMIN: "Админ",
  INSTRUCTOR: "Багш",
  VIEWER: "Үзэгч",
};

const ROLE_COLORS: Record<OrgMemberRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  INSTRUCTOR: "bg-green-100 text-green-700",
  VIEWER: "bg-muted text-muted-foreground",
};

interface Props {
  members: Member[];
  organizationId: string;
  ownerId: string;
  currentUserId: string;
  canManage: boolean;
}

export function MembersTable({ members, organizationId, ownerId, currentUserId, canManage }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(userId: string, role: OrgMemberRole) {
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole({ organizationId, userId, role });
      if (result.error) setError(typeof result.error === "string" ? result.error : "Алдаа гарлаа");
    });
  }

  function handleRemove(userId: string) {
    if (!confirm("Гишүүнийг хасах уу?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeMember({ organizationId, userId });
      if (result.error) setError(typeof result.error === "string" ? result.error : "Алдаа гарлаа");
    });
  }

  return (
    <div>
      {error && (
        <div className="mb-3 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">Гишүүн</th>
              <th className="pb-3 font-medium">Эрх</th>
              <th className="pb-3 font-medium">Нэгдсэн огноо</th>
              {canManage && <th className="pb-3 font-medium text-right">Үйлдэл</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {members.map((m) => (
              <tr key={m.id} className="group">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden flex-shrink-0">
                      {m.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.user.avatarUrl} alt={m.user.name} className="w-full h-full object-cover" />
                      ) : (
                        m.user.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.user.name}</p>
                      <p className="text-muted-foreground/80 text-xs">{m.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  {canManage && m.user.id !== ownerId ? (
                    <select
                      value={m.role}
                      disabled={isPending}
                      onChange={(e) => handleRoleChange(m.user.id, e.target.value as OrgMemberRole)}
                      className="border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                    >
                      {(Object.keys(ROLE_LABELS) as OrgMemberRole[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  )}
                </td>
                <td className="py-3 text-muted-foreground">
                  {new Date(m.joinedAt).toLocaleDateString("mn-MN")}
                </td>
                {canManage && (
                  <td className="py-3 text-right">
                    {m.user.id !== currentUserId && m.user.id !== ownerId && (
                      <button
                        onClick={() => handleRemove(m.user.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                      >
                        Хасах
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
