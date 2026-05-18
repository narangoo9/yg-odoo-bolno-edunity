// ─── modules/gamification/application/gamification-service.ts ───────────────

import { db } from "@/lib/db";
import { BadgeType, NotificationType, XpAction } from "@prisma/client";
import { invalidateCache, redis } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import { revalidateUserDashboard, revalidateUserSidebar } from "@/lib/dashboard-cache";
import { LEADERBOARD_USER_WHERE } from "@/lib/leaderboard/ranks";
import { getXpActionLabel } from "@/lib/gamification/xp-messages";
import { dashboardCacheTags } from "@/lib/dashboard-cache";

// ── XP тооцооны тогтмолууд ──────────────────────────────────────────
export const XP_REWARDS: Record<XpAction, number> = {
  LESSON_COMPLETE: 10,
  QUIZ_PASS: 20,
  QUIZ_PERFECT: 50,
  COURSE_COMPLETE: 100,
  STREAK_BONUS: 5,
  DAILY_CHALLENGE: 25,
  REVIEW_SUBMIT: 5,
  REFERRAL_SIGNUP: 200,
  SECTION_COMPLETE: 5,
  TASK_COMPLETE: 10,
  NOTE_CREATE: 2,
  FINAL_TASK_SUBMIT: 15,
  PEER_REVIEW_COMPLETE: 20,
};

// Level threshold — Purple-ын getLevelFromXP логик
export function getLevelFromXP(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2500) return 6;
  if (xp < 4000) return 7;
  if (xp < 6000) return 8;
  if (xp < 9000) return 9;
  return 10;
}

// ── XP нэмэх ── гол функц ───────────────────────────────────────────
export type AwardXPResult = {
  xp: number;
  level: number;
  leveledUp: boolean;
  newBadges: BadgeType[];
  amount: number;
  action: XpAction;
  reason: string;
};

async function createXpNotification(
  userId: string,
  amount: number,
  reason: string,
  leveledUp: boolean,
  level: number,
) {
  const title = leveledUp ? `Level ${level} боллоо! +${amount} XP` : `+${amount} XP олсон`;
  const body = leveledUp ? `${reason} · Шинэ түвшинд хүрлээ` : reason;

  await db.notification.create({
    data: {
      userId,
      type: NotificationType.SYSTEM,
      title,
      body,
      data: { amount, leveledUp, level, reason },
    },
  });
  await invalidateCache(dashboardCacheTags.notifications(userId));
}

export async function awardXP(
  userId: string,
  action: XpAction,
  entityId?: string,
): Promise<AwardXPResult> {
  const amount = XP_REWARDS[action];
  const reason = getXpActionLabel(action);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
      select: { xp: true },
    });

    // 2. XP log
    await tx.xpLog.create({
      data: { userId, action, amount, entityId },
    });

    // 3. Leaderboard sync
    await tx.leaderboardEntry.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: amount,
        weeklyXp: amount,
        monthlyXp: amount,
      },
      update: {
        totalXp: { increment: amount },
        weeklyXp: { increment: amount },
        monthlyXp: { increment: amount },
      },
    });

    return user;
  });

  const oldXP = result.xp - amount;
  const newLevel = getLevelFromXP(result.xp);
  const oldLevel = getLevelFromXP(oldXP);
  const leveledUp = newLevel > oldLevel;

  if (newLevel !== oldLevel) {
    await db.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }

  await invalidateCache("leaderboard:*");
  revalidateUserDashboard(userId);
  revalidateUserSidebar(userId);

  const newBadges = await checkAndAwardBadges(userId, action, result.xp);

  await createXpNotification(userId, amount, reason, leveledUp, newLevel).catch(() => null);

  return { xp: result.xp, level: newLevel, leveledUp, newBadges, amount, action, reason };
}

// ── Streak шинэчлэх (өдөр бүр эхний идэвхтэй үед) ─────────────────────
async function applyDailyStreakUpdate(userId: string): Promise<{ streak: number; updated: boolean }> {
  if (redis) {
    const today = new Date().toISOString().slice(0, 10);
    const lockKey = `streak:lock:${userId}:${today}`;
    const acquired = await redis.set(lockKey, "1", "EX", 86400, "NX");
    if (!acquired) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true } });
      return { streak: user?.streak ?? 0, updated: false };
    }
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastStreakAt: true },
    });

    if (!user) return { streak: 0, updated: false };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastStreak = user.lastStreakAt
      ? new Date(user.lastStreakAt.getFullYear(), user.lastStreakAt.getMonth(), user.lastStreakAt.getDate())
      : null;

    if (lastStreak && lastStreak.getTime() === today.getTime()) {
      return { streak: user.streak, updated: false };
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const continued = lastStreak && lastStreak.getTime() === yesterday.getTime();
    const streak = continued ? user.streak + 1 : 1;

    await tx.user.update({
      where: { id: userId },
      data: { streak, lastStreakAt: now },
    });

    return { streak, updated: true };
  });
}

export async function updateStreak(userId: string): Promise<number> {
  const { streak, updated } = await applyDailyStreakUpdate(userId);
  if (updated) {
    await awardXP(userId, XpAction.STREAK_BONUS).catch(() => null);
    await checkStreakBadges(userId, streak);
    revalidateUserSidebar(userId);
  }
  return streak;
}

/** Нэвтрэх / dashboard нээхэд streak шинэчлэнэ */
export async function recordDailyVisit(userId: string): Promise<number> {
  return updateStreak(userId);
}

// ── Badge шалгах ────────────────────────────────────────────────────
async function checkAndAwardBadges(
  userId: string,
  action: XpAction,
  totalXp: number
): Promise<BadgeType[]> {
  const earned: BadgeType[] = [];

  const existing = await db.userBadge.findMany({
    where: { userId },
    select: { badge: true },
  });
  const existingSet = new Set(existing.map((b) => b.badge));

  const toCheck: Array<{ badge: BadgeType; condition: boolean }> = [
    {
      badge: BadgeType.FIRST_LESSON,
      condition: action === XpAction.LESSON_COMPLETE,
    },
    {
      badge: BadgeType.QUIZ_MASTER,
      condition: action === XpAction.QUIZ_PERFECT,
    },
    {
      badge: BadgeType.PERFECT_SCORE,
      condition: action === XpAction.QUIZ_PERFECT,
    },
  ];

  // TOP_10 badge — leaderboard rank шалгах
  if (!existingSet.has(BadgeType.TOP_10)) {
    const rank = await db.leaderboardEntry.count({
      where: { totalXp: { gt: totalXp }, user: LEADERBOARD_USER_WHERE },
    });
    if (rank < 10) toCheck.push({ badge: BadgeType.TOP_10, condition: true });
  }

  for (const { badge, condition } of toCheck) {
    if (condition && !existingSet.has(badge)) {
      await db.userBadge.create({ data: { userId, badge } }).catch(() => null);
      earned.push(badge);
    }
  }

  return earned;
}

async function checkStreakBadges(userId: string, streak: number) {
  const milestones: Array<[number, BadgeType]> = [
    [7, BadgeType.STREAK_7],
    [30, BadgeType.STREAK_30],
    [100, BadgeType.STREAK_100],
  ];

  for (const [days, badge] of milestones) {
    if (streak >= days) {
      await db.userBadge
        .create({ data: { userId, badge } })
        .catch(() => null); // unique constraint → ignore duplicate
    }
  }
}

// ── Lesson дуусгах → XP + streak ────────────────────────────────────
export async function completeLesson(
  userId: string,
  lessonId: string,
  courseId: string
) {
  // Аль хэдийн дуусгасан эсэх
  const existing = await db.progress.findUnique({
    where: { studentId_lessonId: { studentId: userId, lessonId } },
    select: { isCompleted: true },
  });

  if (existing?.isCompleted) {
    return { alreadyCompleted: true };
  }

  // Progress update
  await db.progress.upsert({
    where: { studentId_lessonId: { studentId: userId, lessonId } },
    create: {
      studentId: userId,
      lessonId,
      courseId,
      isCompleted: true,
      completedAt: new Date(),
    },
    update: {
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  // XP + streak
  const [xpResult, streak] = await Promise.all([
    awardXP(userId, XpAction.LESSON_COMPLETE, lessonId),
    updateStreak(userId),
  ]);

  // Course бүхэлдээ дууссан эсэх шалгах
  await checkCourseCompletion(userId, courseId);

  revalidatePath("/student");
  revalidatePath(`/student/courses/${courseId}`);

  return { ...xpResult, streak };
}

// ── Course дуусгах шалгалт ───────────────────────────────────────────
async function checkCourseCompletion(userId: string, courseId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({
      where: { module: { courseId } },
    }),
    db.progress.count({
      where: { studentId: userId, courseId, isCompleted: true },
    }),
  ]);

  if (totalLessons > 0 && totalLessons === completedLessons) {
    // Enrollment update
    await db.enrollment.updateMany({
      where: { studentId: userId, courseId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    revalidateUserSidebar(userId);

    // Course complete XP
    await awardXP(userId, XpAction.COURSE_COMPLETE, courseId);

    // FIRST_COURSE badge
    const courseCount = await db.enrollment.count({
      where: { studentId: userId, status: "COMPLETED" },
    });
    if (courseCount === 1) {
      await db.userBadge
        .create({ data: { userId, badge: BadgeType.FIRST_COURSE } })
        .catch(() => null);
    }
  }
}
