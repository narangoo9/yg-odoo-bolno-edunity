"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check, Crown, Sparkles, BookOpen, Brain, Award, Zap, Trophy, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRICES = {
  PREMIUM: { monthly: 29900, yearly: 299000 },
  PRO:     { monthly: 79900, yearly: 799000 },
};

const COMPARISON = [
  { feature: "Үнэгүй курсууд",          standard: true,         premium: true,         pro: true },
  { feature: "Компанийн бүх курс",       standard: false,        premium: true,         pro: true },
  { feature: "Курс дуусгах сертификат",  standard: true,         premium: true,         pro: true },
  { feature: "Peer grading",             standard: false,        premium: true,         pro: true },
  { feature: "Ахиц дэвшлийн аналитик",  standard: "Үндсэн",     premium: "Дэвшилтэт",  pro: "Бүрэн" },
  { feature: "AI туслах",               standard: false,        premium: "Beta",        pro: true },
  { feature: "Амьд mentor хичээл",      standard: false,        premium: false,         pro: true },
  { feature: "Хадгалах сан",            standard: "5 GB",       premium: "20 GB",       pro: "100 GB" },
  { feature: "Дэмжлэг",                 standard: "Нийгэмлэг",  premium: "Тэргүүлэх",  pro: "Хувийн" },
];

const WHY_FEATURES = [
  { icon: BookOpen, title: "Илүү олон курс",  desc: "Компанийн бүх хаалттай хичээлүүдэд нэвтэрч, мэдлэгээ өргөжүүл." },
  { icon: Brain,    title: "AI туслах",        desc: "Хичээл сонгох, асуулт тавих, судалгаа хийхэд AI тань туслана." },
  { icon: Award,    title: "Сертификат",       desc: "EduNity болон байгууллагын баталгаажсан сертификат авна." },
  { icon: Zap,      title: "XP хурдан өснө",  desc: "Premium хэрэглэгчид 2× XP авч, тэргүүний байранд гарна." },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)  return <Check size={14} className="text-emerald-500 mx-auto" aria-label="Тийм" />;
  if (value === false) return <span className="text-slate-300 text-lg block text-center leading-none" aria-label="Үгүй">—</span>;
  return <span className="text-[11px] font-semibold text-slate-700 text-center block">{value}</span>;
}

export function UpgradeClient({ currentPlan }: { currentPlan: string }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<"PREMIUM" | "PRO" | null>(null);

  const isCurrent = (planId: string) =>
    planId === currentPlan || (currentPlan === "FREE" && planId === "STANDARD");

  async function handleUpgrade(plan: "PREMIUM" | "PRO") {
    if (loading) return;
    setLoading(plan);
    try {
      const res = await fetch("/api/v1/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
        setLoading(null);
      }
    } catch {
      alert("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
      setLoading(null);
    }
  }

  const premiumPrice = PRICES.PREMIUM[billing];
  const proPrice     = PRICES.PRO[billing];

  return (
    <>
      <style>{`
        @keyframes upg-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes upg-card-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes upg-glow-pulse {
          0%,100% { opacity: .5; }
          50%      { opacity: .9; }
        }
        .upg-float { animation: upg-float 3.5s ease-in-out infinite; }
        .upg-card  { animation: upg-card-in .45s ease both; }
        .upg-card:nth-child(2) { animation-delay: .08s; }
        .upg-card:nth-child(3) { animation-delay: .16s; }
        .upg-glow-pulse { animation: upg-glow-pulse 2.5s ease-in-out infinite; }
        .upg-row:hover { background: rgba(124,58,237,.05); }
        @media (prefers-reduced-motion: reduce) {
          .upg-float, .upg-card, .upg-glow-pulse {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="max-w-5xl space-y-10">

        {/* ── HERO ── */}
        <div
          className="relative rounded-3xl overflow-hidden text-center py-10 px-6"
          style={{ background: "linear-gradient(135deg,#160B3A 0%,#3B1A9B 50%,#7C3AED 100%)" }}
        >
          {/* Background glow blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-14 -left-14 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl upg-glow-pulse" />
            <div className="absolute bottom-0 right-0 w-52 h-52 rounded-full bg-purple-400/15 blur-3xl upg-glow-pulse"
              style={{ animationDelay: "1.2s" }} />
          </div>

          {/* Mascot laptop + speech bubble */}
          <div className="relative inline-block mb-4" aria-hidden="true">
            <Image
              src="/assets/mascot/mascot-laptop.png"
              alt=""
              width={100}
              height={100}
              className="upg-float drop-shadow-2xl select-none"
            />
            <div className="absolute -top-1 -right-28 bg-white rounded-2xl rounded-bl-none px-3 py-1.5 shadow-lg whitespace-nowrap">
              <p className="text-[11px] font-bold text-violet-700">Premium авбал илүү хурдан ахина! 🔥</p>
            </div>
          </div>

          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-bold text-yellow-300 uppercase tracking-widest mb-1">
              <Sparkles size={11} aria-hidden="true" />
              Upgrade Your Learning
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Choose Your Plan
            </h1>
            <p className="text-sm text-violet-200 max-w-sm mx-auto leading-relaxed">
              Бүх хичээлийг нээж, AI туслахтай мэдлэгээ хурдан өргөжүүл. Нуугдмал хураамжгүй.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="relative flex justify-center mt-6">
            <div className="flex items-center gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-2xl">
              {(["monthly", "yearly"] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={cn(
                    "px-5 py-2 min-h-[44px] rounded-xl text-[12px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-800",
                    billing === b
                      ? "bg-white text-violet-700 shadow-md"
                      : "text-violet-200 hover:text-white"
                  )}
                >
                  {b === "monthly" ? "Сарын" : "Жилийн"}
                  {b === "yearly" && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-md">
                      -17%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── PLAN CARDS ── */}
        <div className="grid lg:grid-cols-3 gap-5 items-start">

          {/* Standard (Free) */}
          <div className="upg-card relative rounded-2xl border-2 border-slate-200 bg-white p-6 flex flex-col gap-5">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <BookOpen size={18} className="text-slate-500" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Standard</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Үнэгүй хичээлээр эхлэх</p>
            </div>

            <div>
              <span className="text-3xl font-black text-slate-800">Үнэгүй</span>
            </div>

            <button
              disabled
              className="w-full py-3 min-h-[44px] rounded-xl text-[13px] font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              {isCurrent("STANDARD") ? "Одоогийн тариф ✓" : "Standard"}
            </button>

            <ul className="space-y-2 flex-1">
              {[
                "Үнэгүй курсууд",
                "Үндсэн ахиц хянах",
                "Нийгэмлэгийн чат",
                "Курс дуусгах сертификат",
                "Leaderboard оролцоо",
                "5 GB тэмдэглэл хадгалах",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={9} className="text-slate-500" />
                  </div>
                  <span className="text-[12px] text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div
            className="upg-card relative rounded-2xl border-2 border-violet-400 p-6 flex flex-col gap-5 scale-[1.03] shadow-xl shadow-violet-200/60"
            style={{ background: "linear-gradient(160deg,#F5F3FF 0%,#EDE9FE 60%,#fff 100%)" }}
          >
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none upg-glow-pulse"
              style={{ boxShadow: "0 0 32px 4px rgba(124,58,237,.18)" }}
              aria-hidden="true"
            />
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 text-white text-[10px] font-black rounded-full shadow-md whitespace-nowrap">
              Most Popular
            </div>
            {/* Mascot book watermark */}
            <div className="absolute bottom-4 right-4 opacity-[0.12] pointer-events-none select-none" aria-hidden="true">
              <Image src="/assets/mascot/mascot-book.png" alt="" width={64} height={64} />
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
                <Crown size={18} className="text-violet-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-violet-900">Premium</h3>
              <p className="text-[12px] text-violet-500 mt-0.5">Бүх компанийн хичээл + AI туслах</p>
            </div>

            <div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-violet-900">₮{premiumPrice.toLocaleString()}</span>
                <span className="text-xs text-violet-400 mb-1">/{billing === "monthly" ? "сар" : "жил"}</span>
              </div>
              {billing === "yearly" && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  Жилд ₮{(PRICES.PREMIUM.monthly * 12 - PRICES.PREMIUM.yearly).toLocaleString()} хэмнэнэ
                </p>
              )}
            </div>

            <button
              onClick={() => handleUpgrade("PREMIUM")}
              disabled={!!loading || isCurrent("PREMIUM")}
              className={cn(
                "relative w-full py-3 min-h-[44px] rounded-xl text-[13px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2",
                isCurrent("PREMIUM")
                  ? "bg-violet-100 text-violet-400 cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-300/50 active:scale-[.98]"
              )}
            >
              {loading === "PREMIUM" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Ачааллаж байна...
                </span>
              ) : isCurrent("PREMIUM") ? "Одоогийн тариф ✓" : "Premium авах →"}
            </button>

            <ul className="space-y-2 flex-1">
              {[
                "Standard бүгдийг",
                "Бүх компанийн курс",
                "Тэргүүлэх дэмжлэг",
                "Peer grading & review",
                "Дэвшилтэт аналитик",
                "Материал татаж авах",
                "20 GB тэмдэглэл хадгалах",
                "AI туслах (Beta)",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={9} className="text-violet-600" />
                  </div>
                  <span className="text-[12px] text-violet-800">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="upg-card relative rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-6 flex flex-col gap-5">
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-md whitespace-nowrap">
              Best Value
            </div>
            {/* Mascot fire watermark */}
            <div className="absolute bottom-4 right-4 opacity-[0.12] pointer-events-none select-none" aria-hidden="true">
              <Image src="/assets/mascot/mascot-fire.png" alt="" width={64} height={64} />
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
                <Sparkles size={18} className="text-amber-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-amber-900">Pro</h3>
              <p className="text-[12px] text-amber-500 mt-0.5">Хязгааргүй хандалт + Mentor хичээл</p>
            </div>

            <div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-amber-900">₮{proPrice.toLocaleString()}</span>
                <span className="text-xs text-amber-400 mb-1">/{billing === "monthly" ? "сар" : "жил"}</span>
              </div>
              {billing === "yearly" && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  Жилд ₮{(PRICES.PRO.monthly * 12 - PRICES.PRO.yearly).toLocaleString()} хэмнэнэ
                </p>
              )}
            </div>

            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={!!loading || isCurrent("PRO")}
              className={cn(
                "w-full py-3 min-h-[44px] rounded-xl text-[13px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
                isCurrent("PRO")
                  ? "bg-amber-100 text-amber-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-amber-200/60 active:scale-[.98]"
              )}
            >
              {loading === "PRO" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Ачааллаж байна...
                </span>
              ) : isCurrent("PRO") ? "Одоогийн тариф ✓" : "Pro авах →"}
            </button>

            <ul className="space-y-2 flex-1">
              {[
                "Premium бүгдийг",
                "Хязгааргүй курс хандалт",
                "Амьд 1:1 mentor хичээл",
                "Карьерын зөвлөгөө & CV шалгалт",
                "Хувийн судалгааны бүлэг",
                "100 GB хадгалах сан",
                "Хамтарсан сертификат",
                "Шинэ курст эрт хандах",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={9} className="text-amber-600" />
                  </div>
                  <span className="text-[12px] text-amber-800">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── WHY PREMIUM ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="shrink-0" aria-hidden="true">
              <Image
                src="/assets/mascot/mascot-thinking.png"
                alt=""
                width={64}
                height={64}
                className="select-none"
              />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Яагаад Premium авах вэ?</h2>
              <p className="text-sm text-slate-500">Upgrade хийснээр олж авах давуу тал</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-violet-200 hover:shadow-md transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center mb-3 transition-colors">
                  <Icon size={18} className="text-violet-600" aria-hidden="true" />
                </div>
                <p className="text-[13px] font-bold text-slate-800 mb-1">{title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPARISON TABLE ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-black text-slate-900">Бүрэн харьцуулалт</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">
                    Онцлог
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Standard
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-violet-600 uppercase tracking-wider text-center">
                    Premium
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-amber-600 uppercase tracking-wider text-center">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-slate-50 upg-row transition-colors",
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    )}
                  >
                    <td className="px-6 py-3.5 text-[12px] font-medium text-slate-700">{row.feature}</td>
                    <td className="px-4 py-3.5"><FeatureValue value={row.standard} /></td>
                    <td className="px-4 py-3.5"><FeatureValue value={row.premium} /></td>
                    <td className="px-4 py-3.5"><FeatureValue value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── BOTTOM CTA BANNER ── */}
        <div
          className="relative rounded-3xl overflow-hidden py-10 px-8 text-center"
          style={{ background: "linear-gradient(135deg,#5B21B6 0%,#7C3AED 55%,#A855F7 100%)" }}
        >
          {/* Blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-16 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
          </div>

          {/* Mascot celebrate */}
          <div className="relative mb-4" aria-hidden="true">
            <Image
              src="/assets/mascot/mascot-celebrate.png"
              alt=""
              width={80}
              height={80}
              className="mx-auto upg-float drop-shadow-xl select-none"
            />
          </div>

          <div className="relative space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Trophy size={18} className="text-yellow-300" aria-hidden="true" />
              <p className="text-white font-black text-xl">Өнөөдөр эхлэх цаг болсон!</p>
            </div>
            <p className="text-violet-200 text-sm max-w-xs mx-auto">
              Premium эсвэл Pro-д шилжиж, хязгааргүй мэдлэгийн замд ор.
            </p>
            <button
              onClick={() => handleUpgrade("PREMIUM")}
              disabled={!!loading}
              className="inline-flex items-center gap-2 px-8 py-3.5 min-h-[44px] bg-white text-violet-700 font-black rounded-2xl text-sm shadow-lg hover:bg-violet-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-600 active:scale-[.98]"
            >
              {loading === "PREMIUM" ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Ачааллаж байна...
                </>
              ) : (
                <>
                  <Crown size={15} aria-hidden="true" />
                  Upgrade Now →
                </>
              )}
            </button>
            <p className="text-violet-300 text-[11px] pt-1">
              Хэдийд ч цуцлах боломжтой · Аюулгүй төлбөр · 7 хоногийн мөнгө буцаалт
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
