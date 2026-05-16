import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { dashboardCacheTags } from "@/lib/dashboard-cache";

/** Dashboard layout — профайл + gamification (Neon = эх сурвалж). */
export type DashboardUserSnapshot = {
  name: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
  subscription: { plan: string } | null;
};

export function getCachedDashboardUser(userId: string) {
  return unstable_cache(
    async (): Promise<DashboardUserSnapshot | null> => {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          avatarUrl: true,
          xp: true,
          level: true,
          streak: true,
          subscription: { select: { plan: true } },
        },
      });
      if (!row) return null;
      return {
        name: row.name,
        avatarUrl: row.avatarUrl,
        xp: row.xp,
        level: row.level,
        streak: row.streak,
        subscription: row.subscription,
      };
    },
    [`dashboard-user-${userId}`],
    { revalidate: 30, tags: [dashboardCacheTags.user(userId)] },
  )();
}
