import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Нууц үг мартсан" };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground mb-1">Нууц үг сэргээх</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Имэйл хаягаа оруулбал сэргээх холбоос илгээнэ.
      </p>
      <ForgotPasswordForm />
      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-violet-700 dark:hover:text-violet-300">
          ← Нэвтрэх хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
