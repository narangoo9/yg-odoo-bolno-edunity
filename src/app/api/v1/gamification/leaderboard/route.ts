// src/app/api/v1/gamification/leaderboard/route.ts
// GET /api/v1/gamification/leaderboard?type=global|weekly|monthly&limit=50

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";
import { ok, unauthorized, serverError } from "@/shared/utils/api-response";

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
      `leaderboard:${type}:${limit}`,
      60,
      () =>
        db.leaderboardEntry.findMany({
          take: limit,
          orderBy: { [orderField]: "desc" },
          include: {
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
        })
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
      // Нэг л DB query — count + myEntry нэгтгэв
      const myEntry = await db.leaderboardEntry.findUnique({
        where: { userId: session.user.id },
        select: { totalXp: true, weeklyXp: true, monthlyXp: true },
      });

      if (myEntry) {
        myXp = myEntry[orderField as keyof typeof myEntry] as number;
        myRank =
          (await db.leaderboardEntry.count({
            where: { [orderField]: { gt: myXp } },
          })) + 1;
      }
    }

    return ok({ leaderboard, myRank, myXp });
  } catch {
    return serverError();
  }
}

