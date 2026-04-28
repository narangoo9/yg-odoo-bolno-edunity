import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { acceptOrgInvite } from "@/modules/organizations/application/actions";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = { title: "Урилга хүлээн авах" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptOrgInvitePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const session = await auth();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Урилгын токен олдсонгүй</p>
          <Link href="/login" className="text-blue-600 text-sm mt-2 inline-block">Нэвтрэх</Link>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    redirect(`/login?callbackUrl=/org/invite/accept?token=${token}`);
  }

  const result = await acceptOrgInvite(token);

  if (result.redirect) {
    redirect(result.redirect);
  }

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">{result.error}</p>
          <Link href="/dashboard" className="text-blue-600 text-sm">Самбарт буцах</Link>
        </div>
      </div>
    );
  }

  redirect("/org");
}
