import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Building2, Clock, Mail } from "lucide-react";
import { isOrganizationApproved } from "@/lib/organization-approval";

export const metadata: Metadata = { title: "Бүртгэл хүлээгдэж байна" };

interface Props {
  searchParams: Promise<{ registered?: string; email?: string }>;
}

export default async function OrgPendingPage({ searchParams }: Props) {
  const session = await auth();
  const sp = await searchParams;

  if (!session?.user) {
    redirect(`/login${sp.email ? `?email=${encodeURIComponent(sp.email)}` : ""}`);
  }

  if (session.user.role !== "COMPANY") {
    redirect("/dashboard");
  }

  const org =
    session.user.organizationId
      ? await db.organization.findUnique({
          where: { id: session.user.organizationId },
          select: { name: true, isActive: true, settings: true },
        })
      : null;

  if (isOrganizationApproved(org)) {
    redirect("/org");
  }

  const justRegistered = sp.registered === "1";
  const email = sp.email ?? session.user.email ?? "";

  return (
    <div className="mx-auto max-w-lg py-10 animate-fade-up">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <Clock size={28} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Админы зөвшөөрөл хүлээгдэж байна</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {org?.name ? (
            <>
              <strong className="text-foreground">{org.name}</strong> байгууллагын бүртгэлийг админ
              шалгаж байна.
            </>
          ) : (
            "Байгууллагын бүртгэлийг админ шалгаж байна."
          )}
        </p>

        {justRegistered ? (
          <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            Имэйл хаягаа баталгаажуулсны дараа админ зөвшөөрөхөд платформд бүрэн нэвтэрнэ.
          </p>
        ) : null}

        {session.user.status === "PENDING_VERIFICATION" ? (
          <Link
            href="/verify-email"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Mail size={16} />
            Имэйл баталгаажуулах
          </Link>
        ) : (
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 size={14} />
            Зөвшөөрөгдсний дараа автоматаар нээгдэнэ — хуудсыг дахин ачааллана уу.
          </p>
        )}

        {email ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Бүртгэл: <span className="font-medium text-foreground">{email}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
