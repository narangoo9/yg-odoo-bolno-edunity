import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { LEADERBOARD_USER_WHERE } from "@/lib/leaderboard/ranks";

const LEADERBOARD_TAG = "leaderboard";

export type LeaderboardRow = {
  id: string;
  userId: string;
  weeklyXp: number;
  monthlyXp: number;
  totalXp: number;
  rank: number;
  weeklyRank: number;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    streak: number;
    level: number;
  };
};

async function fetchLeaderboard(orderField: "totalXp" | "weeklyXp"): Promise<LeaderboardRow[]> {
  const entries = await db.leaderboardEntry.findMany({
    where: { user: LEADERBOARD_USER_WHERE },
    orderBy: { [orderField]: "desc" },
    take: 100,
    select: {
      id: true,
      userId: true,
      weeklyXp: true,
      monthlyXp: true,
      totalXp: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, avatarUrl: true, streak: true, level: true },
      },
    },
  });

  return entries
    .slice(0, 50)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      weeklyRank: index + 1,
    }));
}

export function getCachedGlobalLeaderboard() {
  return unstable_cache(() => fetchLeaderboard("totalXp"), ["leaderboard-global-v2"], {
    revalidate: 30,
    tags: [LEADERBOARD_TAG],
  })();
}

export function getCachedWeeklyLeaderboard() {
  return unstable_cache(() => fetchLeaderboard("weeklyXp"), ["leaderboard-weekly-v2"], {
    revalidate: 30,
    tags: [LEADERBOARD_TAG],
  })();
}
