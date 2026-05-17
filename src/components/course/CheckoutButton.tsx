"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface Props {
  courseId: string;
  courseTitle: string;
  price: number;
  currency: string;
}

export function CheckoutButton({ courseId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast({ type: "error", title: "Алдаа", description: "Checkout session үүсгэж чадсангүй" });
      }
    } catch {
      toast({ type: "error", title: "Алдаа гарлаа" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 disabled:opacity-60 transition-colors"
    >
      {loading ? (
        <><Loader2 size={16} className="animate-spin" /> Түр хүлээнэ үү...</>
      ) : (
        <><CreditCard size={16} /> Төлбөр төлөх</>
      )}
    </button>
  );
}
