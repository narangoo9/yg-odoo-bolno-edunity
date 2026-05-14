import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { AuthStaticLayout } from "@/components/auth/AuthStaticLayout";

export const metadata: Metadata = { title: "Нууц үг солих" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthStaticLayout>
      {!token ? (
        <div className="py-4 text-center">
          <p className="text-[14px] text-red-600">
            Буруу холбоос. Дахин нууц үг сэргээх хүсэлт илгээнэ үү.
          </p>
          <div className="mt-5">
            <Link
              href="/forgot-password"
              className="text-[13px] text-violet-600 font-semibold hover:underline"
            >
              Дахин хүсэлт илгээх
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-[28px] font-black text-gray-900">Нууц үг солих</h1>
            <p className="text-[14px] text-gray-500 mt-1">
              Шинэ нууц үгээ оруулна уу.
            </p>
          </div>

          <ResetPasswordForm token={token} />

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-[13px] text-gray-400 hover:text-violet-600 transition-colors"
            >
              ← Нэвтрэх хуудас руу буцах
            </Link>
          </div>
        </>
      )}
    </AuthStaticLayout>
  );
}
