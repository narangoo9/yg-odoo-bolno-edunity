import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/index";
import { ChevronLeft, Mail, Calendar, Shield, BookOpen, Award, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user?.name ?? "Хэрэглэгч" };
}

const roleLabels: Record<string, string> = {
  STUDENT: "Оюутан", INSTRUCTOR: "Багш",
  ORG_ADMIN: "Байг. Админ", SUPER_ADMIN: "Супер Админ",
};

export default async function AdminUserDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      organization: true,
      _count: {
        select: {
          enrollments: true, coursesCreated: true, certificates: true,
          payments: true, reviews: true,
        },
      },
      enrollments: {
        take: 5,
        orderBy: { enrolledAt: "desc" },
        include: { course: { select: { title: true, slug: true } } },
      },
      payments: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, currency: true, status: true, createdAt: true },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={14} /> Бүх хэрэглэгч рүү
      </Link>

      {/* Profile header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {user.avatarUrl
              ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
              : user.name[0]
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              <Badge variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "destructive" : "warning"}>
                {user.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
              <Mail size={13} /> {user.email}
              {user.emailVerified && <span className="text-emerald-600 text-xs">✓ баталгаажсан</span>}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield size={11} /> {roleLabels[user.role]}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {formatDate(user.createdAt)}
              </span>
              {user.lastLoginAt && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Сүүлд: {formatDate(user.lastLoginAt)}
                </span>
              )}
            </div>
            {user.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{user.bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Бүртгүүлсэн", value: user._count.enrollments, icon: BookOpen },
          { label: "Үүсгэсэн курс", value: user._count.coursesCreated, icon: BookOpen },
          { label: "Сертификат", value: user._count.certificates, icon: Award },
          { label: "Төлбөр", value: user._count.payments, icon: Calendar },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <s.icon size={16} className="text-muted-foreground/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent enrollments */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Сүүлийн бүртгэл</h3>
          {user.enrollments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Бүртгэл алга</p>
          ) : (
            <div className="space-y-2">
              {user.enrollments.map((enr) => (
                <div key={enr.id} className="flex items-center gap-2 text-sm">
                  <BookOpen size={13} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{enr.course.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(enr.enrolledAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Сүүлийн төлбөр</h3>
          {user.payments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Төлбөр байхгүй</p>
          ) : (
            <div className="space-y-2">
              {user.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-muted-foreground">
                    {Number(p.amount).toLocaleString()} {p.currency}
                  </span>
                  <Badge variant={p.status === "COMPLETED" ? "success" : p.status === "FAILED" ? "destructive" : "secondary"}>
                    {p.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(p.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
