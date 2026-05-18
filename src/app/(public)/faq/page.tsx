import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/layout/PublicPageShell";

export const metadata: Metadata = { title: "Түгээмэл асуулт — EduNity" };

const FAQ_ITEMS = [
  {
    q: "Сертификат хэрхэн ажилладаг вэ?",
    a: "Бүх хичээл, даалгавар, эцсийн төсөл болон peer review-ийг амжилттай биелүүлсний дараа сертификат олгогдоно. Таны dashboard дээр шаардлагын явцыг харах боломжтой.",
  },
  {
    q: "Сертификатыг татаж авах уу?",
    a: "Тийм. Олгогдсон сертификатыг PDF хэлбэрээр татаж авах, хуваалцах боломжтой.",
  },
  {
    q: "Peer review гэж юу вэ?",
    a: "Бусад суралцагч таны төслийг үнэлж, санал өгнө. Та мөн бусдын ажлыг үнэлж, харилцан суралцана.",
  },
  {
    q: "Үнэгүй суралцах боломжтой юу?",
    a: "Зарим курс үнэгүй эхлэх боломжтой. Нэмэлт контент, premium курсууд subscription-оор нээгдэнэ.",
  },
  {
    q: "Subscription хэрхэн ажилладаг вэ?",
    a: "Сарын эсвэл жилийн төлөвлөгөө сонгож, илүү олон курс, premium контентод хандах эрх авна.",
  },
  {
    q: "Компани курс үүсгэж болох уу?",
    a: "Тийм. Байгууллага бүртгүүлж, өөрийн баг, курс, төсөл, peer review процессыг удирдана.",
  },
  {
    q: "Ахицыг хэрхэн хянах вэ?",
    a: "Dashboard дээр хичээлийн ахиц, сертификатын бэлэн байдал, дараагийн алхмуудыг тодорхой харна.",
  },
];

export default function FaqPage() {
  return (
    <PublicPageShell
      title="Түгээмэл асуулт"
      subtitle="Сертификат, peer review, subscription болон суралцах явцын талаар."
    >
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-[#E9DFFF] bg-white p-4 dark:border-[#2E2146] dark:bg-[#1C142B]"
          >
            <summary className="cursor-pointer list-none text-[15px] font-bold text-[#111827] dark:text-white [&::-webkit-details-marker]:hidden">
              {item.q}
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280] dark:text-[#A1A1AA]">
              {item.a}
            </p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-[#6B7280] dark:text-[#A1A1AA]">
        Асуулт үлдсэн үү?{" "}
        <Link href="/support" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
          Дэмжлэгтэй холбогдох
        </Link>
      </p>
    </PublicPageShell>
  );
}
