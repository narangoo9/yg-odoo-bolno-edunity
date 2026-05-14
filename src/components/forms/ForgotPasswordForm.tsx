"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema, resetPasswordSchema } from "@/modules/auth/domain/schemas";
import { forgotPassword, resetPassword } from "@/modules/auth/application/actions";
import type { ForgotPasswordInput, ResetPasswordInput } from "@/modules/auth/domain/schemas";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const AUTH_BTN =
  "w-full py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all " +
  "bg-gradient-to-r from-violet-600 to-purple-600 " +
  "shadow-[0_4px_20px_rgba(124,58,237,0.35)] " +
  "hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_4px_26px_rgba(124,58,237,0.45)] " +
  "active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed";

const INPUT_CLS =
  "w-full rounded-xl border border-purple-100 bg-violet-50/60 px-3 py-3 text-[13px] " +
  "text-gray-900 placeholder:text-gray-400 outline-none transition-all " +
  "focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 focus:bg-white " +
  "dark:bg-violet-900/20 dark:text-white dark:border-violet-800/40 dark:placeholder:text-gray-500 " +
  "dark:focus:bg-violet-900/30 dark:focus:border-violet-500";

const LABEL_CLS = "text-[12px] font-semibold text-gray-700 dark:text-gray-300";

// ── Forgot password ───────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await forgotPassword(data);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="animate-fade-up py-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mb-1 font-semibold text-gray-900 dark:text-white">Имэйл илгээгдлээ</h2>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">
          Сэргээх холбоос имэйл хаяг руу илгээгдлээ. Хэдхэн минутын дотор ирнэ.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="fp-email">Имэйл хаяг</label>
        <input
          id="fp-email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          className={cn(INPUT_CLS, errors.email && "border-red-300 dark:border-red-700")}
        />
        {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className={AUTH_BTN}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Илгээж байна...
          </span>
        ) : (
          "Холбоос илгээх"
        )}
      </button>
    </form>
  );
}

// ── Reset password ────────────────────────────────────────────────────────────

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    const result = await resetPassword(data);
    if (result.error) {
      setError("root", { message: result.error });
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (success) {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
        <p className="font-semibold text-gray-900 dark:text-white">Нууц үг амжилттай солигдлоо</p>
        <p className="mt-1 text-[12px] text-gray-400">Нэвтрэх хуудас руу шилжиж байна...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("token")} />

      {errors.root && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="rp-password">Шинэ нууц үг</label>
        <input
          id="rp-password"
          type="password"
          placeholder="Дор хаяж 8 тэмдэгт"
          {...register("password")}
          className={cn(INPUT_CLS, errors.password && "border-red-300 dark:border-red-700")}
        />
        {errors.password && <p className="text-[11px] text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="rp-confirm">Нууц үг давтах</label>
        <input
          id="rp-confirm"
          type="password"
          placeholder="Нууц үгээ давтана уу"
          {...register("confirmPassword")}
          className={cn(INPUT_CLS, errors.confirmPassword && "border-red-300 dark:border-red-700")}
        />
        {errors.confirmPassword && (
          <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className={AUTH_BTN}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Хадгалж байна...
          </span>
        ) : (
          "Нууц үг солих"
        )}
      </button>
    </form>
  );
}
