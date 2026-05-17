"use client";

import { motion, type Variants } from "framer-motion";
import { BookOpen, Award, Trophy } from "lucide-react";
import { MascotImage } from "@/components/brand/MascotImage";
import { DashboardTourWrapper } from "@/components/onboarding/DashboardTourWrapper";

interface HeroBannerProps {
  firstName: string;
  completed: number;
  enrolled: number;
  certificates: number;
}

// Small particles scattered inside the hero
const PARTICLES = [
  { size: 5,  x: "12%", y: "18%", dur: "3.8s", delay: "0s",    color: "#c084fc" },
  { size: 3,  x: "28%", y: "72%", dur: "4.5s", delay: "0.6s",  color: "#a78bfa" },
  { size: 4,  x: "55%", y: "30%", dur: "3.2s", delay: "1.1s",  color: "#e879f9" },
  { size: 3,  x: "72%", y: "62%", dur: "5.1s", delay: "0.3s",  color: "#818cf8" },
  { size: 4,  x: "8%",  y: "55%", dur: "4.2s", delay: "1.8s",  color: "#d8b4fe" },
  { size: 5,  x: "42%", y: "80%", dur: "3.6s", delay: "0.9s",  color: "#f0abfc" },
  { size: 3,  x: "88%", y: "22%", dur: "4.8s", delay: "0.4s",  color: "#c4b5fd" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const itemVariants: Variants = {
  hidden:   { opacity: 0, y: 14 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroBanner({ firstName, completed, enrolled, certificates }: HeroBannerProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl text-white"
      style={{
        background: "linear-gradient(135deg, #2f0f68 0%, #521a97 52%, #7c2fe4 100%)",
        boxShadow: "var(--shadow-4)",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* Animated glow blobs */}
      <div className="animate-glow-a absolute right-[-42px] top-[-54px] h-56 w-56 rounded-full bg-fuchsia-300/22 blur-3xl pointer-events-none" />
      <div className="animate-glow-b absolute bottom-[-74px] right-[10px] h-48 w-48 rounded-full bg-cyan-300/18 blur-3xl pointer-events-none" />
      <div className="animate-glow-c absolute left-[-16px] top-[-8px] h-28 w-28 rounded-full bg-rose-200/16 blur-3xl pointer-events-none" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          aria-hidden="true"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: p.color,
            "--dur": p.dur,
            "--delay": p.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-[184px] px-6 py-5 sm:pr-[230px] md:pr-[370px]"
      >
        <div className="max-w-xl">
          <motion.p
            variants={itemVariants}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100/80"
          >
            Welcome back,
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="mt-1 text-[28px] font-black tracking-tight"
          >
            {firstName}! 👋
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-1 text-[14px] font-medium text-white/88"
          >
            Өнөөдөр 1 хичээл үргэлжлүүлье. Амжилт хүсье!
          </motion.p>

          <motion.div variants={itemVariants} className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: Trophy, value: completed,    label: "Дүүргэсэн"   },
              { icon: BookOpen, value: enrolled,   label: "Бүртгүүлсэн" },
              { icon: Award,  value: certificates, label: "Сертификат"  },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[12px] font-medium backdrop-blur-sm"
              >
                <Icon size={11} className="text-violet-200" />
                <span className="font-bold">{value}</span>
                <span className="text-violet-200">{label}</span>
              </div>
            ))}
            <DashboardTourWrapper />
          </motion.div>
        </div>

        {/* Mascot + speech bubble */}
        <div
          className="pointer-events-none absolute inset-y-0 right-4 hidden w-[352px] md:block"
          aria-hidden="true"
        >
          {/* Speech bubble — fades in after content */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-[170px] top-1/4 z-10 w-[176px] -translate-y-1/2 rounded-2xl rounded-br-sm bg-white px-3.5 py-3 shadow-[0_8px_28px_rgba(49,18,115,0.28)]"
          >
            <p className="text-[13px] font-black leading-snug text-gray-900">Сайн уу!</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
              Өнөөдөр шинэ зүйл сурахад хамгийн сайхан өдөр шүү! 🚀
            </p>
            <div className="absolute -right-[8px] top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[8px] border-y-transparent border-l-white" />
          </motion.div>

          {/* Floating mascot — slower float */}
          <div className="absolute bottom-[-8px] right-1 z-10">
            <MascotImage
              variant="wave"
              alt=""
              size={188}
              priority
              className="animate-float-slow"
              imageClassName="drop-shadow-[0_20px_42px_rgba(9,4,34,0.42)]"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
