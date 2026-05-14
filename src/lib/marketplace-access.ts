import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type MarketplacePlan = "FREE" | "STANDARD" | "PRO" | "ALL_ACCESS";
export type LessonAccessLevel = "free_preview" | "standard" | "pro";

const activeStatuses = new Set<SubscriptionStatus>(["ACTIVE", "TRIALING"]);

export function getMarketplacePlan(
  plan?: SubscriptionPlan | string | null,
  status?: SubscriptionStatus | string | null,
): MarketplacePlan {
  if (status && !activeStatuses.has(status as SubscriptionStatus)) return "FREE";
  if (plan === "ENTERPRISE" || plan === "PREMIUM") return "ALL_ACCESS";
  if (plan === "PRO") return "PRO";
  if (plan === "STANDARD" || plan === "STUDENT" || plan === "BASIC") return "STANDARD";
  return "FREE";
}

export function getAiCreditLimit(plan: MarketplacePlan) {
  if (plan === "PRO") return 500;
  if (plan === "ALL_ACCESS") return 1500;
  if (plan === "STANDARD") return 100;
  return 5;
}

export function getAllowedLearningItemCount(plan: MarketplacePlan, totalItems: number) {
  if (totalItems <= 0) return 0;
  if (plan === "PRO" || plan === "ALL_ACCESS") return totalItems;
  if (plan === "STANDARD") return Math.min(totalItems, Math.max(5, Math.ceil(totalItems * 0.5)));
  return 1;
}

export function getRequiredPlanForIndex(index: number, totalItems: number): "FREE" | "STANDARD" | "PRO" {
  if (index === 0) return "FREE";
  const standardCount = getAllowedLearningItemCount("STANDARD", totalItems);
  return index < standardCount ? "STANDARD" : "PRO";
}

export function canAccessLearningItem(plan: MarketplacePlan, index: number, totalItems: number) {
  return index < getAllowedLearningItemCount(plan, totalItems);
}
