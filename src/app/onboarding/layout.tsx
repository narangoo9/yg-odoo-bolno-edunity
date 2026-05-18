import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EduNityLogo } from "@/components/layout/EduNityLogo";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user
    .findUnique({
      where: { id: session.user.id },
      select: { role: true, status: true, onboardingCompleted: true },
    })
    .catch(() => null);

  if (!user) redirect("/login");
  if (user.status !== "ACTIVE") redirect("/verify-email");
  if (user.role !== "STUDENT") redirect("/dashboard");
  if (user.onboardingCompleted) redirect("/student");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#ede9fe] via-[#f5f2ff] to-[#faf8ff]">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(109,40,217,1) 1px, transparent 1px),linear-gradient(90deg, rgba(109,40,217,1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute left-0 top-1/3 h-[600px] w-[500px] -translate-x-1/4 rounded-full bg-violet-400/15 blur-[160px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/4 rounded-full bg-purple-300/10 blur-[130px]" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-8 py-4">
        <Link href="/">
          <EduNityLogo textClassName="text-xl" />
        </Link>

        <OnboardingStepper />

        <div className="w-[96px]" />
      </header>

      {/* Page content */}
      <main className="relative flex flex-1">
        {children}
      </main>
    </div>
  );
}
