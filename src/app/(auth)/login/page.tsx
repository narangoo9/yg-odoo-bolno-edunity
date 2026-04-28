import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const [{ callbackUrl }, session] = await Promise.all([searchParams, auth()]);

  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground mb-1">Нэвтрэх</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Бүртгэл байхгүй юу?{" "}
        <Link href="/register" className="text-foreground font-medium hover:underline">
          Бүртгүүлэх
        </Link>
      </p>

      <LoginForm />

      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-violet-700 dark:hover:text-violet-300">
          Нууц үг мартсан уу?
        </Link>
      </div>
    </div>
  );
}
