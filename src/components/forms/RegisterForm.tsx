"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/modules/auth/domain/schemas";
import { registerUser } from "@/modules/auth/application/actions";
import { OrgOnboardForm } from "@/components/forms/OrgOnboardForm";
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
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "dark:bg-violet-900/20 dark:text-white dark:border-violet-800/40 dark:placeholder:text-gray-500 " +
  "dark:focus-visible:bg-violet-900/30 dark:focus-visible:border-violet-500";

const LABEL_CLS = "text-[12px] font-semibold text-gray-700 dark:text-gray-300";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Google руу шилжих үед алдаа гарлаа. Дахин оролдоно уу.",
  OAuthCallback:
    "Google-аас буцаж ирэх үед алдаа гарлаа. Google Cloud Console дээр Authorized redirect URI-д `http://localhost:3000/api/auth/callback/google` нэмэгдсэн эсэхийг шалгана уу.",
  OAuthCreateAccount:
    "Google хэрэглэгч үүсгэх боломжгүй байна. Өгөгдлийн сангийн холболтыг шалгана уу.",
  OAuthAccountNotLinked:
    "Энэ имэйл өөр аргаар бүртгэгдсэн байна. Имэйл/нууц үгээр нэвтэрнэ үү.",
  AccessDenied: "Нэвтрэх эрх хязгаарлагдсан байна.",
  Configuration:
    "Auth тохиргоо буруу байна. AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_URL-г .env файлд шалгана уу.",
  Default: "Google бүртгэлийн үед алдаа гарлаа. Дахин оролдоно уу.",
};

export function RegisterForm({ referralCode = "" }: { referralCode?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"user" | "company">("user");
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const normalizedReferralCode = referralCode.trim();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        if (!cancelled && data?.google) setGoogleAvailable(true);
      })
      .catch(() => {
        if (!cancelled) setGoogleAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { referralCode: normalizedReferralCode },
  });

  useEffect(() => {
    setValue("referralCode", normalizedReferralCode);
  }, [normalizedReferralCode, setValue]);

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerUser(data);

    if ("error" in result) {
      const errs = result.error as Record<string, string[]>;
      Object.entries(errs).forEach(([field, messages]) => {
        setError(field as keyof RegisterInput, { message: messages[0] });
      });
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.replace("/login?registered=1");
      return;
    }

    router.replace("/verify-email");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* User / Company toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/10">
        {[
          { value: "user", label: "Хувь хүн" },
          { value: "company", label: "Байгууллага" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value as "user" | "company")}
            className={cn(
              "rounded-lg px-3 py-2 text-[13px] font-semibold transition-all",
              mode === item.value
                ? "bg-white text-violet-700 shadow-sm dark:bg-[#1a1630] dark:text-violet-300"
                : "text-gray-500 hover:text-foreground dark:text-gray-400"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "company" ? (
        <OrgOnboardForm />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {normalizedReferralCode && (
            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-700 dark:border-violet-800/40 dark:bg-violet-900/20 dark:text-violet-300">
              <UserPlus size={14} />
              Найзын урилгаар бүртгүүлж байна
            </div>
          )}
          <input type="hidden" {...register("referralCode")} />

          {/* Name */}
          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="reg-name">Нэр</label>
            <input
              id="reg-name"
              placeholder="Таны нэр"
              {...register("name")}
              className={cn(INPUT_CLS, errors.name && "border-red-300 dark:border-red-700")}
            />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="reg-email">Имэйл хаяг</label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={cn(INPUT_CLS, errors.email && "border-red-300 dark:border-red-700")}
            />
            {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="reg-password">Нууц үг</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="Дор хаяж 8 тэмдэгт"
                {...register("password")}
                className={cn(
                  INPUT_CLS,
                  "pr-10",
                  errors.password && "border-red-300 dark:border-red-700"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-red-500">{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="reg-confirm">Нууц үг давтах</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Нууц үгээ давтана уу"
              {...register("confirmPassword")}
              className={cn(INPUT_CLS, errors.confirmPassword && "border-red-300 dark:border-red-700")}
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting} className={AUTH_BTN}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Бүртгэж байна...
              </span>
            ) : (
              "Бүртгүүлэх"
            )}
          </button>

          {googleAvailable && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:bg-[#1a1630] dark:text-gray-500">
                    эсвэл
                  </span>
                </div>
              </div>

              {googleError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
                  {googleError}
                </div>
              )}
              <button
                type="button"
                disabled={googleSubmitting}
                onClick={async () => {
                  setGoogleError(null);
                  setGoogleSubmitting(true);
                  try {
                    const res = await signIn("google", {
                      callbackUrl: "/dashboard",
                      redirect: false,
                    });
                    if (res?.error) {
                      setGoogleError(
                        `${OAUTH_ERROR_MESSAGES[res.error] ?? OAUTH_ERROR_MESSAGES.Default} (код: ${res.error})`,
                      );
                      setGoogleSubmitting(false);
                      return;
                    }
                    if (res?.url) {
                      window.location.assign(res.url);
                    }
                  } catch (err) {
                    setGoogleError(
                      err instanceof Error
                        ? `Google бүртгэл амжилтгүй: ${err.message}`
                        : "Google бүртгэл амжилтгүй боллоо. Дахин оролдоно уу.",
                    );
                    setGoogleSubmitting(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white py-3 text-[13px] font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Шилжиж байна...
                  </span>
                ) : (
                  "Google-ээр бүртгүүлэх"
                )}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
