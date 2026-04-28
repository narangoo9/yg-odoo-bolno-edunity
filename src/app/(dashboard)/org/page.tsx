import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, BookOpen, TrendingUp, Award, Building2, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Байгууллагын самбар" };

export default async function OrgDashboardPage() {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/40">
        <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
          <Building2 size={24} className="text-violet-500" />
        </div>
        <p className="text-sm font-semibold text-foreground">Байгууллага тохируулаагүй байна</p>
        <p className="text-xs text-muted-foreground mt-1">Эхлээд байгууллага үүсгэнэ үү</p>
      </div>
    );
  }

  const [organization, members, courses, enrollments, certificates] = await Promise.all([
    db.organization.findUnique({ where: { id: orgId } }).catch(() => null),
    db.user.count({ where: { organizationId: orgId } }).catch(() => 0),
    db.course.count({ where: { organizationId: orgId } }).catch(() => 0),
    db.enrollment.count({ where: { course: { organizationId: orgId } } }).catch(() => 0),
    db.certificate.count({ where: { course: { organizationId: orgId } } }).catch(() => 0),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "Админ";

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">

      {/* ── BANNER ── */}
      <div className="relative rounded-2xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #1a0a4a 0%, #312e81 40%, #1e1b4b 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-400/15 rounded-full blur-3xl" />

        <div className="relative px-7 py-6 flex items-start justify-between">
          <div>
            <p className="text-indigo-300 text-sm font-medium mb-1">Сайн байна уу, {firstName}</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
              {organization?.name ?? "Байгууллага"}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm">
                <Zap size={13} className="fill-yellow-300 text-yellow-300" />
                <span className="font-bold capitalize">{organization?.plan ?? "Free"}</span>
                <span className="text-indigo-200 text-xs">багц</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:block opacity-[0.12] pointer-events-none">
            <Building2 size={90} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Гишүүд",    value: members,      icon: Users,      c: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400" },
          { label: "Курсууд",   value: courses,      icon: BookOpen,   c: "bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400" },
          { label: "Бүртгэл",   value: enrollments,  icon: TrendingUp, c: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
          { label: "Сертификат", value: certificates, icon: Award,      c: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
        ].map(s => (
          <div key={s.label}
            className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${s.c}`}>
                <s.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
