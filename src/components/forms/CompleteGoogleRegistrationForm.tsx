"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import {
  googleCompleteSchema,
  type GoogleCompleteInput,
} from "@/modules/auth/domain/schemas";
import { completeGoogleRegistration } from "@/modules/auth/application/actions";
import { cn } from "@/lib/utils";

const AUTH_BTN =
  "w-full py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all " +
  "bg-gradient-to-r from-violet-600 to-purple-600 " +
  "shadow-[0_4px_20px_rgba(124,58,237,0.35)] " +
  "hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_4px_26px_rgba(124,58,237,0.45)] " +
  "active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed";

const INPUT_CLS =
  "flex h-10 w-full rounded-xl border border-input bg-violet-50/60 px-3 py-2 text-[13px] " +
  "text-gray-900 placeholder:text-gray-400 ring-offset-background outline-none transition-all " +
  "focus-visible:ring-2 focus-visible:ring-violet-500/25 focus-visible:border-violet-400 focus-visible:bg-white " +
  "disabled:cursor-not-allowed disabled:opacity-70 " +
  "dark:bg-violet-900/20 dark:text-white dark:border-violet-800/40";

const LABEL_CLS = "text-[12px] font-semibold text-gray-700 dark:text-gray-300";

interface Props {
  email: string;
  defaultName: string;
}

export function CompleteGoogleRegistrationForm({ email, defaultName }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<GoogleCompleteInput>({
    resolver: zodResolver(googleCompleteSchema),
    defaultValues: { name: defaultName },
  });

  const onSubmit = async (data: GoogleCompleteInput) => {
    setFormError(null);
    const result = await completeGoogleRegistration(data);

    if ("error" in result && result.error) {
      const errs = result.error as Record<string, string[]>;
      if (errs._form?.[0]) {
        setFormError(errs._form[0]);
        return;
      }
      Object.entries(errs).forEach(([field, messages]) => {
        if (field === "_form") return;
        setError(field as keyof GoogleCompleteInput, { message: messages[0] });
      });
      return;
    }

    await signIn("credentials", {
      email,
      password: data.password,
      redirect: false,
    });

    router.replace("/student");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={14} />
          Google имэйл баталгаажсан
        </div>
        <p className="mt-1 text-emerald-600/90 dark:text-emerald-400/90">
          Имэйл баталгаажуулах алхам шаардлагагүй. Зөвхөн нэр, нууц үгээ тохируулна уу.
        </p>
      </div>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-600">
          {formError}
        </div>
      )}

      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="complete-email">
          Имэйл
        </label>
        <input
          id="complete-email"
          type="email"
          value={email}
          readOnly
          disabled
          className={cn(INPUT_CLS, "bg-gray-100 dark:bg-white/5")}
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="complete-name">
          Нэр
        </label>
        <input
          id="complete-name"
          placeholder="Таны нэр"
          {...register("name")}
          className={cn(INPUT_CLS, errors.name && "border-red-300")}
        />
        {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="complete-password">
          Нууц үг
        </label>
        <div className="relative">
          <input
            id="complete-password"
            type={showPassword ? "text" : "password"}
            placeholder="Дор хаяж 8 тэмдэгт"
            {...register("password")}
            className={cn(INPUT_CLS, "pr-10", errors.password && "border-red-300")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLS} htmlFor="complete-confirm">
          Нууц үг давтах
        </label>
        <input
          id="complete-confirm"
          type="password"
          placeholder="Нууц үгээ давтана уу"
          {...register("confirmPassword")}
          className={cn(INPUT_CLS, errors.confirmPassword && "border-red-300")}
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
          "Бүртгэлээ дуусгах"
        )}
      </button>
    </form>
  );
}
