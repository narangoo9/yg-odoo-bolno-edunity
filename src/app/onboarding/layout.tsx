import Link from "next/link";
import { EduNityLogo } from "@/components/layout/EduNityLogo";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-violet-950 via-[#0d0b1f] to-[#09090b]">
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-violet-700/12 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[100px]" />

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-6 py-5">
        <Link href="/">
          <EduNityLogo forDarkBg textClassName="text-xl" />
        </Link>

        <OnboardingStepper />

        <Link
          href="/student"
          className="text-[12px] font-semibold text-violet-300/70 transition-colors hover:text-violet-200"
        >
          Алгасах →
        </Link>
      </header>

      {/* Page content */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="relative pb-4 text-center text-[11px] text-violet-500/40">
        © {new Date().getFullYear()} EduNity. Бүх эрх хуулиар хамгаалагдсан.
      </footer>
    </div>
  );
}
