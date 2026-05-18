import type { Metadata } from "next";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { SupportContactForm } from "@/components/layout/SupportContactForm";

export const metadata: Metadata = { title: "Дэмжлэг — EduNity" };

const CATEGORIES = [
  { title: "Бүртгэл", desc: "Нэвтрэх, имэйл баталгаажуулалт, нууц үг" },
  { title: "Төлбөр", desc: "Subscription, нэхэмжлэл, буцаалт" },
  { title: "Сургалт", desc: "Курс, хичээл, сертификат, peer review" },
  { title: "Техник", desc: "Видео, chat, платформын алдаа" },
];

export default function SupportPage() {
  return (
    <PublicPageShell
      title="Дэмжлэг"
      subtitle="Асуултаа илгээнэ үү — ихэвчлэн 24–48 цагийн дотор хариулна."
    >
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.title}
            className="rounded-2xl border border-[#E9DFFF] bg-white p-4 dark:border-[#2E2146] dark:bg-[#1C142B]"
          >
            <p className="text-sm font-bold text-[#111827] dark:text-white">{cat.title}</p>
            <p className="mt-1 text-[13px] text-[#6B7280] dark:text-[#A1A1AA]">{cat.desc}</p>
          </div>
        ))}
      </div>

      <p className="mb-4 text-sm text-[#6B7280] dark:text-[#A1A1AA]">
        Имэйл:{" "}
        <a href="mailto:support@edunity.mn" className="font-semibold text-violet-600 dark:text-violet-400">
          support@edunity.mn
        </a>
      </p>

      <SupportContactForm />
    </PublicPageShell>
  );
}
