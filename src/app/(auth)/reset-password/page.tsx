import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Нууц үг солих" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 text-sm">Буруу холбоос. Дахин нууц үг сэргээх хүсэлт илгээнэ үү.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground mb-1">Нууц үг солих</h1>
      <p className="text-muted-foreground text-sm mb-6">Шинэ нууц үгээ оруулна уу.</p>
      <ResetPasswordForm token={token} />
    </div>
  );
}
