"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, type InviteMemberInput } from "@/modules/organizations/domain/schemas";
import { inviteMember } from "@/modules/organizations/application/actions";

interface Props {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Эзэн",
  ADMIN: "Админ",
  INSTRUCTOR: "Багш",
  VIEWER: "Үзэгч",
};

export function InviteMemberModal({ organizationId, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { organizationId, role: "INSTRUCTOR" },
  });

  async function onSubmit(data: InviteMemberInput) {
    setServerError(null);
    setPending(true);
    try {
      const result = await inviteMember(data);
      if (result.error) {
        setServerError(typeof result.error === "string" ? result.error : "Алдаа гарлаа");
      } else {
        onSuccess();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Гишүүн урих</h2>
          <button onClick={onClose} className="text-muted-foreground/80 hover:text-muted-foreground text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("organizationId")} />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Имэйл хаяг</label>
            <input
              type="email"
              {...register("email")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="bagsh@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Эрх</label>
            <select
              {...register("role")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {serverError && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border rounded-lg py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-violet-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-60"
            >
              {pending ? "Илгээж байна..." : "Урих"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
