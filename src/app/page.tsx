import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import {
  BookOpen, Users, Award,
  ArrowRight, Star, Zap, Globe,
  CheckCircle2, Target, TrendingUp, Building2,
  BadgeCheck, Rocket, ChevronRight, Quote, Brain, Play,
} from "lucide-react";
import { getCourses } from "@/modules/courses/infrastructure/queries";
import { getAdminOverview } from "@/modules/analytics/infrastructure/queries";
import { Navbar } from "@/components/layout/Navbar";
import { HomeTrustSections } from "@/components/landing/HomeTrustSections";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MascotImage, type MascotVariant } from "@/components/brand/MascotImage";
import { auth } from "@/lib/auth";
import { BILLING_TIERS, formatTierPrice } from "@/lib/pricing/billing-plans";

export const revalidate = 60;

const getCachedHomeCourses = unstable_cache(
  () => getCourses({ limit: 6, sortBy: "popular" }).catch(() => null),
  ["home-popular-courses"],
  { revalidate: 120, tags: ["courses:popular"] },
);

const getCachedHomeStats = unstable_cache(
  () =>
    getAdminOverview().catch(() => ({
      totalUsers: 0, activeStudents: 0, totalCourses: 0,
      publishedCourses: 0, totalEnrollments: 0, totalCertificates: 0,
      totalRevenue: 0, newUsersThisMonth: 0,
    })),
  ["home-admin-overview"],
  { revalidate: 300, tags: ["admin:overview"] },
);

export const metadata: Metadata = {
  title: "EduNity — Онлайн Сургалтын Платформ",
  description: "Мэдлэгийг дэлгэрүүл. Ур чадвараа нэмэгдүүл.",
};

const COURSE_MASCOTS: MascotVariant[] = ["book", "laptop", "certificate", "wave", "thinking", "celebrate"];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  const [courseListing, stats] = await Promise.all([
    getCachedHomeCourses(),
    getCachedHomeStats(),
  ]);
  const courses = courseListing?.courses ?? [];
  const catalogUnavailable = courseListing === null;

  const displayCourses = stats.publishedCourses > 0 ? stats.publishedCourses : 8;
  const displayStudents = stats.activeStudents > 0 ? stats.activeStudents : 260;
  const displayCerts = stats.totalCertificates > 0 ? stats.totalCertificates : 45;
  const displayEnrollments = stats.totalEnrollments > 0 ? stats.totalEnrollments : 140;

  return (
    <div className="min-h-screen bg-[#F7F4FF] dark:bg-[#0F0B1A] text-foreground overflow-x-hidden transition-colors duration-200">
      <Navbar />

      {catalogUnavailable && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Course data is unavailable. Check <code className="font-mono text-amber-600 dark:text-amber-200">DATABASE_URL</code> in <code className="font-mono text-amber-600 dark:text-amber-200">.env</code>.
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden bg-[#F7F4FF] dark:bg-[#0F0B1A] pt-14 pb-20">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.055) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -right-28 -top-28 h-[440px] w-[440px] rounded-full bg-violet-300/25 dark:bg-violet-600/18 blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-[320px] w-[320px] rounded-full bg-fuchsia-300/18 dark:bg-fuchsia-900/15 blur-[90px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 h-[200px] w-[500px] rounded-full bg-violet-200/25 dark:bg-violet-900/8 blur-[70px] pointer-events-none -translate-y-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          {/* 2-col layout */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 min-h-[480px]">

            {/* ── Left: text ── */}
            <div className="flex-1 text-center lg:text-left pt-6 lg:pt-0 order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-violet-300/60 bg-white/80 dark:border-violet-500/30 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-sm font-medium mb-7 animate-fade-up backdrop-blur-sm shadow-sm">
                <Zap size={12} className="text-yellow-500 fill-yellow-500" />
                <span>{displayCourses}+ курс нээлттэй байна</span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-badge-pulse" />
              </div>

              {/* Headline */}
              <h1
                className="text-5xl sm:text-6xl lg:text-[72px] font-black leading-[1.05] tracking-tighter mb-6 text-[#111827] dark:text-[#F8FAFC] animate-fade-up"
                style={{ animationDelay: "0.05s" }}
              >
                Мэдлэгийг
                <br />
                <span className="gradient-text-animated">дэлгэрүүл</span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-[#6B7280] dark:text-[#A1A1AA] text-base sm:text-lg max-w-xl mb-10 leading-relaxed animate-fade-up"
                style={{ animationDelay: "0.1s" }}
              >
                Бодит компаниас суралцаж, төсөл хийж, peer review хүлээн авч,
                сертификат аваарай.
              </p>

              {/* CTAs */}
              <div
                className="flex items-center gap-4 flex-wrap justify-center lg:justify-start animate-fade-up"
                style={{ animationDelay: "0.15s" }}
              >
                <Link
                  href="/courses"
                  className="btn-purple-glow inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-colors shadow-[0_8px_24px_rgba(124,58,237,0.32)]"
                >
                  Курс үзэх <ArrowRight size={16} />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-violet-200 dark:border-violet-700/60 text-violet-700 dark:text-violet-300 font-medium rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors bg-white/60 dark:bg-transparent backdrop-blur-sm"
                >
                  Яаж ажилладаг вэ?
                </Link>
              </div>
            </div>

            {/* ── Right: mascot ── */}
            <div
              className="relative flex items-center justify-center flex-shrink-0 order-1 lg:order-2 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              {/* Radial glow behind mascot */}
              <div className="absolute w-[260px] h-[260px] rounded-full bg-violet-400/28 dark:bg-violet-500/20 blur-[72px]" />

              {/* Speech bubble */}
              <div className="absolute -top-8 -left-4 sm:-left-16 lg:-left-24 z-20 w-[172px] rounded-2xl rounded-bl-sm bg-white dark:bg-[#1C142B] px-4 py-3 shadow-[0_8px_28px_rgba(124,58,237,0.16)] border border-[#E9DFFF] dark:border-[#2E2146]">
                <p className="text-[12px] font-bold text-[#111827] dark:text-[#F8FAFC] leading-snug">
                  Өнөөдөр шинэ чадвар суръя
                </p>
                <div className="absolute -bottom-[7px] right-5 h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-white dark:border-t-[#1C142B]" />
              </div>

              <MascotImage
                variant="wave"
                alt="EduNity mascot"
                size={280}
                priority
                className="relative z-10 animate-float"
                imageClassName="drop-shadow-[0_22px_44px_rgba(124,58,237,0.22)]"
              />
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up"
            style={{ animationDelay: "0.28s" }}
          >
            {[
              { value: `${displayCourses}+`, label: "Нийт курс", color: "text-violet-600 dark:text-violet-400", bar: "bg-violet-100 dark:bg-violet-500/15", border: "border-violet-200/80 dark:border-[#2E2146]" },
              { value: `${displayStudents}+`, label: "Идэвхтэй оюутан", color: "text-emerald-600 dark:text-emerald-400", bar: "bg-white dark:bg-[#1C142B]", border: "border-emerald-200/60 dark:border-[#2E2146]" },
              { value: `${displayCerts}+`, label: "Сертификат олгосон", color: "text-amber-600 dark:text-amber-400", bar: "bg-white dark:bg-[#1C142B]", border: "border-amber-200/60 dark:border-[#2E2146]" },
              { value: `${displayEnrollments}+`, label: "Бүртгэл", color: "text-cyan-600 dark:text-cyan-400", bar: "bg-white dark:bg-[#1C142B]", border: "border-cyan-200/60 dark:border-[#2E2146]" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`text-center rounded-2xl p-4 ${stat.bar} border ${stat.border} shadow-sm`}
              >
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section id="about" className="py-28 px-4 bg-white dark:bg-[#151020] relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-500/6 dark:bg-violet-500/4 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <ScrollReveal direction="left">
              <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Бидний тухай</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] mb-5 tracking-tight leading-tight">
                Монголын тэргүүлэх
                <br />
                <span className="gradient-text-animated">онлайн сургалтын</span>
                <br />
                платформ
              </h2>
              <p className="text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed mb-8">
                EduNity бол суралцагч, багш, байгууллагыг нэгдсэн экосистемд нэгтгэсэн
                enterprise-grade онлайн сургалтын платформ юм. Бид чанартай боловсролыг
                хүн бүрт хүртээмжтэй болгохын төлөө ажилладаг.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Target, color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-500/15 border-violet-200/60 dark:border-violet-500/20", text: "Суралцагч бүрд тохирсон, хувийн суралцах зам" },
                  { icon: BadgeCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-200/60 dark:border-emerald-500/20", text: "QR-тэй, баталгаажуулах боломжтой сертификат" },
                  { icon: Building2, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-500/15 border-cyan-200/60 dark:border-cyan-500/20", text: "Байгууллагын тусгай workspace болон тайлан" },
                  { icon: Brain, color: "text-fuchsia-600 dark:text-fuchsia-400", bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15 border-fuchsia-200/60 dark:border-fuchsia-500/20", text: "AI туслагч болон ухаалаг зөвлөмж" },
                  { icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15 border-amber-200/60 dark:border-amber-500/20", text: "Багш нарт орлого олох, аналитик хэрэгсэл" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${item.color} ${item.bg}`}>
                      <item.icon size={15} />
                    </div>
                    <span className="text-sm text-[#111827]/80 dark:text-[#F8FAFC]/80">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium text-sm transition-colors"
                >
                  Курсуудыг харах <ChevronRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            {/* Right: stat cards + mascot */}
            <ScrollReveal direction="right" delay={120}>
              <div className="relative">
                {/* Mascot thinking helper */}
                <div className="absolute -top-14 -right-2 z-10 hidden lg:block">
                  <MascotImage variant="thinking" size={96} className="animate-float" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "2024", label: "Үүсгэн байгуулагдсан", color: "text-violet-600 dark:text-violet-400", border: "border-violet-200/80 dark:border-violet-500/20" },
                    { value: "100%", label: "Монгол контент", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-500/20" },
                    { value: "99.9%", label: "Uptime хангалт", color: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200/60 dark:border-cyan-500/20" },
                    { value: "4.8★", label: "Хэрэглэгчийн үнэлгээ", color: "text-amber-600 dark:text-amber-400", border: "border-amber-200/60 dark:border-amber-500/20" },
                  ].map((stat) => (
                    <div key={stat.value} className={`bg-white dark:bg-[#1C142B] border ${stat.border} rounded-2xl p-6 shadow-sm`}>
                      <div className={`text-4xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-gradient-to-br from-violet-500/12 to-fuchsia-500/8 border border-violet-200/60 dark:border-violet-500/20 rounded-2xl p-6">
                    <p className="text-violet-600 dark:text-violet-300 font-semibold mb-2 flex items-center gap-2 text-sm">
                      <Rocket size={15} /> Манай зорилго
                    </p>
                    <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">
                      Чанартай боловсролыг хүн бүрт хүртээмжтэй болгож, Монголын дижитал хөгжлийг дэмжих.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 bg-[#F7F4FF] dark:bg-[#0F0B1A]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Яагаад EduNity?</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] mb-3 tracking-tight">
              Суралцагч, багш, байгууллагын
              <br />
              <span className="text-[#6B7280] dark:text-[#A1A1AA]">хэрэгцээг нэгтгэсэн платформ</span>
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, color: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400", mascot: "book" as MascotVariant, title: "Чанартай контент", desc: "Мэргэжлийн багш нарын бэлтгэсэн видео, текст, даалгаврууд" },
              { icon: Globe, color: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", mascot: "laptop" as MascotVariant, title: "Уян хатан", desc: "Хаанаас ч, хэзээ ч хичээллэж ахицаа хяна" },
              { icon: Award, color: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400", mascot: "certificate" as MascotVariant, title: "Сертификат", desc: "Курс дүүргэхэд QR-тэй, баталгаажуулах боломжтой PDF сертификат" },
              { icon: Users, color: "bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400", mascot: "wave" as MascotVariant, title: "Хамтын нийгэмлэг", desc: "Peer review, мессеж, хамтарсан суралцах орчин" },
              { icon: TrendingUp, color: "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400", mascot: "fire" as MascotVariant, title: "Тогтмол шинэчлэлт", desc: "Шинэ курс, контент тогтмол нэмэгдэж байдаг" },
              { icon: Zap, color: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400", mascot: "celebrate" as MascotVariant, title: "Хурдтай", desc: "Next.js 15, PostgreSQL, Redis cache дээр найдвартай ажиллана" },
            ].map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 70}>
                <div className="group relative bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl p-6 h-full overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(124,58,237,0.10)] dark:hover:shadow-[0_8px_32px_rgba(167,139,250,0.08)] transition-all duration-200">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-bold text-[#111827] dark:text-[#F8FAFC] mb-2 text-[15px]">{f.title}</h3>
                  <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed pr-10">{f.desc}</p>
                  {/* Mascot bottom-right */}
                  <div className="absolute bottom-2 right-2 opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200">
                    <MascotImage variant={f.mascot} size={52} />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────────────────────── */}
      <section id="roles" className="py-28 px-4 bg-white dark:bg-[#151020] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Хэн ашиглах вэ?</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] mb-4 tracking-tight">
              Та хэн бэ?
            </h2>
            <p className="text-[#6B7280] dark:text-[#A1A1AA] max-w-xl mx-auto">
              Суралцагч, багш эсвэл байгууллага — бүрд тохирсон шийдэл
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                mascot: "book" as MascotVariant,
                borderColor: "border-violet-200/80 dark:border-violet-500/20",
                badgeColor: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/20",
                glowHover: "hover:shadow-[0_12px_40px_rgba(124,58,237,0.10)]",
                label: "Суралцагч",
                title: "Мэргэжлийг эзэм",
                desc: "Хаанаас ч, хэзээ ч хичээллэж, ур чадвараа хөгжүүл",
                features: ["Бүх курс нэвтрэх эрх", "Ахиц хяналт & аналитик", "QR сертификат", "AI зөвлөгч"],
                cta: "Эхлэх →",
                href: "/courses",
                featured: false,
              },
              {
                mascot: "laptop" as MascotVariant,
                borderColor: "border-emerald-200/80 dark:border-emerald-500/20",
                badgeColor: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
                glowHover: "hover:shadow-[0_12px_40px_rgba(52,211,153,0.10)]",
                label: "Багш / Компани",
                title: "Мэдлэгээ дэлгэр",
                desc: "Курс үүсгэж, оюутан бэлтгэж, орлогоо нэмэгдүүл",
                features: ["Хялбар курс бүтээх", "Оюутны удирдлага", "Орлогын тайлан", "Шалгалт & даалгавар"],
                cta: "Эхлэх →",
                href: "/register",
                featured: true,
              },
              {
                mascot: "certificate" as MascotVariant,
                borderColor: "border-cyan-200/80 dark:border-cyan-500/20",
                badgeColor: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-500/20",
                glowHover: "hover:shadow-[0_12px_40px_rgba(34,211,238,0.08)]",
                label: "Байгууллага",
                title: "Ажилтнаа хөгжүүл",
                desc: "Байгууллагынхаа сургалтыг нэгдсэн, хяналттай платформд",
                features: ["Тусгай workspace", "Гишүүн удирдлага", "Сургалтын тайлан", "API интеграци"],
                cta: "Эхлэх →",
                href: "/register",
                featured: false,
              },
            ].map((role, i) => (
              <ScrollReveal key={role.label} delay={i * 100}>
                <div className={`group relative bg-white dark:bg-[#1C142B] border ${role.borderColor} rounded-2xl p-7 h-full flex flex-col ${role.glowHover} transition-all duration-200 hover:-translate-y-1`}>
                  {role.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full shadow-[0_0_14px_rgba(139,92,246,0.4)]">
                        ★ Хамгийн алдартай
                      </span>
                    </div>
                  )}
                  {/* Mascot */}
                  <div className="flex justify-center mb-5">
                    <MascotImage variant={role.mascot} size={88} className="animate-float" />
                  </div>
                  <div className="mb-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium mb-3 ${role.badgeColor}`}>
                      {role.label}
                    </span>
                    <h3 className="text-xl font-black text-[#111827] dark:text-[#F8FAFC] mb-2">{role.title}</h3>
                    <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">{role.desc}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-[#111827]/75 dark:text-[#F8FAFC]/75">
                        <CheckCircle2 size={14} className="text-violet-500 dark:text-violet-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={role.href}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                  >
                    {role.cta}
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR COURSES ─────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <section id="courses" className="py-24 px-4 bg-[#F7F4FF] dark:bg-[#0F0B1A]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-2">Курсууд</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] tracking-tight">Алдартай курсууд</h2>
                  <p className="text-[#6B7280] dark:text-[#A1A1AA] mt-2 text-sm">Хамгийн олон оюутан бүртгүүлсэн</p>
                </div>
                <Link
                  href="/courses"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                >
                  Бүгдийг харах <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course, i) => (
                <ScrollReveal key={course.id} delay={i * 70}>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="group bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl overflow-hidden block h-full hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(124,58,237,0.10)] dark:hover:shadow-[0_8px_32px_rgba(167,139,250,0.08)] transition-all duration-200"
                  >
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-violet-500/15 to-purple-500/20">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MascotImage variant={COURSE_MASCOTS[i % COURSE_MASCOTS.length]} size={90} className="opacity-90" />
                        </div>
                      )}
                      {course.previewVideoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                            <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] line-clamp-2 text-sm leading-snug mb-1">{course.title}</p>
                      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-4">{course.instructor.name}</p>
                      <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-[#A1A1AA] mb-4">
                        <span className="flex items-center gap-1"><Users size={11} /> {course.enrollmentCount}</span>
                        {course.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            {course.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#E9DFFF] dark:border-[#2E2146]">
                        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                          {Number(course.price) === 0 ? "Үнэгүй" : `${Number(course.price).toLocaleString()}₮`}
                        </span>
                        <span className="text-xs text-[#6B7280] dark:text-[#A1A1AA] bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-100 dark:border-violet-500/15">
                          {course.category?.name ?? "Ерөнхий"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal className="text-center mt-10">
              <Link
                href="/courses"
                className="btn-purple-glow inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-colors shadow-[0_8px_24px_rgba(124,58,237,0.3)]"
              >
                Бүх сургалтыг үзэх → <ArrowRight size={15} />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-white dark:bg-[#151020] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Процесс</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] mb-3 tracking-tight">Хэрхэн ажилладаг вэ?</h2>
            <p className="text-[#6B7280] dark:text-[#A1A1AA] mb-14">3 алхамаар суралцаж эхэл</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector */}
            <div className="hidden sm:block absolute top-[52px] left-[calc(16.66%+3rem)] right-[calc(16.66%+3rem)] h-px bg-gradient-to-r from-transparent via-violet-400/35 to-transparent" />

            {[
              { step: "01", title: "Бүртгүүлэх", desc: "Үнэгүй бүртгэл үүсгэж, курс хайж сонирхоорой", mascot: "wave" as MascotVariant },
              { step: "02", title: "Суралцах", desc: "Хүссэн үедээ, хаанаас ч хичээл үзэж суралц", mascot: "book" as MascotVariant },
              { step: "03", title: "Сертификат авах", desc: "Курс дүүргэмэгц автомат сертификат олгогдоно", mascot: "certificate" as MascotVariant },
            ].map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 130} className="flex flex-col items-center">
                <div className="relative mb-5">
                  <div className="w-[104px] h-[104px] rounded-full bg-violet-100 dark:bg-violet-500/15 border-2 border-violet-200/70 dark:border-violet-500/25 flex items-center justify-center overflow-hidden">
                    <MascotImage variant={s.mascot} size={72} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-violet-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                    {s.step.slice(1)}
                  </span>
                </div>
                <h3 className="font-bold text-[#111827] dark:text-[#F8FAFC] mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-[#6B7280] dark:text-[#A1A1AA] max-w-[200px] leading-relaxed">{s.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-[#F7F4FF] dark:bg-[#0F0B1A] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/7 dark:bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Хэрэглэгчид</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] mb-3 tracking-tight">
              Тэдний амжилт —{" "}
              <span className="gradient-text-animated">манай бахархал</span>
            </h2>
            <p className="text-[#6B7280] dark:text-[#A1A1AA] max-w-lg mx-auto">
              Платформоо ашиглаж амжилтанд хүрсэн хүмүүсийн туршлага
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                quote: "EduNity дээр Python курс дүүргэж, 3 сарын дотор ажилдаа шинэ мэдлэгээ ашиглаж эхэлсэн. Сертификат маань ажил хайхад их тус болсон.",
                name: "Б. Дорж",
                role: "Software Developer",
                avatar: "БД",
                color: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-100 dark:bg-violet-500/15",
              },
              {
                quote: "Миний бэлтгэсэн курс 500+ оюутанд хүрч, сургалтын орлого эрс нэмэгдсэн. Платформын хэрэгсэл маань маш хялбар, ухаалаг.",
                name: "Н. Болормаа",
                role: "Мэргэжлийн Багш",
                avatar: "НБ",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-100 dark:bg-emerald-500/15",
              },
              {
                quote: "Байгууллагынхаа 50 ажилтанд online training хийж, бүх ахицыг нэг газраас хянах болсон. EduNity бол бизнест хамгийн сайн шийдэл.",
                name: "Д. Ганхүү",
                role: "HR Manager, TechAcademy",
                avatar: "ДГ",
                color: "text-cyan-600 dark:text-cyan-400",
                bg: "bg-cyan-100 dark:bg-cyan-500/15",
              },
            ].map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <div className="bg-white dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] rounded-2xl p-7 h-full flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(124,58,237,0.08)] transition-all duration-200">
                  <Quote size={24} className="text-violet-400/50 mb-5" />
                  <p className="text-sm text-[#111827]/75 dark:text-[#F8FAFC]/75 leading-relaxed flex-1 mb-6">{t.quote}</p>
                  <div className="flex items-center gap-3 pt-5 border-t border-[#E9DFFF] dark:border-[#2E2146]">
                    <div className={`w-10 h-10 rounded-xl ${t.bg} border border-[#E9DFFF] dark:border-[#2E2146] flex items-center justify-center text-xs font-bold ${t.color}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">{t.name}</p>
                      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={11} className="text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-4 bg-white dark:bg-[#151020] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" />
        <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Үнийн мэдээлэл</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] dark:text-[#F8FAFC] mb-3 tracking-tight">
              Танд тохирсон тарифийн төлөвлөгөө
            </h2>
            <p className="text-[#6B7280] dark:text-[#A1A1AA] max-w-lg mx-auto">Үнэгүйгээс эхлэн enterprise хүртэл</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-5 items-start">
            {BILLING_TIERS.map((tier, i) => {
              const featured = tier.id === "PREMIUM";
              const borderClass =
                tier.id === "PREMIUM"
                  ? "border-violet-400/50 dark:border-violet-500/40"
                  : tier.id === "PRO"
                    ? "border-amber-300/70 dark:border-amber-500/30"
                    : "border-[#E9DFFF] dark:border-[#2E2146]";
              const btnClass = featured
                ? "btn-purple-glow bg-violet-600 hover:bg-violet-500 text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)]"
                : tier.id === "PRO"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_8px_24px_rgba(251,146,60,0.30)]"
                  : "bg-[#F7F4FF] dark:bg-[#1C142B] border border-[#E9DFFF] dark:border-[#2E2146] text-[#111827] dark:text-[#F8FAFC] hover:bg-violet-50 dark:hover:bg-violet-900/20";
              return (
                <ScrollReveal key={tier.id} delay={i * 100}>
                  <div
                    className={`relative bg-white dark:bg-[#1C142B] border ${borderClass} rounded-2xl p-7 flex flex-col ${featured ? "shadow-[0_0_48px_rgba(124,58,237,0.12)] dark:shadow-[0_0_48px_rgba(167,139,250,0.08)]" : ""}`}
                  >
                    {tier.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span
                          className={`px-3 py-1 ${tier.id === "PRO" ? "bg-amber-500" : "bg-violet-600"} text-white text-xs font-bold rounded-full shadow-[0_0_14px_rgba(139,92,246,0.4)]`}
                        >
                          {tier.badge}
                        </span>
                      </div>
                    )}
                    {featured && (
                      <div className="absolute -top-12 right-3">
                        <MascotImage variant="celebrate" size={68} className="animate-float" />
                      </div>
                    )}
                    <div className="mb-6 mt-3">
                      <p className="text-sm font-semibold text-[#6B7280] dark:text-[#A1A1AA] mb-2">
                        {tier.name}
                      </p>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-3xl font-black text-[#111827] dark:text-[#F8FAFC]">
                          {formatTierPrice(tier)}
                        </span>
                        {tier.monthlyPrice > 0 && (
                          <span className="text-sm text-[#6B7280] dark:text-[#A1A1AA]">/сар</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{tier.tagline}</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2.5 text-sm text-[#111827]/75 dark:text-[#F8FAFC]/75"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-violet-500 dark:text-violet-400 flex-shrink-0"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/pricing"
                      className={`inline-flex items-center justify-center gap-2 w-full px-5 py-3 font-semibold rounded-xl transition-colors text-sm ${btnClass}`}
                    >
                      {tier.monthlyPrice === 0 ? "Үнэгүй эхлэх" : `${tier.name} авах`}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal className="text-center mt-10">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium text-sm transition-colors"
            >
              Бүх тарифийн мэдээлэл <ChevronRight size={16} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <HomeTrustSections />

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d0c6e] via-[#4a1295] to-[#2d0c6e] dark:from-[#1a0830] dark:via-[#240d42] dark:to-[#1a0830]" />
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[280px] bg-violet-500/18 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-fuchsia-500/12 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: text + buttons */}
            <ScrollReveal className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
                <Rocket size={12} />
                <span>Өнөөдрөөс эхлэх боломжтой</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                Өнөөдөр эхэл
              </h2>
              <p className="text-white/60 mb-10 text-lg leading-relaxed">
                Шинэ мэдлэг, шинэ боломжийг өнөөдрөөс эхлүүл.
              </p>
              <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                <Link
                  href="/courses"
                  className="btn-purple-glow px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-colors text-[15px] shadow-[0_8px_24px_rgba(124,58,237,0.45)]"
                >
                  Курс үзэх →
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 border border-white/20 text-white font-medium rounded-2xl hover:bg-white/10 transition-colors text-[15px] backdrop-blur-sm"
                >
                  Нэвтрэх
                </Link>
              </div>
            </ScrollReveal>

            {/* Right: mascot-celebrate */}
            <ScrollReveal direction="right" delay={150} className="flex-shrink-0">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-[200px] h-[200px] rounded-full bg-violet-400/22 blur-[55px]" />
                <MascotImage
                  variant="celebrate"
                  size={240}
                  className="relative z-10 animate-float"
                  imageClassName="drop-shadow-[0_20px_40px_rgba(124,58,237,0.35)]"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-[#0F0B1A] border-t border-[#E9DFFF] dark:border-[#2E2146] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.3)]">
                  <BookOpen size={15} className="text-white" />
                </div>
                <span className="text-[#111827] dark:text-[#F8FAFC] font-bold text-lg">EduNity</span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed">
                Монголын тэргүүлэх онлайн сургалтын платформ. Суралцагч, багш, байгууллагад зориулсан.
              </p>
            </div>
            {/* Бүтээгдэхүүн */}
            <div>
              <p className="text-[#111827] dark:text-[#F8FAFC] text-xs font-bold uppercase tracking-widest mb-4">Бүтээгдэхүүн</p>
              <ul className="space-y-2.5">
                {[["Курсууд", "/courses"], ["Үнэ тариф", "/pricing"], ["Нэвтрэх", "/login"], ["Бүртгүүлэх", "/register"]].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Компани */}
            <div>
              <p className="text-[#111827] dark:text-[#F8FAFC] text-xs font-bold uppercase tracking-widest mb-4">Компани</p>
              <ul className="space-y-2.5">
                {[["Бидний тухай", "/about"], ["FAQ", "/faq"], ["Яаж ажилладаг вэ?", "/#how-it-works"], ["Үнэ тариф", "/pricing"]].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Дэмжлэг */}
            <div>
              <p className="text-[#111827] dark:text-[#F8FAFC] text-xs font-bold uppercase tracking-widest mb-4">Дэмжлэг</p>
              <ul className="space-y-2.5">
                {[["Дэмжлэг", "/support"], ["Нууцлал", "/privacy"], ["Үйлчилгээний нөхцөл", "/terms"], ["Нэвтрэх", "/login"]].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E9DFFF] dark:border-[#2E2146] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">
              © {new Date().getFullYear()} EduNity. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">
              Next.js · PostgreSQL · Stripe · Cloudinary
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
