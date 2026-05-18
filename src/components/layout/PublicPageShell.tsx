import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BookOpen } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function PublicPageShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-[#F7F4FF] text-foreground transition-colors dark:bg-[#0F0B1A]">
      <Navbar />
      <header className="border-b border-[#E9DFFF] bg-white/80 backdrop-blur-md dark:border-[#2E2146] dark:bg-[#150F22]/80">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            EduNity
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#111827] dark:text-white sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280] dark:text-[#A1A1AA]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-20">{children}</main>
      <footer className="border-t border-[#E9DFFF] bg-white py-10 dark:border-[#2E2146] dark:bg-[#0F0B1A]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold">EduNity</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#6B7280] dark:text-[#A1A1AA]">
            <Link href="/about" className="hover:text-violet-600">Бидний тухай</Link>
            <Link href="/faq" className="hover:text-violet-600">FAQ</Link>
            <Link href="/terms" className="hover:text-violet-600">Үйлчилгээний нөхцөл</Link>
            <Link href="/privacy" className="hover:text-violet-600">Нууцлал</Link>
            <Link href="/support" className="hover:text-violet-600">Дэмжлэг</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
