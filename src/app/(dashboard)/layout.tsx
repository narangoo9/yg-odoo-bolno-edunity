import { Suspense, type ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { RoboAgent } from "@/components/ai/RoboAgent";
import { dashboardCacheTags } from "@/lib/dashboard-cache";

const getCachedUser = (userId: string) =>
  unstable_cache(
    () =>
      db.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, streak: true, subscription: { select: { plan: true } } },
      }),
    [`layout-user-${userId}`],
    { revalidate: 30, tags: [dashboardCacheTags.user(userId)] },
  )();

const getCachedUnreads = (userId: string, isStudent: boolean) =>
  unstable_cache(
    async () => {
      const [notifications, messages] = await Promise.all([
        db.notification.count({
          where: { userId, isRead: false },
        }),
        isStudent
          ? db.directMessage.count({
              where: { recipientId: userId, isRead: false },
            })
          : 0,
      ]);

      return { notifications, messages };
    },
    [`layout-unreads-${userId}`],
    {
      revalidate: 15,
      tags: [dashboardCacheTags.notifications(userId), dashboardCacheTags.messages(userId)],
    },
  )();

function RightSidebarSkeleton() {
  return (
    <aside className="hidden h-full w-[290px] shrink-0 border-l border-border bg-card p-4 lg:block">
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
      </div>
    </aside>
  );
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isStudent = session.user.role === "STUDENT";
  const [user, unreads] = await Promise.all([
    getCachedUser(session.user.id).catch(() => null),
    getCachedUnreads(session.user.id, isStudent).catch(() => ({ notifications: 0, messages: 0 })),
  ]);

  return (
    <div className="flex h-screen bg-[#f5f3ff] dark:bg-[#09090b] overflow-hidden">
      <DashboardSidebar
        role={session.user.role}
        xp={user?.xp ?? 0}
        level={user?.level ?? 1}
        streak={user?.streak ?? 0}
        subscriptionPlan={user?.subscription?.plan ?? null}
        messagesBadge={unreads.messages}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardTopbar user={session.user} unreadNotifications={unreads.notifications} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto px-5 py-5">
              {children}
            </div>
          </main>
          {isStudent && (
            <Suspense fallback={<RightSidebarSkeleton />}>
              <RightSidebar userId={session.user.id} />
            </Suspense>
          )}
        </div>
      </div>
      {isStudent && <RoboAgent firstName={session.user.name?.split(" ")[0] ?? "Student"} />}
    </div>
  );
}
