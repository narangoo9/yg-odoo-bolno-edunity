"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, Mail } from "lucide-react";
import { resendVerificationEmail } from "@/modules/auth/application/actions";

interface Props {
  userId: string;
  email: string;
}

export function VerifyEmailPending({ userId, email }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const result = await resendVerificationEmail(userId);
      if (result.success) {
        setStatus("success");
        setMessage("Баталгаажуулах имэйл дахин илгээгдлээ.");
      } else {
        setStatus("error");
        setMessage(result.error ?? "Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
      }
    } catch {
      setStatus("error");
      setMessage("Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="text-center py-4 animate-fade-up">
      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={32} className="text-violet-600" />
      </div>

      <h1 className="font-bold text-foreground text-lg mb-2">
        Имэйлээ баталгаажуулна уу
      </h1>
      <p className="text-muted-foreground text-sm mb-1">
        Бид таны имэйл рүү баталгаажуулах холбоос илгээсэн. Холбоос дээр дарсны дараа та
        платформоо үргэлжлүүлэн ашиглах боломжтой.
      </p>
      <p className="text-muted-foreground text-sm mb-6">
        Илгээсэн имэйл:{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      {message && (
        <div
          className={
            "mb-4 rounded-xl border px-4 py-2.5 text-sm " +
            (status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400")
          }
        >
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Илгээж байна...
            </>
          ) : (
            "Имэйл дахин илгээх"
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
        >
          Гарах
        </button>
      </div>
    </div>
  );
}
