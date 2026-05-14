import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; registered?: string }>;
}) {
  const [{ callbackUrl, registered }, session] = await Promise.all([
    searchParams,
    auth(),
  ]);

  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  return <AuthPageClient initialMode="login" registered={registered} />;
}
