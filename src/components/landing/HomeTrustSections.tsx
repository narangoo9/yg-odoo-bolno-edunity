import Link from "next/link";
import { Award, Building2, CheckCircle2, Quote, Users } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const STEPS = [
  { n: "01", title: "Курс сонгох", text: "Бодит компаниас нийтэлсэн төслийн сургалтыг сонгоно." },
  { n: "02", title: "Суралцах", text: "Видео, даалгавар, төсөл — алхам алхмаар." },
  { n: "03", title: "Peer review", text: "Хамтын үнэлгээгээр илүү сайжир." },
  { n: "04", title: "Сертификат", text: "Амжилттай дуусгаад гэрчилгээ аваарай." },
];

const TESTIMONIALS = [
  { name: "Суралцагч A", role: "Frontend суралцагч", quote: "Төслийн сургалт надад бодит ажлын туршлага өгсөн." },
  { name: "Суралцагч B", role: "Data enthusiast", quote: "Peer review-ээр алдаагаа эрт олж, хурдан сайжирсан." },
  { name: "Компани C", role: "Сургалтын баг", quote: "Манай курсыг EduNity дээр нийтэлж, илүү олон суралцагчтай болсон." },
];

const FAQ_PREVIEW = [
  { q: "Сертификат хэрхэн ажилладаг вэ?", href: "/faq" },
  { q: "Peer review гэж юу вэ?", href: "/faq" },
  { q: "Үнэгүй суралцах уу?", href: "/faq" },
];

export function HomeTrustSections() {
  return (
    <>
      <section className="py-20 px-4 bg-white dark:bg-[#0F0B1A] border-y border-[#E9DFFF] dark:border-[#2E2146]">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">
            Яаж ажилладаг вэ
          </p>
          <h2 className="text-3xl font-black text-[#111827] dark:text-white">
            Суралцах явц — тодорхой, алхам алхмаар
          </h2>
        </div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.n} delay={i * 80}>
              <div className="rounded-2xl border border-[#E9DFFF] dark:border-[#2E2146] bg-[#F7F4FF] dark:bg-[#1C142B] p-5 h-full">
                <span className="text-2xl font-black text-violet-600/40 dark:text-violet-400/40">{step.n}</span>
                <h3 className="mt-2 text-base font-bold text-[#111827] dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">{step.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 rounded-3xl border border-[#E9DFFF] dark:border-[#2E2146] bg-gradient-to-r from-violet-50 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/20 p-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-bold text-violet-700 dark:text-violet-300 mb-4">
              <Building2 size={14} />
              Компани төслийн сургалт
            </div>
            <h2 className="text-2xl font-black text-[#111827] dark:text-white mb-3">
              Бодит компаниас суралцаж, төсөл хий
            </h2>
            <p className="text-[15px] text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">
              Видео л үзэх биш — төсөл, peer review, сертификаттай бүрэн сургалтын туршлага.
            </p>
            <Link href="/companies" className="mt-4 inline-flex text-sm font-bold text-violet-600 hover:underline dark:text-violet-400">
              Компаниуд үзэх →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {[
              { icon: Users, label: "Peer review" },
              { icon: Award, label: "Сертификат" },
              { icon: CheckCircle2, label: "Ахиц хянах" },
              { icon: Building2, label: "Компани курс" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] p-4 text-center">
                <Icon size={20} className="text-violet-600 dark:text-violet-400" />
                <span className="text-[11px] font-bold text-[#374151] dark:text-[#D4D4D8]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white dark:bg-[#0F0B1A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-center text-[#111827] dark:text-white mb-8">
            Суралцагчдын сэтгэгдэл
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="rounded-2xl border border-[#E9DFFF] dark:border-[#2E2146] bg-[#F7F4FF] dark:bg-[#1C142B] p-5 h-full">
                  <Quote size={18} className="text-violet-400 mb-3" />
                  <p className="text-sm text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-bold text-[#111827] dark:text-white">{t.name}</p>
                  <p className="text-xs text-[#6B7280]">{t.role}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 border-t border-[#E9DFFF] dark:border-[#2E2146]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-center text-[#111827] dark:text-white mb-6">Түгээмэл асуулт</h2>
          <div className="space-y-2">
            {FAQ_PREVIEW.map((item) => (
              <Link
                key={item.q}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-[#E9DFFF] dark:border-[#2E2146] bg-white dark:bg-[#1C142B] px-4 py-3 text-sm font-semibold text-[#374151] dark:text-[#E5E5E5] hover:border-violet-300 transition-colors"
              >
                {item.q}
                <span className="text-violet-600">→</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center">
            <Link href="/faq" className="text-sm font-bold text-violet-600 hover:underline dark:text-violet-400">
              Бүх асуулт харах
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
