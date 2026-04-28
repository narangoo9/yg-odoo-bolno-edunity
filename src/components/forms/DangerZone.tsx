"use client";

import { useState } from "react";
import { Trash2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      {/* Logout */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-foreground">Гарах</p>
          <p className="text-xs text-muted-foreground mt-0.5">Бүх төхөөрөмжөөс нэг дор гарах</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut size={13} /> Гарах
        </Button>
      </div>

      <div className="h-px bg-muted" />

      {/* Delete account */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-red-900">Бүртгэл устгах</p>
          <p className="text-xs text-red-600 mt-0.5">Устгасны дараа сэргээх боломжгүй</p>
        </div>
        {!confirming ? (
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 size={13} /> Устгах
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Болих</Button>
            <Button size="sm" variant="destructive">Баталгаажуулах</Button>
          </div>
        )}
      </div>
    </div>
  );
}
