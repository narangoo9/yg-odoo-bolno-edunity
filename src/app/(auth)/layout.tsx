import Link from "next/link";
import { RobotIllustration } from "@/components/brand/RobotIllustration";
import { EduNityLogo } from "@/components/layout/EduNityLogo";
import { AuthMascotFloat } from "@/components/onboarding/AuthMascotFloat";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-950 via-[#0d0b1f] to-[#09090b] p-4">
      <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-700/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[100px]" />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative mb-8 flex flex-col items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-[0_20px_45px_rgba(139,92,246,0.35)]">
          <RobotIllustration size={76} priority alt="" />
        </div>
        <Link href="/">
          <EduNityLogo forDarkBg iconClassName="h-12" textClassName="text-[2rem]" />
        </Link>
      </div>

      {/* Card + mascot float side by side on wide screens */}
      <div className="relative flex items-center gap-10">
        <div className="relative w-full max-w-md rounded-2xl border border-violet-100 bg-white p-8 shadow-2xl shadow-violet-900/30 dark:border-violet-800/30 dark:bg-[#111028]">
          {children}
        </div>
        <AuthMascotFloat />
      </div>

      <p className="relative mt-6 text-xs text-violet-500/60">
        © {new Date().getFullYear()} EduNity. Бүх эрх хуулиар хамгаалагдсан.
      </p>
    </div>
  );
}
