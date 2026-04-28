import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { subscriptionPlans } from "@/modules/subscriptions/domain/schemas";
import { Navbar } from "@/components/layout/Navbar";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Үнэ" };

const plans = [
  { key: "FREE", ...subscriptionPlans.FREE, popular: false, cta: "Үнэгүй эхлэх" },
  { key: "STUDENT", ...subscriptionPlans.STUDENT, popular: true, cta: "Эхлэх" },
  { key: "INSTRUCTOR", ...subscriptionPlans.INSTRUCTOR, popular: false, cta: "Багш болох" },
  { key: "ORGANIZATION", ...subscriptionPlans.ORGANIZATION, popular: false, cta: "Холбоо барих" },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-950 via-purple-950 to-[#09090b] text-white py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-500/15 border border-violet-500/30 rounded-full text-xs font-medium text-violet-300 mb-5">
            <Sparkles size={11} className="text-yellow-400" /> Уян хатан үнэ
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight">Өөрт тохирох багцаа сонго</h1>
          <p className="text-muted-foreground">Хэдэн ч үед дээшлүүлэх, доошлуулах боломжтой</p>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-6 transition-all hover:shadow-xl ${
                plan.popular
                  ? "bg-gradient-to-b from-violet-600 to-violet-700 border-violet-500 shadow-[0_8px_40px_rgba(139,92,246,0.35)] scale-105 text-white"
                  : "bg-card border-border hover:border-violet-300 dark:hover:border-violet-700/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-violet-700 text-xs font-black px-3.5 py-1 rounded-full shadow-md">
                  Хамгийн алдартай
                </div>
              )}

              <div className="mb-5">
                <h3 className={`font-bold text-lg mb-1 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black ${plan.popular ? "text-white" : "text-violet-600 dark:text-violet-400"}`}>
                    {plan.price === 0 ? "₮0" : formatCurrency(plan.price, "MNT")}
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-xs ${plan.popular ? "text-violet-200" : "text-muted-foreground"}`}>/сар</span>
                  )}
                </div>
                {"yearlyPrice" in plan && plan.yearlyPrice && (
                  <p className={`text-xs mt-1 ${plan.popular ? "text-violet-200" : "text-emerald-600 dark:text-emerald-400"}`}>
                    Жилээр: {formatCurrency(plan.yearlyPrice, "MNT")} (2 сар үнэгүй)
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 min-h-[160px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className={`shrink-0 mt-0.5 ${plan.popular ? "text-violet-200" : "text-emerald-500 dark:text-emerald-400"}`} />
                    <span className={plan.popular ? "text-violet-100" : "text-muted-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.key === "FREE" ? "/register" : `/subscribe?plan=${plan.key}`}
                className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? "bg-white text-violet-700 hover:bg-violet-50 shadow-md"
                    : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_28px_rgba(139,92,246,0.35)]"
                }`}
              >
                {plan.cta} <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">Түгээмэл асуулт</h2>
        <div className="space-y-3">
          {[
            {
              q: "Хэзээ ч цуцлах уу?",
              a: "Тийм. Та хэдэн ч үед цуцалж болно. Cancel хийсэн ч цаг хугацаа дуусах хүртэл access үргэлжилнэ.",
            },
            {
              q: "Төлбөр буцаах бодлого ямар вэ?",
              a: "30 хоногийн дотор бол 100% буцаан төлнө. Шалгуурын тухай дэлгэрэнгүйг Terms-ээс харна уу.",
            },
            {
              q: "Бүх курс багцад багтах уу?",
              a: "Student, Instructor, Organization багцад бүх курс нээлттэй. Зарим тусгай курс нэмэлт төлбөртэй байж болзошгүй.",
            },
            {
              q: "Багш яаж орлого олох вэ?",
              a: "Instructor багцад өөрийн курс зарах эрхтэй. Борлуулалтын 70% нь танд ноогдоно.",
            },
          ].map((item) => (
            <details key={item.q} className="bg-card rounded-xl border border-border group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                <span className="font-medium text-foreground text-sm">{item.q}</span>
                <span className="text-violet-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
