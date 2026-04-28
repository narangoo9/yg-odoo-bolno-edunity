// src/app/api/v1/gamification/daily-challenge/route.ts
// GET  /api/v1/gamification/daily-challenge  — өнөөдрийн challenge авах
// POST /api/v1/gamification/daily-challenge  — хариулт илгээх

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP } from "@/modules/gamification/application/gamification-service";
import { ok, unauthorized, badRequest, serverError } from "@/shared/utils/api-response";
import { XpAction } from "@prisma/client";
import { z } from "zod";

// ── GET: өнөөдрийн challenge + өөрийн completion status ─────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    // Өнөөдрийн огноо (UTC, цаг байхгүй)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const challenge = await db.dailyChallenge.findFirst({
      where: { date: today },
      select: {
        id: true,
        question: true,
        options: true,
        xpReward: true,
        // correctIdx — GET-д буцаахгүй, POST-д л шалгана
        completions: {
          where: { userId: session.user.id },
          select: { isCorrect: true, completedAt: true },
        },
      },
    });

    if (!challenge) {
      return ok({ available: false });
    }

    const myCompletion = challenge.completions[0] ?? null;

    return ok({
      available: true,
      id: challenge.id,
      question: challenge.question,
      options: challenge.options, // string[]
      xpReward: challenge.xpReward,
      completed: !!myCompletion,
      // Дуусгасан бол хариулт харуулна
      result: myCompletion
        ? { isCorrect: myCompletion.isCorrect, completedAt: myCompletion.completedAt }
        : null,
    });
  } catch {
    return serverError();
  }
}

// ── POST: хариулт илгээх ─────────────────────────────────────────────
const answerSchema = z.object({
  challengeId: z.string(),
  selectedIdx: z.number().int().min(0).max(3),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid answer");

    const { challengeId, selectedIdx } = parsed.data;

    // Challenge олох + correctIdx авах
    const challenge = await db.dailyChallenge.findUnique({
      where: { id: challengeId },
      select: { correctIdx: true, xpReward: true },
    });

    if (!challenge) return badRequest("Challenge not found");

    // Давтаж хариулсан эсэх
    const existing = await db.dailyChallengeCompletion.findUnique({
      where: {
        userId_challengeId: {
          userId: session.user.id,
          challengeId,
        },
      },
    });

    if (existing) return badRequest("Already completed today's challenge");

    const isCorrect = selectedIdx === challenge.correctIdx;

    // Completion хадгалах
    await db.dailyChallengeCompletion.create({
      data: {
        userId: session.user.id,
        challengeId,
        isCorrect,
      },
    });

    // Зөв бол XP олгоно
    let xpResult = null;
    if (isCorrect) {
      xpResult = await awardXP(session.user.id, XpAction.DAILY_CHALLENGE, challengeId);
    }

    return ok({
      isCorrect,
      correctIdx: challenge.correctIdx,
      xpEarned: isCorrect ? challenge.xpReward : 0,
      ...(xpResult ?? {}),
    });
  } catch {
    return serverError();
  }
}
