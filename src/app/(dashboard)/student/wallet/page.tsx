import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWalletSummary } from "@/modules/wallet/application/actions";
import { Zap, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { XpConvertForm } from "@/components/wallet/XpConvertForm";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Миний хэтэвч" };

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await getWalletSummary();

  if ("error" in result) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
        <div className="w-14 h-14 mx-auto mb-3 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-sm font-semibold text-foreground">{result.error}</p>
      </div>
    );
  }

  const { xp, walletBalance, xpCreditsEarned, remainingCap, maxConvertibleXp, canConvert, recentCredits } = result;

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">Миний хэтэвч</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          XP болон кредит тус тусдаа байна. 1000 XP → $1 кредит (нийт $100 хязгаар).
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="fill-yellow-300 text-yellow-300" />
            <span className="text-violet-100 text-sm font-medium">Туршлагын оноо (XP)</span>
          </div>
          <p className="text-3xl font-black">{xp.toLocaleString()}</p>
          <p className="text-violet-200 text-xs mt-1">
            {maxConvertibleXp > 0
              ? `${maxConvertibleXp.toLocaleString()} XP хөрвүүлэх боломжтой`
              : "Хөрвүүлэх XP хүрэлцэхгүй"}
          </p>
        </div>

        <div className="rounded-2xl p-5 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} className="text-emerald-100" />
            <span className="text-emerald-100 text-sm font-medium">Хэтэвчний үлдэгдэл</span>
          </div>
          <p className="text-3xl font-black">${walletBalance}</p>
          <p className="text-emerald-200 text-xs mt-1">
            Нийт хөрвүүлсэн: ${xpCreditsEarned} / $100
          </p>
        </div>
      </div>

      {/* XP cap progress */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-violet-500" />
            <span className="text-sm font-bold text-foreground">XP хөрвүүлэлтийн хязгаар</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">${xpCreditsEarned} / $100</span>
        </div>
        <div className="h-2 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all"
            style={{ width: `${Math.min(parseFloat(xpCreditsEarned), 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Үлдсэн хязгаар: ${remainingCap}</p>
      </div>

      {/* Convert form */}
      {canConvert ? (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground mb-1">XP → Кредит хөрвүүлэх</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Хөрвүүлсэн кредитийг курс, программ худалдан авахад ашиглана.
          </p>
          <XpConvertForm maxXp={maxConvertibleXp} remainingCap={parseFloat(remainingCap)} />
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-2xl p-5 text-center">
          <p className="text-muted-foreground text-sm">
            {parseFloat(remainingCap) <= 0
              ? "XP хөрвүүлэлтийн дээд хязгаарт хүрсэн байна"
              : "Хөрвүүлэхэд хангалттай XP байхгүй байна (хамгийн багадаа 1000 XP)"}
          </p>
        </div>
      )}

      {/* Recent transactions */}
      {recentCredits.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground mb-4">Сүүлийн гүйлгээнүүд</h2>
          <div className="space-y-1">
            {recentCredits.map((credit) => (
              <div key={credit.id}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{credit.description ?? credit.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(credit.createdAt), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +${parseFloat(credit.amount.toString()).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
