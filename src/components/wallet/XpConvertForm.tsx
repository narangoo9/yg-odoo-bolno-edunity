"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { convertXpToCredits } from "@/modules/wallet/application/actions";
import { Button } from "@/components/ui/button";

interface Props {
  maxXp: number;
  remainingCap: number;
}

const XP_PER_CREDIT = 1000;

export function XpConvertForm({ maxXp, remainingCap }: Props) {
  const router = useRouter();
  const [xpAmount, setXpAmount] = useState(XP_PER_CREDIT);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const maxCreditsFromXp = maxXp / XP_PER_CREDIT;
  const creditsPreview = Math.min(xpAmount / XP_PER_CREDIT, remainingCap);

  const handleConvert = async () => {
    setLoading(true);
    setMessage(null);
    const result = await convertXpToCredits(xpAmount);
    setLoading(false);

    if ("error" in result) {
      setMessage({ type: "error", text: typeof result.error === "string" ? result.error : "Алдаа гарлаа" });
      return;
    }

    setMessage({
      type: "success",
      text: `${result.xpSpent} XP → $${result.creditsEarned} кредит амжилттай хөрвүүлэгдлээ!`,
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Хөрвүүлэх XP (1000-ын үржвэр)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={XP_PER_CREDIT}
            max={maxXp}
            step={XP_PER_CREDIT}
            value={xpAmount}
            onChange={(e) => setXpAmount(Number(e.target.value))}
            className="flex-1 accent-violet-600"
          />
          <span className="text-sm font-bold text-violet-600 w-20 text-right">
            {xpAmount.toLocaleString()} XP
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-violet-500" />
          <span className="text-sm text-muted-foreground">{xpAmount.toLocaleString()} XP</span>
        </div>
        <span className="text-muted-foreground/80">→</span>
        <div className="text-sm font-bold text-emerald-600">
          ${creditsPreview.toFixed(2)} кредит
        </div>
      </div>

      {message && (
        <div
          className={`text-sm p-3 rounded-lg ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button
        onClick={handleConvert}
        disabled={loading || xpAmount < XP_PER_CREDIT}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Хөрвүүлж байна...
          </>
        ) : (
          <>
            <Zap size={16} className="mr-2" />
            {xpAmount.toLocaleString()} XP хөрвүүлэх
          </>
        )}
      </Button>
    </div>
  );
}
