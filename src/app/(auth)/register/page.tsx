import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default function RegisterPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground mb-1">Бүртгүүлэх</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Бүртгэл байна уу?{" "}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Нэвтрэх
        </Link>
      </p>

      <RegisterForm />
    </div>
  );
}
