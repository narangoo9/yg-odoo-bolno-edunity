import Image from "next/image";
import Link from "next/link";
import { Crown, Sparkles, Gift } from "lucide-react";

export function CoursePremiumBanner() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 55%, #A855F7 100%)" }}
      >
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-24 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-20 rounded-full bg-violet-400/20 blur-2xl" />
        </div>

        {/* Decorative small Gift icon top-right */}
        <div className="absolute top-4 right-6 opacity-20" aria-hidden="true">
          <Gift size={40} className="text-white" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 sm:p-8 pt-8 sm:pt-6">

          {/* Mascot — peeking/celebrate pose */}
          <div className="shrink-0 sm:-mt-6">
            <Image
              src="/assets/mascot/mascot-celebrate.png"
              alt="Premium upgrade"
              width={120}
              height={120}
              className="drop-shadow-2xl select-none animate-float"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Sparkles size={14} className="text-yellow-300" aria-hidden="true" />
              <span className="text-yellow-300 text-[11px] font-bold uppercase tracking-widest">
                Premium
              </span>
            </div>
            <p className="text-xl font-bold text-white leading-snug">
              Premium-д шилжвэл бүх хичээл нээгдэнэ!
            </p>
            <p className="text-sm text-violet-200 mt-1.5 leading-relaxed max-w-md">
              Premium эсвэл Pro-той бол хичээлүүдийг үзэж, ур чадвараа ахиарай.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-violet-700 font-bold rounded-2xl text-sm shadow-lg hover:bg-violet-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-600"
            >
              <Crown size={16} aria-hidden="true" />
              Premium авах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
