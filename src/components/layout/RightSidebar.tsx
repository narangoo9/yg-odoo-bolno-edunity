import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { dashboardCacheTags } from "@/lib/dashboard-cache";
import { RightSidebarClient } from "./RightSidebarClient";

const getCachedSidebarData = (userId: string) =>
  unstable_cache(
    async () => {
      const [user, leaderboard, enrollments, certificates, completedLessons] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            avatarUrl: true,
            xp: true,
            level: true,
            streak: true,
            email: true,
            onboardingCompleted: true,
          },
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
        db.certificate.count({ where: { studentId: userId } }),
        db.progress.count({ where: { studentId: userId, isCompleted: true } }),
      ]);

      return { user, leaderboard, enrollments, certificates, completedLessons };
    },
    [`right-sidebar-${userId}`],
    {
      revalidate: 60,
      tags: [dashboardCacheTags.user(userId), dashboardCacheTags.sidebar(userId)],
    },
  )();

export async function RightSidebar({ userId }: { userId: string }) {
  const { user, leaderboard, enrollments, certificates, completedLessons } =
    await getCachedSidebarData(userId).catch(() => ({
      user: null,
      leaderboard: null,
      enrollments: [],
      certificates: 0,
      completedLessons: 0,
    }));

  if (!user) return null;

  const activeEnrollments = enrollments.filter((e) => e.status !== "COMPLETED");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");
  const inProgressCourses = activeEnrollments.slice(0, 3);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const days = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
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
      serverOnboarding={{
        onboardingCompleted: user.onboardingCompleted,
        enrolledCourses: enrollments.length,
        completedLessons,
        certificates,
        hasCustomAvatar: Boolean(user.avatarUrl),
      }}
    />
  );
}
