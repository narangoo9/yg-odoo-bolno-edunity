import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LeaderboardClient } from "@/components/student/LeaderboardClient";
import {
  getCachedGlobalLeaderboard,
  getCachedWeeklyLeaderboard,
} from "@/lib/leaderboard/cached-leaderboard";

function isMissingFriendshipsTable(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021";
  }

  return error instanceof Error && error.message.includes("public.friendships");
}

function isMissingReferralCodeColumn(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2022";
  }

  return error instanceof Error && error.message.includes("users.referralCode");
}

async function getAcceptedFriendships(userId: string) {
  try {
    return await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });
  } catch (error) {
    if (isMissingFriendshipsTable(error)) {
      console.warn('Missing "friendships" table; falling back to an empty friends leaderboard.');
      return [];
    }

    throw error;
  }
}

async function getLeaderboardUser(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, avatarUrl: true, level: true, referralCode: true },
    });

    if (!user || user.referralCode) return user;

    return await db.user.update({
      where: { id: userId },
      data: { referralCode: randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase() },
      select: { name: true, avatarUrl: true, level: true, referralCode: true },
    });
  } catch (error) {
    if (isMissingReferralCodeColumn(error)) {
      console.warn('Missing "users.referralCode" column; falling back to a profile without referral data.');
      return await db.user.findUnique({
        where: { id: userId },
        select: { name: true, avatarUrl: true, level: true },
      }).then((user) => (user ? { ...user, referralCode: null } : null));
    }

    throw error;
  }
}

export const metadata: Metadata = { title: "Leaderboard — EduNity" };

async function getLeaderboardEntriesForUsers(userIds: string[]) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return [];

  const entries = await db.leaderboardEntry.findMany({
    where: { userId: { in: ids } },
    select: {
      id: true,
      userId: true,
      weeklyXp: true,
      monthlyXp: true,
      totalXp: true,
      rank: true,
      weeklyRank: true,
      updatedAt: true,
      user: { select: { id: true, name: true, avatarUrl: true, streak: true, level: true } },
    },
  });

  return entries
    .filter((entry) => entry.user)
    .map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      weeklyXp: entry.weeklyXp,
      monthlyXp: entry.monthlyXp,
      totalXp: entry.totalXp,
      rank: entry.rank,
      weeklyRank: entry.weeklyRank,
      updatedAt: entry.updatedAt,
      user: entry.user!,
    }))
    .sort((a, b) => b.totalXp - a.totalXp);
}

async function getMyLeaderboardEntry(userId: string) {
  const myEntry = await db.leaderboardEntry.findUnique({
    where: { userId },
    select: { rank: true, weeklyXp: true, monthlyXp: true, totalXp: true, weeklyRank: true },
  });

  const totalXp = myEntry?.totalXp ?? 0;
  const weeklyXp = myEntry?.weeklyXp ?? 0;
  const [rank, weeklyRank] = await Promise.all([
    db.leaderboardEntry.count({ where: { totalXp: { gt: totalXp } } }),
    db.leaderboardEntry.count({ where: { weeklyXp: { gt: weeklyXp } } }),
  ]);

  return {
    rank: rank + 1,
    weeklyXp,
    monthlyXp: myEntry?.monthlyXp ?? 0,
    totalXp,
    weeklyRank: weeklyRank + 1,
  };
}

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/student");

  const [globalEntries, weeklyEntries, myEntry, friendships] = await Promise.all([
    getCachedGlobalLeaderboard(),
    getCachedWeeklyLeaderboard(),
    getMyLeaderboardEntry(session.user.id),
    getAcceptedFriendships(session.user.id),
  ]);

  // Build global leaderboard with rank numbers
  const globalRanked = globalEntries.map((e, idx) => ({ ...e, rank: idx + 1 }));

  // Weekly leaderboard
  const weeklyRanked = weeklyEntries.map((e, idx) => ({ ...e, weeklyRank: idx + 1 }));

  // Friends leaderboard
  const friendIds = new Set(
    friendships.map(f =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    )
  );
  const friendEntries = await getLeaderboardEntriesForUsers([...friendIds, session.user.id]);

  // My user info
  const myUser = await getLeaderboardUser(session.user.id);

  return (
    <LeaderboardClient
      globalEntries={globalRanked}
      weeklyEntries={weeklyRanked}
      friendEntries={friendEntries}
      currentUserId={session.user.id}
      myEntry={myEntry}
      myUser={myUser}
      friendCount={friendIds.size}
    />
  );
}
