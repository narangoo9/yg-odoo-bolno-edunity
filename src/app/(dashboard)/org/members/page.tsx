"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getOrgMembers } from "@/modules/organizations/application/actions";
import { MembersTable } from "@/components/org/MembersTable";
import { InviteMemberModal } from "@/components/org/InviteMemberModal";
import { UserPlus, Clock, Mail } from "lucide-react";

interface Member {
  id: string;
  role: "OWNER" | "ADMIN" | "INSTRUCTOR" | "VIEWER";
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

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
}

export default function OrgMembersPage() {
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = session?.user?.organizationId;
  const userRole = (session?.user as { role?: string })?.role;
  const canManage = userRole === "COMPANY" || userRole === "SUPER_ADMIN";

  async function fetchMembers() {
    if (!orgId) return;
    setLoading(true);
    const result = await getOrgMembers(orgId);
    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Алдаа гарлаа");
    } else {
      setMembers((result.members ?? []) as Member[]);
      setPendingInvites((result.pendingInvites ?? []) as PendingInvite[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (status === "authenticated") fetchMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, orgId]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="text-center py-20 text-muted-foreground">Байгууллага тохируулаагүй байна</div>
    );
  }

  const ownerId = members.find((m) => m.role === "OWNER")?.user.id ?? "";

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Гишүүд</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{members.length} идэвхтэй гишүүн</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            <UserPlus size={16} />
            Гишүүн урих
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10">Гишүүн байхгүй байна</p>
        ) : (
          <MembersTable
            members={members}
            organizationId={orgId}
            ownerId={ownerId}
            currentUserId={session?.user?.id ?? ""}
            canManage={canManage}
          />
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={14} />
            Хүлээгдэж буй урилгууд ({pendingInvites.length})
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{invite.email}</span>
                  <span className="text-xs text-muted-foreground">· {invite.role}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(invite.expiresAt).toLocaleDateString("mn-MN")} хүртэл
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInvite && (
        <InviteMemberModal
          organizationId={orgId}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setShowInvite(false);
            fetchMembers();
          }}
        />
      )}
    </div>
  );
}
