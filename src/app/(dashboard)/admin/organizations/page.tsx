import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/index";
import { Building2, Users, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Байгууллагууд" };

const planConfig: Record<string, { label: string; variant: "secondary" | "info" | "warning" | "success" | "destructive" | "default" | "outline" }> = {
  FREE: { label: "Үнэгүй", variant: "secondary" },
  STUDENT: { label: "Оюутан", variant: "info" },
  INSTRUCTOR: { label: "Багш", variant: "warning" },
  ORGANIZATION: { label: "Байгууллага", variant: "success" },
  ENTERPRISE: { label: "Enterprise", variant: "destructive" },
  BASIC: { label: "Basic", variant: "secondary" },
  STANDARD: { label: "Standard", variant: "info" },
  PREMIUM: { label: "Premium", variant: "warning" },
  PRO: { label: "Pro", variant: "success" },
};

export default async function AdminOrganizationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { members: true, courses: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">Байгууллагууд</h1>
        <p className="text-muted-foreground text-sm mt-1">Нийт {orgs.length} байгууллага</p>
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <Building2 size={36} className="mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-muted-foreground text-sm">Байгууллага бүртгэгдээгүй байна</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => {
            const pc = planConfig[org.plan];
            return (
              <div key={org.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shrink-0">
                    {org.logoUrl
                      ? <img src={org.logoUrl} className="w-full h-full rounded-2xl object-cover" alt="" />
                      : org.name[0]
                    }
                  </div>
                  <Badge variant={pc?.variant ?? "secondary"}>{pc?.label ?? org.plan}</Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1">{org.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">@{org.slug}</p>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Users size={11} />
                    <span>{org._count.members} гишүүн</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={11} />
                    <span>{org._count.courses} курс</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-3 border-t border-border">
                  <p>Эзэмшигч: <span className="text-foreground font-medium">{org.owner.name}</span></p>
                  <p className="mt-1">Үүсгэсэн: {formatDate(org.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
