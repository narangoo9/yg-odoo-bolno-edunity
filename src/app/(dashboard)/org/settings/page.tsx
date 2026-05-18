import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Globe, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Байгууллагын тохиргоо" };

export default async function OrgSettingsPage() {
  const session = await auth();
  if (!session?.user || !["COMPANY", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect("/org");
  }

  const organization = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      slug: true,
      description: true,
      website: true,
      plan: true,
      commissionRate: true,
      owner: { select: { name: true, email: true } },
    },
  });

  if (!organization) {
    redirect("/org");
  }

  return (
    <div className="max-w-3xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">Байгууллагын тохиргоо</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Байгууллагын үндсэн мэдээлэл ба хандалтын төлөв</p>
      </div>

      <section className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <Building2 size={15} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="font-bold text-foreground">Үндсэн мэдээлэл</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Нэр</p>
            <p className="font-medium text-foreground">{organization.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Slug</p>
            <p className="font-medium text-foreground">{organization.slug}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Төлөвлөгөө</p>
            <p className="font-medium text-foreground">{organization.plan}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Шимтгэлийн хувь</p>
            <p className="font-medium text-foreground">{Number(organization.commissionRate)}%</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground mb-1">Тайлбар</p>
            <p className="font-medium text-foreground">{organization.description || "Тайлбар оруулаагүй байна."}</p>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
            <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-bold text-foreground">Холбоо ба удирдлага</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <Globe size={15} className="mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground mb-1">Website</p>
              <p className="font-medium text-foreground">{organization.website || "Website тохируулаагүй байна."}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Users size={15} className="mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground mb-1">Owner</p>
              <p className="font-medium text-foreground">{organization.owner.name} ({organization.owner.email})</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <Link
            href="/org/members"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-2xl transition-colors"
          >
            <Users size={15} />
            Гишүүд удирдах
          </Link>
        </div>
      </section>
    </div>
  );
}
