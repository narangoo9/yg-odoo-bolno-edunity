import type { Metadata } from "next";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return <AuthPageClient initialMode="register" referralCode={ref} />;
}
