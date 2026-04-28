import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LeaderboardClient } from "@/components/student/LeaderboardClient";

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
        requester: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            level: true,
            leaderboard: { select: { totalXp: true, weeklyXp: true, rank: true } },
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            level: true,
            leaderboard: { select: { totalXp: true, weeklyXp: true, rank: true } },
          },
        },
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
    return await db.user.findUnique({
      where: { id: userId },
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

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/student");

  const [globalEntries, myEntry, friendships] = await Promise.all([
    db.leaderboardEntry.findMany({
      take: 50,
      orderBy: { totalXp: "desc" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, streak: true, level: true } },
      },
    }),
    db.leaderboardEntry.findUnique({
      where: { userId: session.user.id },
      select: { rank: true, weeklyXp: true, monthlyXp: true, totalXp: true, weeklyRank: true },
    }),
    getAcceptedFriendships(session.user.id),
  ]);

  // Build global leaderboard with rank numbers
  const globalRanked = globalEntries.map((e, idx) => ({ ...e, rank: idx + 1 }));

  // Weekly leaderboard
  const weeklyRanked = [...globalEntries]
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
    .map((e, idx) => ({ ...e, weeklyRank: idx + 1 }));

  // Friends leaderboard
  const friendIds = new Set(
    friendships.map(f =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    )
  );
  const friendEntries = globalRanked.filter(e => friendIds.has(e.userId) || e.userId === session.user.id);

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
