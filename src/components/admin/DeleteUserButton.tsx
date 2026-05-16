"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminUser } from "@/modules/admin/application/actions";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  redirectTo?: string;
}

export function DeleteUserButton({ userId, userName, redirectTo }: DeleteUserButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          if (!window.confirm(`${userName} account-ыг бүр мөсөн устгах уу?`)) return;

          startTransition(async () => {
            const result = await deleteAdminUser(userId);
            if ("error" in result) {
              setError(result.error);
              return;
            }

            if (redirectTo) {
              router.push(redirectTo);
            } else {
              router.refresh();
            }
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
      >
        <Trash2 size={13} />
        {isPending ? "Устгаж байна..." : "Устгах"}
      </button>
      {error && <p className="max-w-56 text-right text-[11px] font-medium text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
