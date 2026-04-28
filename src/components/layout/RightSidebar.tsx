import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { dashboardCacheTags } from "@/lib/dashboard-cache";
import { RightSidebarClient } from "./RightSidebarClient";

const getCachedSidebarData = (userId: string) =>
  unstable_cache(
    async () => {
      const [user, leaderboard, enrollments] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { name: true, avatarUrl: true, xp: true, level: true, streak: true, email: true },
        }),
        db.leaderboardEntry.findUnique({
          where: { userId },
          select: { rank: true, weeklyXp: true },
        }),
        db.enrollment.findMany({
          where: { studentId: userId },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                instructor: { select: { name: true } },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
          take: 8,
        }),
      ]);

      return { user, leaderboard, enrollments };
    },
    [`right-sidebar-${userId}`],
    {
      revalidate: 60,
      tags: [dashboardCacheTags.user(userId), dashboardCacheTags.sidebar(userId)],
    },
  )();

export async function RightSidebar({ userId }: { userId: string }) {
  const { user, leaderboard, enrollments } = await getCachedSidebarData(userId).catch(() => ({
    user: null,
    leaderboard: null,
    enrollments: [],
  }));

  if (!user) return null;

  const activeEnrollments = enrollments.filter((e) => e.status !== "COMPLETED");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");
  const inProgressCourses = activeEnrollments.slice(0, 3);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activeDayIndices =
    user.streak > 0
      ? Array.from({ length: Math.min(user.streak, 7) }, (_, i) => (dayOfWeek - i + 7) % 7)
      : [];

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    return {
      label: days[i],
      date: d.getDate(),
      active: activeDayIndices.includes(i),
      isToday: d.getDate() === today.getDate(),
    };
  });

  return (
    <RightSidebarClient
      user={user}
      leaderboard={leaderboard}
      enrollments={enrollments}
      week={week}
      weeklyXp={leaderboard?.weeklyXp ?? 0}
      goalsThisMonth={completedEnrollments.length}
      activeEnrollments={activeEnrollments}
      completedEnrollments={completedEnrollments}
      inProgressCourses={inProgressCourses}
    />
  );
}
