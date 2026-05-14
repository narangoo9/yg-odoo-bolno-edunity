import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { AuthStaticLayout } from "@/components/auth/AuthStaticLayout";

export const metadata: Metadata = { title: "Нууц үг мартсан" };

export default function ForgotPasswordPage() {
  return (
    <AuthStaticLayout>
      <div className="mb-6">
        <h1 className="text-[28px] font-black text-gray-900">Нууц үг сэргээх</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Имэйл хаягаа оруулбал сэргээх холбоос илгээнэ.
        </p>
      </div>

      <ForgotPasswordForm />

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="text-[13px] text-gray-400 hover:text-violet-600 transition-colors"
        >
          ← Нэвтрэх хуудас руу буцах
        </Link>
      </div>
    </AuthStaticLayout>
  );
}
