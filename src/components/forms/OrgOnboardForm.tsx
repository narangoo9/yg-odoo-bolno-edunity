"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Building2, User, Check } from "lucide-react";
import { orgOnboardSchema, type OrgOnboardInput } from "@/modules/auth/domain/schemas";
import { onboardOrganization } from "@/modules/auth/application/actions";
import { cn } from "@/lib/utils";

// ── Shared style tokens (same as RegisterForm / LoginForm) ───────────────────
const AUTH_BTN =
  "w-full py-3.5 rounded-2xl text-[14px] font-bold text-white transition-all " +
  "bg-gradient-to-r from-violet-600 to-purple-600 " +
  "shadow-[0_4px_20px_rgba(124,58,237,0.35)] " +
  "hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_4px_26px_rgba(124,58,237,0.45)] " +
  "active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed";

const BACK_BTN =
  "flex-1 py-3.5 rounded-2xl text-[14px] font-semibold transition-all " +
  "border-2 border-gray-200 bg-white text-gray-500 " +
  "hover:border-violet-300 hover:text-violet-600 " +
  "dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-violet-500 dark:hover:text-violet-300 " +
  "active:scale-[.98]";

const INPUT_CLS =
  "w-full rounded-xl border bg-violet-50/60 px-3 py-3 text-[13px] " +
  "text-gray-900 placeholder:text-gray-400 outline-none transition-all " +
  "focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 focus:bg-white " +
  "dark:bg-violet-900/20 dark:text-white dark:placeholder:text-gray-500 " +
  "dark:focus:bg-violet-900/30 dark:focus:border-violet-500";

const LABEL_CLS = "text-[12px] font-semibold text-gray-700 dark:text-gray-300";

const STEPS = [
  { key: "admin" as const, icon: User, label: "Админ мэдээлэл" },
  { key: "org" as const, icon: Building2, label: "Байгууллага" },
];

export function OrgOnboardForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"admin" | "org">("admin");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    trigger,
  } = useForm<OrgOnboardInput>({ resolver: zodResolver(orgOnboardSchema) });

  const nextStep = async () => {
    const valid = await trigger(["adminName", "adminEmail", "adminPassword", "confirmPassword"]);
    if (valid) setStep("org");
  };

  const onSubmit = async (data: OrgOnboardInput) => {
    const result = await onboardOrganization(data);

    if ("error" in result) {
      const errs = result.error as Record<string, string[]>;
      Object.entries(errs).forEach(([field, messages]) => {
        setError(field as keyof OrgOnboardInput, { message: messages[0] });
      });
      if (errs.adminEmail || errs.adminName || errs.adminPassword) setStep("admin");
      return;
    }

    router.replace(`/verify-email?sent=1&email=${encodeURIComponent(data.adminEmail)}`);
    router.refresh();
  };

  const adminDone = step === "org";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Step indicator */}
      <div className="mb-2 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isActive = step === s.key;
          const isDone = i === 0 && adminDone;
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all",
                  isDone
                    ? "border-violet-500 bg-violet-500 text-white"
                    : isActive
                    ? "border-violet-500 bg-white text-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.4)] dark:bg-[#1a1630]"
                    : "border-gray-200 bg-gray-50 text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500"
                )}
              >
                {isDone ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isDone || isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
                )}
              >
                {s.label}
              </span>
              {i === 0 && (
                <div className={cn("h-px flex-1 rounded-full transition-all", adminDone ? "bg-violet-400" : "bg-gray-200 dark:bg-white/10")} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Admin info ── */}
      {step === "admin" && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300">
            <User size={15} className="text-violet-500" />
            Байгууллагын админ мэдээлэл
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-adminName">Нэр</label>
            <input
              id="org-adminName"
              placeholder="Таны нэр"
              {...register("adminName")}
              className={cn(INPUT_CLS, "border-purple-100 dark:border-violet-800/40", errors.adminName && "border-red-300 dark:border-red-700")}
            />
            {errors.adminName && <p className="text-[11px] text-red-500">{errors.adminName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-adminEmail">Имэйл хаяг</label>
            <input
              id="org-adminEmail"
              type="email"
              placeholder="admin@company.com"
              {...register("adminEmail")}
              className={cn(INPUT_CLS, "border-purple-100 dark:border-violet-800/40", errors.adminEmail && "border-red-300 dark:border-red-700")}
            />
            {errors.adminEmail && <p className="text-[11px] text-red-500">{errors.adminEmail.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-adminPassword">Нууц үг</label>
            <div className="relative">
              <input
                id="org-adminPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Дор хаяж 8 тэмдэгт"
                {...register("adminPassword")}
                className={cn(INPUT_CLS, "border-purple-100 pr-10 dark:border-violet-800/40", errors.adminPassword && "border-red-300 dark:border-red-700")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.adminPassword && <p className="text-[11px] text-red-500">{errors.adminPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-confirm">Нууц үг давтах</label>
            <input
              id="org-confirm"
              type="password"
              placeholder="Нууц үгээ давтана уу"
              {...register("confirmPassword")}
              className={cn(INPUT_CLS, "border-purple-100 dark:border-violet-800/40", errors.confirmPassword && "border-red-300 dark:border-red-700")}
            />
            {errors.confirmPassword && <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button type="button" onClick={nextStep} className={AUTH_BTN}>
            Үргэлжлүүлэх
          </button>
        </div>
      )}

      {/* ── Step 2: Org info ── */}
      {step === "org" && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300">
            <Building2 size={15} className="text-violet-500" />
            Байгууллагын мэдээлэл
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-orgName">Байгууллагын нэр</label>
            <input
              id="org-orgName"
              placeholder="Жишээ: Tech Academy Mongolia"
              {...register("orgName")}
              className={cn(INPUT_CLS, "border-purple-100 dark:border-violet-800/40", errors.orgName && "border-red-300 dark:border-red-700")}
            />
            {errors.orgName && <p className="text-[11px] text-red-500">{errors.orgName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-orgSlug">
              URL нэр{" "}
              <span className="text-[11px] font-normal text-gray-400">(жижиг үсэг, тоо, зураас)</span>
            </label>
            <div className="flex items-center gap-1.5 rounded-xl border border-purple-100 bg-violet-50/60 px-3 transition-all focus-within:border-violet-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-500/25 dark:border-violet-800/40 dark:bg-violet-900/20">
              <span className="shrink-0 text-[12px] text-gray-400 dark:text-gray-500">elearn.mn/org/</span>
              <input
                id="org-orgSlug"
                placeholder="tech-academy"
                {...register("orgSlug")}
                className="min-w-0 flex-1 bg-transparent py-3 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            {errors.orgSlug && <p className="text-[11px] text-red-500">{errors.orgSlug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-orgDescription">
              Товч тайлбар{" "}
              <span className="text-[11px] font-normal text-gray-400">(заавал биш)</span>
            </label>
            <input
              id="org-orgDescription"
              placeholder="Байгууллагын товч тайлбар..."
              {...register("orgDescription")}
              className={cn(INPUT_CLS, "border-purple-100 dark:border-violet-800/40")}
            />
          </div>

          <div className="space-y-1.5">
            <label className={LABEL_CLS} htmlFor="org-orgWebsite">
              Вебсайт{" "}
              <span className="text-[11px] font-normal text-gray-400">(заавал биш)</span>
            </label>
            <input
              id="org-orgWebsite"
              type="url"
              placeholder="https://yourcompany.mn"
              {...register("orgWebsite")}
              className={cn(INPUT_CLS, "border-purple-100 dark:border-violet-800/40", errors.orgWebsite && "border-red-300 dark:border-red-700")}
            />
            {errors.orgWebsite && <p className="text-[11px] text-red-500">{errors.orgWebsite.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("admin")} className={BACK_BTN}>
              Буцах
            </button>
            <button type="submit" disabled={isSubmitting} className={cn(AUTH_BTN, "flex-1")}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Бүртгэж байна...
                </span>
              ) : (
                "Байгууллага үүсгэх"
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
