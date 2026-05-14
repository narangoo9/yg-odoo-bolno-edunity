import Image from "next/image";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

export function CoursePremiumBanner() {
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)" }}
      >
        {/* Subtle glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-6 -left-6 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-20 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-4 px-5 py-4 sm:py-5">
          {/* Mascot — small */}
          <div className="shrink-0 hidden sm:block">
            <Image
              src="/assets/mascot/mascot-celebrate.png"
              alt="Premium upgrade"
              width={72}
              height={72}
              className="drop-shadow-lg select-none"
            />
          </div>

          {/* Text */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
              <Sparkles size={12} className="text-yellow-300" />
              <span className="text-yellow-300 text-[10px] font-bold uppercase tracking-widest">Premium</span>
            </div>
            <p className="text-base font-bold text-white leading-snug">
              Premium-д шилжвэл бүх хичээл нээгдэнэ!
            </p>
            <p className="text-xs text-violet-200 mt-0.5">
              Premium эсвэл Pro-той бол хичээлүүдийг үзэж, ур чадвараа ахиарай.
            </p>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 font-bold rounded-xl text-sm shadow-md hover:bg-violet-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Crown size={14} />
              Premium авах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
