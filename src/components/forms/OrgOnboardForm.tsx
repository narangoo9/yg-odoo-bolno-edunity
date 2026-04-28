"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Building2, User } from "lucide-react";
import { orgOnboardSchema, type OrgOnboardInput } from "@/modules/auth/domain/schemas";
import { onboardOrganization } from "@/modules/auth/application/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      // If org errors, go back to correct step
      if (errs.adminEmail || errs.adminName || errs.adminPassword) setStep("admin");
      return;
    }

    router.replace(`/verify-email?sent=1&email=${encodeURIComponent(data.adminEmail)}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Step indicator */}
      <div className="flex gap-2 mb-4">
        {(["admin", "org"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-violet-600 text-white"
                  : i < (step === "org" ? 1 : 0)
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground/80"
              }`}
            >
              {i + 1}
            </div>
            <span className="text-xs text-muted-foreground">{s === "admin" ? "Админ мэдээлэл" : "Байгууллага"}</span>
            {i === 0 && <div className="flex-1 h-px bg-muted" />}
          </div>
        ))}
      </div>

      {step === "admin" && (
        <>
          <div className="flex items-center gap-2 text-foreground font-medium text-sm mb-2">
            <User size={16} />
            Байгууллагын админ мэдээлэл
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminName">Нэр</Label>
            <Input id="adminName" placeholder="Таны нэр" {...register("adminName")} />
            {errors.adminName && <p className="text-xs text-red-500">{errors.adminName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminEmail">Имэйл хаяг</Label>
            <Input id="adminEmail" type="email" placeholder="admin@company.com" {...register("adminEmail")} />
            {errors.adminEmail && <p className="text-xs text-red-500">{errors.adminEmail.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminPassword">Нууц үг</Label>
            <div className="relative">
              <Input
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Дор хаяж 8 тэмдэгт"
                className="pr-10"
                {...register("adminPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.adminPassword && <p className="text-xs text-red-500">{errors.adminPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Нууц үг давтах</Label>
            <Input id="confirmPassword" type="password" placeholder="Нууц үгээ давтана уу" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="button" className="w-full" onClick={nextStep}>
            Үргэлжлүүлэх
          </Button>
        </>
      )}

      {step === "org" && (
        <>
          <div className="flex items-center gap-2 text-foreground font-medium text-sm mb-2">
            <Building2 size={16} />
            Байгууллагын мэдээлэл
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgName">Байгууллагын нэр</Label>
            <Input id="orgName" placeholder="Жишээ: Tech Academy Mongolia" {...register("orgName")} />
            {errors.orgName && <p className="text-xs text-red-500">{errors.orgName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgSlug">
              URL нэр <span className="text-muted-foreground/80 font-normal text-xs">(жижиг үсэг, тоо, зураас)</span>
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/80 text-sm">elearn.mn/org/</span>
              <Input id="orgSlug" placeholder="tech-academy" {...register("orgSlug")} className="flex-1" />
            </div>
            {errors.orgSlug && <p className="text-xs text-red-500">{errors.orgSlug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgDescription">Товч тайлбар (заавал биш)</Label>
            <Input id="orgDescription" placeholder="Байгууллагын товч тайлбар..." {...register("orgDescription")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgWebsite">Вебсайт (заавал биш)</Label>
            <Input id="orgWebsite" type="url" placeholder="https://yourcompany.mn" {...register("orgWebsite")} />
            {errors.orgWebsite && <p className="text-xs text-red-500">{errors.orgWebsite.message}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("admin")}>
              Буцах
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Бүртгэж байна...
                </>
              ) : (
                "Байгууллага үүсгэх"
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
