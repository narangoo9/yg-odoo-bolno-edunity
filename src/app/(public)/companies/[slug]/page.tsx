import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BookOpen, CheckCircle2, Crown, Lock, PlayCircle, Star, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/index";
import { getCompanyBySlug } from "@/lib/company-marketplace";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug).catch(() => null);
  return { title: company ? `${company.name} - EduNity` : "Company not found" };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug).catch(() => null);
  if (!company || company.marketplace.status !== "approved") notFound();

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-violet-700 to-fuchsia-600 text-white">
        {company.marketplace.coverUrl ? (
          <img src={company.marketplace.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/80 via-violet-900/45 to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border border-white/30 bg-white text-2xl font-black text-violet-700 shadow-xl">
                {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" /> : company.name.slice(0, 2)}
              </div>
              <div>
                <Badge variant="info">{company.marketplace.category}</Badge>
                <h1 className="mt-2 text-4xl font-black tracking-tight">{company.name}</h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-violet-100">
              {company.description ?? "Company learning catalog with structured courses, AI support, projects, peer review, and certificates."}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-violet-100">
              <span className="flex items-center gap-2"><BookOpen size={16} /> {company.marketplace.courseCount} courses</span>
              <span className="flex items-center gap-2"><Users size={16} /> {company.marketplace.studentCount} students</span>
              <span className="flex items-center gap-2"><Star size={16} className="fill-amber-400 text-amber-400" /> {company.marketplace.rating.toFixed(1)} rating</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur-md">
            <p className="text-sm font-black">Company access plans</p>
            <div className="mt-4 space-y-3">
              <PlanLine icon={<PlayCircle size={16} />} title="Free" text="First preview lesson + 5 AI credits" />
              <PlanLine icon={<CheckCircle2 size={16} />} title="Standard 9,900₮" text="First 5 lessons or 50% unlock" />
              <PlanLine icon={<Crown size={16} />} title="Pro 19,900₮" text="Full access, peer review, certificate" />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Course packages</p>
              <h2 className="text-2xl font-black text-slate-950">Learn from {company.name}</h2>
            </div>
            <Link href="/student/upgrade" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white hover:bg-violet-500">
              Upgrade
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {company.courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`} className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100">
                <div className="relative h-36 bg-violet-100">
                  {course.coverImage || course.thumbnailUrl ? (
                    <img src={course.coverImage ?? course.thumbnailUrl ?? ""} alt={course.title} className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute left-3 top-3">
                    <Badge variant={course.sourceType === "YOUTUBE" ? "info" : "secondary"}>{course.sourceType === "YOUTUBE" ? "YouTube" : "Course"}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-black text-slate-950">{course.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{course.shortDescription ?? course.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-violet-50 pt-3 text-xs text-slate-500">
                    <span>{course._count.sections || course._count.modules} lessons</span>
                    <span className="inline-flex items-center gap-1 font-black text-violet-700"><Lock size={13} /> Free preview</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                <Award size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Certificate preview</p>
                <p className="text-xs text-slate-500">Unlocked on Pro after progress, tasks, final project, peer review.</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-4 text-center">
              <p className="text-xs font-black text-violet-700">EduNity x {company.name}</p>
              <p className="mt-2 text-lg font-black text-slate-950">Certificate of Completion</p>
              <div className="mx-auto mt-3 grid h-16 w-16 place-items-center rounded-xl bg-white text-[10px] font-bold text-violet-400">QR</div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function PlanLine({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/15 p-3 text-sm">
      <div className="mt-0.5 text-white">{icon}</div>
      <div>
        <p className="font-black text-white">{title}</p>
        <p className="text-xs text-violet-100">{text}</p>
      </div>
    </div>
  );
}
