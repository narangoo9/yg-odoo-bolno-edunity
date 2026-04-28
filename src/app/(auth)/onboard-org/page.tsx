import type { Metadata } from "next";
import Link from "next/link";
import { OrgOnboardForm } from "@/components/forms/OrgOnboardForm";

export const metadata: Metadata = { title: "Байгууллага бүртгүүлэх" };

export default function OrgOnboardPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground mb-1">Байгууллага бүртгүүлэх</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Суралцагч бүртгүүлэх бол{" "}
        <Link href="/register" className="text-foreground font-medium hover:underline">
          энд дарна уу
        </Link>
      </p>

      <OrgOnboardForm />

      <p className="text-center text-slate-400 text-xs mt-6">
        Байгууллагын бүртгэл нь тусдаа урсгалаар явагдана.
        Байгууллагын ажилтнуud урилгаар нэгдэнэ.
      </p>
    </div>
  );
}
