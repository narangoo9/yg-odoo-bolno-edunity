"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MascotImage } from "@/components/brand/MascotImage";

export function AuthMascotFloat() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="hidden flex-col items-center gap-3 xl:flex"
    >
      {/* Speech bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.7, ease: "backOut" }}
        className="relative max-w-[220px] rounded-2xl rounded-br-sm border border-white/15 bg-white/10 px-4 py-3.5 text-center shadow-[0_8px_32px_rgba(139,92,246,0.3)] backdrop-blur-md"
      >
        <p className="text-[13px] font-bold leading-snug text-white">
          Сайн уу! EduNity-д тавтай морил.
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
          Хичээл үзэж, XP цуглуулж, certificate аваарай.
        </p>
        <Link
          href="/onboarding/welcome"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-[12px] font-bold text-white transition-all hover:bg-white/30"
        >
          Эхлэх →
        </Link>
        {/* bubble tail */}
        <div className="absolute -bottom-[8px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/10" />
      </motion.div>

      {/* Mascot */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="drop-shadow-[0_20px_40px_rgba(139,92,246,0.5)]"
      >
        <MascotImage variant="wave" size={180} priority />
      </motion.div>

      {/* Brag text */}
      <p className="text-center text-[11px] text-violet-300/60">
        Бүртгүүлээд өөрийн сурах замаа эхлүүлээрэй.
      </p>
    </motion.div>
  );
}
