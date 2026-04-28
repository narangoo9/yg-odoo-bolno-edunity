import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

const courseAccessPlans = new Set<SubscriptionPlan>(["STUDENT", "PREMIUM", "PRO", "ENTERPRISE"]);
const activeSubscriptionStatuses = new Set<SubscriptionStatus>(["ACTIVE", "TRIALING"]);

export function isUpgradedStudentPlan(plan?: SubscriptionPlan | string | null) {
  if (!plan) return false;
  return courseAccessPlans.has(plan as SubscriptionPlan);
}

export function hasActiveCourseAccess(
  plan?: SubscriptionPlan | string | null,
  status?: SubscriptionStatus | string | null,
) {
  if (!isUpgradedStudentPlan(plan)) return false;
  if (!status) return true;
  return activeSubscriptionStatuses.has(status as SubscriptionStatus);
}
