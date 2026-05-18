import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type LeaderboardXpField = "totalXp" | "weeklyXp" | "monthlyXp";

/** Only active student accounts appear on the public leaderboard. */
export const LEADERBOARD_USER_WHERE = {
  status: "ACTIVE" as const,
  role: "USER" as const,
};

export function leaderboardEntriesWhere(field: LeaderboardXpField): Prisma.LeaderboardEntryWhereInput {
  return { user: LEADERBOARD_USER_WHERE };
}

/**
 * Live rank among active students (1 = best).
 * Does not use the stale `rank` column on leaderboard_entries.
 */
export async function getLiveLeaderboardRank(
  userId: string,
  field: LeaderboardXpField = "totalXp",
): Promise<{ rank: number; xp: number } | null> {
  const [entry, user] = await Promise.all([
    db.leaderboardEntry.findUnique({
      where: { userId },
      select: { totalXp: true, weeklyXp: true, monthlyXp: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, status: true, role: true },
    }),
  ]);

  if (!user || user.status !== "ACTIVE" || user.role !== "USER") {
    return null;
  }

  const xp =
    field === "weeklyXp"
      ? (entry?.weeklyXp ?? 0)
      : field === "monthlyXp"
        ? (entry?.monthlyXp ?? 0)
        : Math.max(entry?.totalXp ?? 0, user.xp);

  const higherCount = await db.leaderboardEntry.count({
    where: {
      [field]: { gt: xp },
      user: LEADERBOARD_USER_WHERE,
    },
  });

  return { rank: higherCount + 1, xp };
}

/** Assign display ranks 1..n based on current sort order (global / weekly lists). */
export function assignSequentialRanks<T>(entries: T[]): Array<T & { rank: number; weeklyRank: number }> {
  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    weeklyRank: index + 1,
  }));
}
