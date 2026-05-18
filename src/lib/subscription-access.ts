import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { canAccessPremium, getEffectivePlan, hasActiveSubscription } from "@/lib/billing/plans";

export function isUpgradedStudentPlan(
  plan?: SubscriptionPlan | string | null,
  status?: SubscriptionStatus | string | null,
) {
  const effective = getEffectivePlan(plan, status);
  return canAccessPremium(effective);
}

export function hasActiveCourseAccess(
  plan?: SubscriptionPlan | string | null,
  status?: SubscriptionStatus | string | null,
) {
  if (!canAccessPremium(getEffectivePlan(plan, status))) return false;
  return hasActiveSubscription(status);
}
