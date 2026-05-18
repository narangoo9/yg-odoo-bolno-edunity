import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { MascotImage } from "@/components/brand/MascotImage";
import { DangerZone } from "@/components/forms/DangerZone";
import { StudentCertificatesSection } from "@/components/student/StudentCertificatesSection";
import { SubscriptionSection } from "@/components/student/SubscriptionSection";
import { getStudentCertificates } from "@/modules/certificates/infrastructure/certificate-service";
import { getInitials } from "@/lib/utils";
import {
  User, Shield, CheckCircle, AlertTriangle,
  Brain,
} from "lucide-react";

export const metadata: Metadata = { title: "Тохиргоо — EduNity" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, certificates, subscription] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        bio: true, role: true, createdAt: true, emailVerified: true,
        xp: true, level: true,
      },
    }).catch(() => null),
    getStudentCertificates(session.user.id).catch(
      () => [] as Awaited<ReturnType<typeof getStudentCertificates>>,
    ),
    db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true, currentPeriodEnd: true },
    }).catch(() => null),
  ]);
  if (!user) redirect("/login");

  const xpInLevel   = user.xp % 150;
  const xpPct       = Math.min(100, Math.round((xpInLevel / 150) * 100));
  const role = user.role as string;
  const roleLabel = role === "SUPER_ADMIN" ? "Super admin" : role === "COMPANY" ? "Company" : "User";

  return (
    <div className="max-w-3xl space-y-5 animate-fade-up pb-10">

      {/* ── PROFILE HERO CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E9DFFF] bg-gradient-to-r from-[#EDE9FE] via-[#F7F4FF] to-white p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-[#EDE9FE] flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[22px] font-black text-[#7C3AED]">
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          {/* Name + email + level */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-[20px] font-black text-[#111827] truncate">{user.name}</h1>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[11px] font-bold text-[#7C3AED]">
                Lv.{user.level}
              </span>
            </div>
            <p className="text-[12px] text-[#6B7280] mb-3">{user.email}</p>

            {/* XP bar */}
            <div className="flex items-center gap-2">
              <Brain size={12} className="text-[#7C3AED] shrink-0" />
              <div className="flex-1 h-2 bg-[#EDE9FE] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-500"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#7C3AED] shrink-0">
                {user.xp.toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* Mascot + speech bubble */}
          <div className="relative shrink-0 hidden sm:block">
            <div className="relative">
              {/* Speech bubble */}
              <div className="absolute -top-10 -left-28 w-48 bg-white rounded-2xl border border-[#E9DFFF] px-3 py-2 shadow-md">
                <p className="text-[11px] text-[#111827] font-medium leading-tight">
                  Профайлаа бүрэн болговол XP авна!
                </p>
                <div className="absolute -bottom-2 right-8 w-3 h-3 bg-white border-r border-b border-[#E9DFFF] rotate-45" />
              </div>
              <MascotImage
                variant="wave"
                size={80}
                priority
                className="animate-float drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE SECTION ── */}
      <section
        className="rounded-2xl border border-[#E9DFFF] bg-white p-6"
        style={{ boxShadow: "var(--shadow-1)" }}
      >
        <div className="flex items-center justify-between gap-2.5 mb-5 pb-4 border-b border-[#E9DFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <User size={16} className="text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="font-black text-[#111827]">Профайл</h2>
              <p className="text-[11px] text-[#6B7280]">Нэр, зураг, танилцуулга</p>
            </div>
          </div>
          <MascotImage variant="book" size={36} imageClassName="opacity-70" />
        </div>
        <ProfileForm
          user={{
            id: user.id, name: user.name, email: user.email,
            avatarUrl: user.avatarUrl, bio: user.bio,
          }}
        />
      </section>

      {/* ── SECURITY SECTION ── */}
      <section
        className="rounded-2xl border border-[#E9DFFF] bg-white p-6"
        style={{ boxShadow: "var(--shadow-1)" }}
      >
        <div className="flex items-center justify-between gap-2.5 mb-5 pb-4 border-b border-[#E9DFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-black text-[#111827]">Аюулгүй байдал</h2>
              <p className="text-[11px] text-[#6B7280]">Имэйл баталгаажилт, нууцлал</p>
            </div>
          </div>
          <MascotImage variant="thinking" size={36} imageClassName="opacity-70" />
        </div>

        <div className="rounded-xl border border-[#E9DFFF] bg-[#F7F4FF] divide-y divide-[#E9DFFF] overflow-hidden">
          <InfoRow
            label="Имэйл баталгаажсан"
            value={user.emailVerified ? "Тийм ✓" : "Үгүй"}
            status={user.emailVerified ? "success" : "warning"}
          />
          <InfoRow
            label="Бүртгүүлсэн огноо"
            value={user.createdAt.toLocaleDateString("mn-MN")}
          />
          <InfoRow
            label="Хэрэглэгчийн төрөл"
            value={roleLabel}
          />
        </div>
      </section>

      {/* ── SUBSCRIPTION ── */}
      <SubscriptionSection subscription={subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null} />

      {/* ── CERTIFICATES ── */}
      <StudentCertificatesSection certificates={certificates} />

      {/* ── DANGER ZONE ── */}
      <section
        className="rounded-2xl border border-red-100 bg-white p-6"
        style={{ boxShadow: "var(--shadow-1)" }}
      >
        <div className="flex items-center justify-between gap-2.5 mb-5 pb-4 border-b border-red-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-black text-red-600">Анхаарах бүс</h2>
              <p className="text-[11px] text-red-400">Энэ үйлдэл буцаах боломжгүй ⚠️</p>
            </div>
          </div>
          <MascotImage variant="thinking" size={36} imageClassName="opacity-50" />
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
          <DangerZone />
        </div>
      </section>
    </div>
  );
}

// ── INFO ROW COMPONENT ─────────────────────────────────────────────────────────
function InfoRow({
  label, value, status,
}: {
  label: string;
  value: string;
  status?: "success" | "warning";
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      <div className="flex items-center gap-1.5">
        {status === "success" && (
          <CheckCircle size={13} className="text-emerald-500 shrink-0" />
        )}
        {status === "warning" && (
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
        )}
        <span className={`text-[13px] font-semibold ${
          status === "success" ? "text-emerald-600"
          : status === "warning" ? "text-amber-600"
          : "text-[#111827]"
        }`}>
          {value}
        </span>
      </div>
    </div>
  );
}
