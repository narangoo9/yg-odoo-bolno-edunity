import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardHomeByRole } from "@/lib/dashboard-routes";
import { verifyEmail } from "@/modules/auth/application/actions";
import { VerifyEmailPending } from "./VerifyEmailPending";

export const metadata: Metadata = { title: "Имэйл баталгаажуулалт" };

interface Props {
  searchParams: Promise<{ token?: string; sent?: string; email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, sent, email } = await searchParams;
  const session = await auth();

  // Fully verified user has no reason to be here
  if (session?.user?.status === "ACTIVE") {
    redirect(getDashboardHomeByRole(session.user.role));
  }

  // Authenticated but unverified — show the pending UI (no token needed)
  if (!token && session?.user?.status === "PENDING_VERIFICATION") {
    return (
      <VerifyEmailPending
        userId={session.user.id}
        email={session.user.email ?? ""}
      />
    );
  }

  if (!token) {
    if (sent === "1") {
      return (
        <div className="text-center py-4 animate-fade-up">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="font-bold text-foreground text-lg mb-2">Имэйл илгээгдлээ</h1>
          <p className="text-muted-foreground text-sm mb-2">
            Баталгаажуулах холбоосыг{" "}
            {email ? <span className="font-medium text-muted-foreground">{email}</span> : "таны имэйл рүү"} илгээлээ.
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            Ирсэн имэйл болон spam хавтсаа шалгаад, холбоосоор дарж бүртгэлээ идэвхжүүлнэ үү.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800"
          >
            Нэвтрэх хуудас руу
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center py-4 animate-fade-up">
        <XCircle size={32} className="text-red-500 mx-auto mb-3" />
        <h1 className="font-semibold text-foreground mb-2">Буруу холбоос</h1>
        <p className="text-muted-foreground text-sm mb-4">Баталгаажуулах холбоос олдсонгүй</p>
        <Link href="/login" className="text-sm text-foreground hover:underline">
          ← Нэвтрэх хуудас руу
        </Link>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (result.error) {
    return (
      <div className="text-center py-4 animate-fade-up">
        <XCircle size={32} className="text-red-500 mx-auto mb-3" />
        <h1 className="font-semibold text-foreground mb-2">Амжилтгүй</h1>
        <p className="text-muted-foreground text-sm mb-4">{result.error}</p>
        <Link href="/login" className="text-sm text-foreground hover:underline">
          ← Нэвтрэх хуудас руу
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-4 animate-fade-up">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={32} className="text-emerald-600" />
      </div>
      <h1 className="font-bold text-foreground text-lg mb-2">Имэйл баталгаажлаа!</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Таны имэйл хаяг амжилттай баталгаажлаа. Одоо нэвтрэн орно уу.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800"
      >
        Нэвтрэх
      </Link>
    </div>
  );
}
