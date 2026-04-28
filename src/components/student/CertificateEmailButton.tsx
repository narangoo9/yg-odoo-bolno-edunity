"use client";

import { useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface CertificateEmailButtonProps {
  certificateId: string;
}

export function CertificateEmailButton({ certificateId }: CertificateEmailButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/certificates/${certificateId}/email`, {
          method: "POST",
        });
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; error?: string }
          | null;

        if (!response.ok || !result?.success) {
          toast({
            type: "error",
            title: "И-мэйл илгээж чадсангүй",
            description: result?.error ?? "Дахин оролдоно уу.",
          });
          return;
        }

        toast({
          type: "success",
          title: "Сертификатыг Gmail руу илгээлээ",
          description: "PDF хавсралт болон баталгаажуулах холбоос явуулсан.",
        });
      } catch {
        toast({
          type: "error",
          title: "Сүлжээний алдаа",
          description: "И-мэйл илгээх үед алдаа гарлаа.",
        });
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={handleSend}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Mail />}
      {isPending ? "Илгээж байна..." : "Gmail руу илгээх"}
    </Button>
  );
}
