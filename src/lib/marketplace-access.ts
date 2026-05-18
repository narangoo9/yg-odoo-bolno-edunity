import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import {
  type PlanId,
  canAccessLearningItem,
  getEffectivePlan,
  getAiDailyLimit,
  normalizePlanId,
} from "@/lib/billing/plans";

/** @deprecated Use PlanId from billing/plans */
export type MarketplacePlan = PlanId;

export type LessonAccessLevel = "free_preview" | "standard" | "premium" | "pro";

export function getMarketplacePlan(
  plan?: SubscriptionPlan | string | null,
  status?: SubscriptionStatus | string | null,
): PlanId {
  return getEffectivePlan(plan, status);
}

export function getAiCreditLimit(plan: PlanId) {
  return getAiDailyLimit(plan) * 10;
}

export function getAllowedLearningItemCount(plan: PlanId, totalItems: number) {
  if (totalItems <= 0) return 0;
  let count = 0;
  for (let i = 0; i < totalItems; i++) {
    if (canAccessLearningItem(plan, i, totalItems)) count++;
    else break;
  }
  return count;
}

export function getRequiredPlanForIndex(
  index: number,
  totalItems: number,
): PlanId {
  if (index === 0) return "STANDARD";
  const premiumCount = getAllowedLearningItemCount("PREMIUM", totalItems);
  return index < premiumCount ? "PREMIUM" : "PRO";
}

export { canAccessLearningItem };

export function mapLegacyAccessPlan(plan: string | undefined): PlanId {
  return normalizePlanId(plan);
}
