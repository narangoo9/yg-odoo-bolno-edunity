"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema, resetPasswordSchema } from "@/modules/auth/domain/schemas";
import { forgotPassword, resetPassword } from "@/modules/auth/application/actions";
import type { ForgotPasswordInput, ResetPasswordInput } from "@/modules/auth/domain/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { useRouter } from "next/navigation";

// ─── FORGOT ───────────────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await forgotPassword(data);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center py-4 animate-fade-up">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h2 className="font-semibold text-foreground mb-1">Имэйл илгээгдлээ</h2>
        <p className="text-muted-foreground text-sm">
          Сэргээх холбоос имэйл хаяг руу илгээгдлээ. Хэдхэн минутын дотор ирнэ.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Имэйл хаяг</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Илгээж байна...</> : "Холбоос илгээх"}
      </Button>
    </form>
  );
}

// ─── RESET ────────────────────────────────────────────────────────────────────

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<ResetPasswordInput>({
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
      <div className="text-center py-4">
        <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
        <p className="font-semibold text-foreground">Нууц үг амжилттай солигдлоо</p>
        <p className="text-xs text-muted-foreground mt-1">Нэвтрэх хуудас руу шилжиж байна...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("token")} />
      {errors.root && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.root.message}
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Шинэ нууц үг</Label>
        <Input type="password" placeholder="Дор хаяж 8 тэмдэгт" {...register("password")} />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Нууц үг давтах</Label>
        <Input type="password" placeholder="Нууц үгээ давтана уу" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Хадгалж байна...</> : "Нууц үг солих"}
      </Button>
    </form>
  );
}
