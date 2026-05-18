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
import { getLiveLeaderboardRank, LEADERBOARD_USER_WHERE } from "@/lib/leaderboard/ranks";

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
    where: { userId: { in: ids }, user: LEADERBOARD_USER_WHERE },
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
    orderBy: { totalXp: "desc" },
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    weeklyRank: index + 1,
  }));
}

async function getMyLeaderboardEntry(userId: string) {
  const [globalLive, weeklyLive, entry] = await Promise.all([
    getLiveLeaderboardRank(userId, "totalXp"),
    getLiveLeaderboardRank(userId, "weeklyXp"),
    db.leaderboardEntry.findUnique({
      where: { userId },
      select: { monthlyXp: true },
    }),
  ]);

  return {
    rank: globalLive?.rank ?? null,
    weeklyXp: weeklyLive?.xp ?? 0,
    monthlyXp: entry?.monthlyXp ?? 0,
    totalXp: globalLive?.xp ?? 0,
    weeklyRank: weeklyLive?.rank ?? null,
  };
}

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "USER") redirect("/student");

  const [globalEntries, weeklyEntries, myEntry, friendships] = await Promise.all([
    getCachedGlobalLeaderboard(),
    getCachedWeeklyLeaderboard(),
    getMyLeaderboardEntry(session.user.id),
    getAcceptedFriendships(session.user.id),
  ]);

  const globalRanked = globalEntries;
  const weeklyRanked = weeklyEntries.map((e) => ({
    ...e,
    weeklyRank: e.rank,
  }));

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
