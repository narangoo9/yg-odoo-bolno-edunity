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
    take: 100,
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
    },
  });

  const users = await db.user.findMany({
    where: { id: { in: [...new Set(entries.map((entry) => entry.userId))] } },
    select: { id: true, name: true, avatarUrl: true, streak: true, level: true },
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  return entries
    .flatMap((entry) => {
      const user = usersById.get(entry.userId);
      return user ? [{ ...entry, user }] : [];
    })
    .slice(0, 50);
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
