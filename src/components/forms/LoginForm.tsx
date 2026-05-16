"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginInput } from "@/modules/auth/domain/schemas";
import { useOnboardingStore } from "@/lib/onboarding/onboardingStore";
import { cn } from "@/lib/utils";

const AUTH_BTN =
  "w-full py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all " +
  "bg-gradient-to-r from-violet-600 to-purple-600 " +
  "shadow-[0_4px_20px_rgba(124,58,237,0.35)] " +
  "hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_4px_26px_rgba(124,58,237,0.45)] " +
  "active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed";

const INPUT_BASE =
  "w-full rounded-xl border bg-violet-50/60 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none transition-all " +
  "focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 focus:bg-white " +
  "dark:bg-violet-900/20 dark:text-white dark:placeholder:text-gray-500 " +
  "dark:focus:bg-violet-900/30 dark:focus:border-violet-500";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Google руу шилжих үед алдаа гарлаа. Дахин оролдоно уу.",
  OAuthCallback:
    "Google-аас буцаж ирэх үед алдаа гарлаа. Google Cloud Console дээр Authorized redirect URI-д `http://localhost:3000/api/auth/callback/google` нэмэгдсэн эсэхийг шалгана уу.",
  OAuthCreateAccount:
    "Google хэрэглэгч үүсгэх боломжгүй байна. Өгөгдлийн сангийн холболтыг шалгана уу.",
  EmailCreateAccount: "Хэрэглэгч үүсгэхэд алдаа гарлаа.",
  Callback: "Нэвтрэх callback дээр алдаа гарлаа. Server log-оо шалгана уу.",
  OAuthAccountNotLinked:
    "Энэ имэйл өөр аргаар бүртгэгдсэн байна. Имэйл/нууц үгээр нэвтэрнэ үү.",
  EmailSignin: "Имэйл линк илгээх үед алдаа гарлаа.",
  CredentialsSignin: "Имэйл эсвэл нууц үг буруу байна.",
  SessionRequired: "Та эхлээд нэвтэрсэн байх шаардлагатай.",
  AccessDenied: "Нэвтрэх эрх хязгаарлагдсан байна.",
  Verification: "Имэйл баталгаажуулалт амжилтгүй боллоо.",
  Configuration:
    "Auth тохиргоо буруу байна. AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_URL-г .env файлд шалгана уу.",
  Default: "Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    urlError
      ? `${OAUTH_ERROR_MESSAGES[urlError] ?? OAUTH_ERROR_MESSAGES.Default} (код: ${urlError})`
      : null,
  );
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const { onboardingCompleted, getNextIncompleteStep } = useOnboardingStore();

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
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const destination = callbackUrl ?? "/dashboard";
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: destination,
    });

    if (res?.error) {
      const code = res.error;
      if (code === "CredentialsSignin") {
        setServerError("Имэйл эсвэл нууц үг буруу байна");
      } else if (code === "Configuration") {
        setServerError(
          "Өгөгдлийн сангийн холболт эсвэл AUTH_SECRET / Google OAuth тохиргоог шалгана уу."
        );
      } else if (code === "AccessDenied") {
        setServerError("Нэвтрэх эрх хязгаарлагдсан байна.");
      } else if (process.env.NODE_ENV === "development") {
        setServerError(`Нэвтрэх алдаа (${code}). Дахин оролдоно уу.`);
      } else {
        setServerError("Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.");
      }
      return;
    }

    if (!onboardingCompleted && !callbackUrl) {
      const nextStep = getNextIncompleteStep();
      router.replace(`/onboarding/${nextStep}`);
      router.refresh();
      return;
    }

    if (res?.url) {
      window.location.assign(res.url);
      return;
    }

    router.replace(destination);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
          Имэйл хаяг
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="login-email"
            type="email"
            placeholder="student@elearn.mn"
            autoComplete="email"
            {...register("email")}
            className={cn(
              INPUT_BASE,
              "pl-10 pr-4 py-3.5",
              errors.email ? "border-red-300 dark:border-red-700" : "border-purple-100 dark:border-violet-800/40"
            )}
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
          Нууц үг
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
            className={cn(
              INPUT_BASE,
              "pl-10 pr-10 py-3.5",
              errors.password ? "border-red-300 dark:border-red-700" : "border-purple-100 dark:border-violet-800/40"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button type="submit" disabled={isSubmitting} className={cn(AUTH_BTN, "mt-1")}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Нэвтэрч байна...
          </span>
        ) : (
          "Нэвтрэх"
        )}
      </button>

      {googleAvailable && (
        <>
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:bg-[#1a1630] dark:text-gray-500">
                эсвэл
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={googleSubmitting}
            onClick={async () => {
              setServerError(null);
              setGoogleSubmitting(true);
              try {
                const res = await signIn("google", {
                  callbackUrl: callbackUrl ?? "/dashboard",
                  redirect: false,
                });
                if (res?.error) {
                  setServerError(
                    `${OAUTH_ERROR_MESSAGES[res.error] ?? OAUTH_ERROR_MESSAGES.Default} (код: ${res.error})`,
                  );
                  setGoogleSubmitting(false);
                  return;
                }
                if (res?.url) {
                  window.location.assign(res.url);
                }
              } catch (err) {
                setServerError(
                  err instanceof Error
                    ? `Google нэвтрэлт амжилтгүй: ${err.message}`
                    : "Google нэвтрэлт амжилтгүй боллоо. Дахин оролдоно уу.",
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
              "Google-ээр нэвтрэх"
            )}
          </button>
        </>
      )}
    </form>
  );
}
