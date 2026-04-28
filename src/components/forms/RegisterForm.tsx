"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/modules/auth/domain/schemas";
import { registerUser } from "@/modules/auth/application/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgOnboardForm } from "@/components/forms/OrgOnboardForm";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"user" | "company">("user");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerUser(data);

    if ("error" in result) {
      const errs = result.error as Record<string, string[]>;
      Object.entries(errs).forEach(([field, messages]) => {
        setError(field as keyof RegisterInput, { message: messages[0] });
      });
      return;
    }

    // Redirect to onboarding after successful registration
    // Email verification link is sent in background — user can verify later
    router.replace("/onboarding/welcome");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {[
          { value: "user", label: "Хувь хүн" },
          { value: "company", label: "Байгууллага" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value as "user" | "company")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mode === item.value
                ? "bg-white text-violet-700 shadow-sm dark:bg-[#1b1730] dark:text-violet-200"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "company" ? (
        <OrgOnboardForm />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Нэр</Label>
            <Input id="name" placeholder="Таны нэр" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Имэйл хаяг</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Нууц үг</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Дор хаяж 8 тэмдэгт"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80"
                aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Нууц үг давтах</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Нууц үгээ давтана уу"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Бүртгэж байна...
              </>
            ) : (
              "Бүртгүүлэх"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
