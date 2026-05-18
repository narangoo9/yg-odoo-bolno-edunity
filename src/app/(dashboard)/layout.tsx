import { Suspense, type ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { RoboAgentClient } from "@/components/ai/RoboAgentClient";
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient";
import { dashboardCacheTags } from "@/lib/dashboard-cache";
import { getCachedDashboardUser } from "@/lib/user/get-dashboard-user";

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
    <aside className="hidden lg:block h-full w-[290px] shrink-0 border-l border-border bg-card p-4">
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
      </div>
    </aside>
  );
}

const getCachedSavedCoursesCount = (userId: string) =>
  unstable_cache(
    () => db.savedCourse.count({ where: { userId } }),
    [`layout-saved-courses-count-${userId}`],
    {
      revalidate: 15,
      tags: [dashboardCacheTags.savedCourses(userId)],
    },
  )();

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isStudent = session.user.role === "USER";
  const [dbUser, unreads, savedCoursesCount] = await Promise.all([
    getCachedDashboardUser(session.user.id).catch(() => null),
    getCachedUnreads(session.user.id, isStudent).catch(() => ({ notifications: 0, messages: 0 })),
    isStudent ? getCachedSavedCoursesCount(session.user.id).catch(() => 0) : Promise.resolve(0),
  ]);

  return (
    <DashboardLayoutClient>
      <div className="flex h-screen bg-[#f5f3ff] dark:bg-[#09090b] overflow-hidden">
        <DashboardSidebar
          role={session.user.role}
          xp={dbUser?.xp ?? 0}
          level={dbUser?.level ?? 1}
          streak={dbUser?.streak ?? 0}
          subscriptionPlan={dbUser?.subscription?.plan ?? null}
          messagesBadge={unreads.messages}
          userName={dbUser?.name ?? session.user.name ?? ""}
          userAvatar={dbUser?.avatarUrl ?? null}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DashboardTopbar
            user={{
              id: session.user.id,
              name: dbUser?.name ?? session.user.name ?? "",
              email: session.user.email,
              image: dbUser?.avatarUrl ?? null,
              role: session.user.role,
            }}
            unreadNotifications={unreads.notifications}
            savedCoursesCount={savedCoursesCount}
          />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 min-w-0 overflow-y-auto">
              <div className="mx-auto px-4 py-4 sm:px-5 sm:py-5">
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
        {isStudent && (
          <RoboAgentClient
            firstName={dbUser?.name?.split(" ")[0] ?? session.user.name?.split(" ")[0] ?? "Student"}
            level={dbUser?.level ?? 1}
            xp={dbUser?.xp ?? 0}
            streak={dbUser?.streak ?? 0}
          />
        )}
      </div>
    </DashboardLayoutClient>
  );
}
