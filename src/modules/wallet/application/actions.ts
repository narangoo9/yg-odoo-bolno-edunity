"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

// Business rule: 1000 XP = $1-equivalent credit; lifetime cap = $100 per user
const XP_PER_CREDIT = 1000;
const MAX_LIFETIME_CREDITS = new Decimal(100);

// ─── CONVERT XP TO WALLET CREDITS ────────────────────────────────────────────

export async function convertXpToCredits(xpToSpend: number) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  if (xpToSpend < XP_PER_CREDIT || xpToSpend % XP_PER_CREDIT !== 0) {
    return { error: `XP дүн ${XP_PER_CREDIT}-ын үржвэр байх ёстой` };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, walletBalance: true, xpCreditsEarned: true },
  });
  if (!user) return { error: "Хэрэглэгч олдсонгүй" };

  if (user.xp < xpToSpend) {
    return { error: `XP хүрэлцэхгүй байна. Танд ${user.xp} XP байна.` };
  }

  const creditsToEarn = new Decimal(xpToSpend / XP_PER_CREDIT);
  const remainingCap = MAX_LIFETIME_CREDITS.minus(user.xpCreditsEarned);

  if (remainingCap.lte(0)) {
    return { error: "XP-ийн хөрвүүлэх дээд хязгаарт хүрсэн байна ($100)" };
  }

  const actualCredits = creditsToEarn.gt(remainingCap) ? remainingCap : creditsToEarn;
  const actualXpSpent = actualCredits.times(XP_PER_CREDIT).toNumber();

  const newBalance = new Decimal(user.walletBalance.toString()).plus(actualCredits);
  const newXpCreditsEarned = new Decimal(user.xpCreditsEarned.toString()).plus(actualCredits);

  const result = await db.$transaction(async (tx) => {
    const conversion = await tx.xpConversion.create({
      data: {
        userId: session.user.id,
        xpAmount: actualXpSpent,
        creditAmount: actualCredits,
      },
    });

    const credit = await tx.walletCredit.create({
      data: {
        userId: session.user.id,
        amount: actualCredits,
        balanceAfter: newBalance,
        source: "xp_conversion",
        description: `${actualXpSpent} XP → $${actualCredits.toFixed(2)} кредит`,
        xpConversionId: conversion.id,
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        xp: { decrement: actualXpSpent },
        walletBalance: newBalance,
        xpCreditsEarned: newXpCreditsEarned,
      },
    });

    return { conversion, credit };
  });

  return {
    success: true,
    creditsEarned: actualCredits.toFixed(2),
    xpSpent: actualXpSpent,
    newBalance: newBalance.toFixed(2),
  };
}

// ─── GET WALLET SUMMARY ───────────────────────────────────────────────────────

export async function getWalletSummary() {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      xp: true,
      walletBalance: true,
      xpCreditsEarned: true,
    },
  });
  if (!user) return { error: "Хэрэглэгч олдсонгүй" };

  const recentCredits = await db.walletCredit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const remainingCap = MAX_LIFETIME_CREDITS.minus(
    new Decimal(user.xpCreditsEarned.toString())
  );
  const maxConvertibleXp = Math.floor(user.xp / XP_PER_CREDIT) * XP_PER_CREDIT;

  return {
    success: true,
    xp: user.xp,
    walletBalance: new Decimal(user.walletBalance.toString()).toFixed(2),
    xpCreditsEarned: new Decimal(user.xpCreditsEarned.toString()).toFixed(2),
    remainingCap: remainingCap.lte(0) ? "0.00" : remainingCap.toFixed(2),
    maxConvertibleXp,
    canConvert: maxConvertibleXp >= XP_PER_CREDIT && remainingCap.gt(0),
    recentCredits,
  };
}

// ─── COMMISSION HELPER (used by payment webhook) ──────────────────────────────

export async function calculateCommission(
  organizationId: string,
  grossAmount: Decimal
): Promise<{ commissionRate: Decimal; commissionAmount: Decimal; orgAmount: Decimal }> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { commissionRate: true },
  });

  const rate = org?.commissionRate ?? new Decimal(20);
  const commissionAmount = grossAmount.times(rate).dividedBy(100).toDecimalPlaces(2);
  const orgAmount = grossAmount.minus(commissionAmount);

  return { commissionRate: rate, commissionAmount, orgAmount };
}
