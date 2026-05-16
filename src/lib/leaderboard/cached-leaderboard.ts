import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

const LEADERBOARD_TAG = "leaderboard";

export type LeaderboardRow = {
  id: string;
  userId: string;
  weeklyXp: number;
  monthlyXp: number;
  totalXp: number;
  rank: number | null;
  weeklyRank: number | null;
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
    take: 50,
    orderBy: { [orderField]: "desc" },
    select: {
      id: true,
      userId: true,
      weeklyXp: true,
      monthlyXp: true,
      totalXp: true,
      rank: true,
      weeklyRank: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, avatarUrl: true, streak: true, level: true },
      },
    },
  });

  return entries.filter((e): e is LeaderboardRow => Boolean(e.user));
}

export function getCachedGlobalLeaderboard() {
  return unstable_cache(() => fetchLeaderboard("totalXp"), ["leaderboard-global"], {
    revalidate: 30,
    tags: [LEADERBOARD_TAG],
  })();
}

export function getCachedWeeklyLeaderboard() {
  return unstable_cache(() => fetchLeaderboard("weeklyXp"), ["leaderboard-weekly"], {
    revalidate: 30,
    tags: [LEADERBOARD_TAG],
  })();
}
