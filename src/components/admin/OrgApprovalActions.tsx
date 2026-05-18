"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { approveOrganization, rejectOrganization } from "@/modules/admin/application/moderation-actions";

export function OrgApprovalActions({ orgId, pending }: { orgId: string; pending: boolean }) {
  const router = useRouter();
  const [pendingAction, startTransition] = useTransition();

  if (!pending) return null;

  const run = (action: "approve" | "reject") => {
    startTransition(async () => {
      const result =
        action === "approve" ? await approveOrganization(orgId) : await rejectOrganization(orgId);
      if ("error" in result && result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
      <button
        type="button"
        disabled={pendingAction}
        onClick={() => run("approve")}
        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pendingAction ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Зөвшөөрөх
      </button>
      <button
        type="button"
        disabled={pendingAction}
        onClick={() => run("reject")}
        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60"
      >
        <X size={12} />
        Татгалзах
      </button>
    </div>
  );
}
