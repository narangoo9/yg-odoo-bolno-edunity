// src/app/api/v1/gamification/leaderboard/route.ts
// GET /api/v1/gamification/leaderboard?type=global|weekly|monthly&limit=50

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";
import { getLiveLeaderboardRank, LEADERBOARD_USER_WHERE } from "@/lib/leaderboard/ranks";
import { ok, unauthorized, serverError } from "@/shared/utils/api-response";

const leaderboardEntrySelect = {
  userId: true,
  weeklyXp: true,
  monthlyXp: true,
  totalXp: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "global"; // global | weekly | monthly
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const orderField =
      type === "weekly" ? "weeklyXp" :
      type === "monthly" ? "monthlyXp" : "totalXp";

    // Top N жагсаалт — cache-тай (60 секунд)
    const entries = await cached(
      `leaderboard:${type}:${limit}:v2`,
      60,
      async () => {
        const leaderboardEntries = await db.leaderboardEntry.findMany({
          where: { user: LEADERBOARD_USER_WHERE },
          take: limit,
          orderBy: { [orderField]: "desc" },
          select: {
            ...leaderboardEntrySelect,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                streak: true,
                level: true,
              },
            },
          },
        });

        return leaderboardEntries;
      }
    );

    const leaderboard = entries.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.userId,
      name: entry.user.name,
      avatarUrl: entry.user.avatarUrl,
      streak: entry.user.streak,
      level: entry.user.level,
      xp: entry[orderField as keyof typeof entry] as number,
      isMe: entry.userId === session.user.id,
    }));

    // Өөрийн мэдээлэл — top N жагсаалтаас хайна, олдохгүй бол DB query нэг удаа
    const meInTop = leaderboard.find((e) => e.isMe);

    let myRank: number | null = meInTop?.rank ?? null;
    let myXp = meInTop?.xp ?? 0;

    if (!meInTop) {
      const field =
        type === "weekly" ? "weeklyXp" : type === "monthly" ? "monthlyXp" : "totalXp";
      const live = await getLiveLeaderboardRank(session.user.id, field);
      if (live) {
        myXp = live.xp;
        myRank = live.rank;
      }
    }

    return ok({ leaderboard, myRank, myXp });
  } catch {
    return serverError();
  }
}
