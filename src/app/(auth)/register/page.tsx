import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; referral?: string }>;
}) {
  const params = await searchParams;
  const referralCode = (params.invite ?? params.referral ?? "").trim();
  const session = await auth();

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        onboardingCompleted: true,
        passwordHash: true,
      },
    });

    if (!user) redirect("/login");

    const redirectPath = getPostAuthRedirectPath(user);
    if (redirectPath === "/register") {
      return (
        <AuthPageClient
          initialMode="register"
          googleComplete={{
            email: user.email,
            defaultName: user.name ?? "",
          }}
        />
      );
    }

    redirect(redirectPath);
  }

  return <AuthPageClient initialMode="register" referralCode={referralCode} />;
}
