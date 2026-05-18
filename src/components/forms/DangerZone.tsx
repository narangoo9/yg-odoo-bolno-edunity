"use client";

import { useState } from "react";
import { Trash2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/v1/users/me", { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        toast({
          type: "error",
          title: "Account устгах боломжгүй",
          description: result?.error ?? "Дахин оролдоно уу.",
        });
        setDeleting(false);
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      toast({ type: "error", title: "Сүлжээний алдаа" });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-foreground">Гарах</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Энэ төхөөрөмжөөс гарах</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut size={13} /> Гарах
        </Button>
      </div>

      <div className="h-px bg-muted" />

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-red-900">Бүртгэл устгах</p>
          <p className="mt-0.5 text-xs text-red-600">Устгасны дараа сэргээх боломжгүй.</p>
        </div>
        {!confirming ? (
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 size={13} /> Устгах
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={deleting} onClick={() => setConfirming(false)}>
              Болих
            </Button>
            <Button size="sm" variant="destructive" disabled={deleting} onClick={handleDeleteAccount}>
              {deleting ? "Устгаж байна..." : "Баталгаажуулах"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
