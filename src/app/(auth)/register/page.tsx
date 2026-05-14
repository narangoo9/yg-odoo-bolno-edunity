import type { Metadata } from "next";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default function RegisterPage() {
  return <AuthPageClient initialMode="register" />;
}
