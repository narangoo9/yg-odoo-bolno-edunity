import { z } from "zod";
import { env } from "@/lib/env";
import {
  type PlanId,
  PAID_PLAN_IDS,
  getPlanById,
  isPaidPlan,
  normalizePlanId,
} from "@/lib/billing/plans";

export const checkoutPlanIdSchema = z.enum(["PREMIUM", "PRO"]);

export function assertStripeBillingConfigured(planId: PlanId): string {
  if (!isPaidPlan(planId)) {
    throw new Error("STANDARD does not use Stripe checkout");
  }

  const priceId =
    planId === "PREMIUM"
      ? env.stripePremiumPriceId || env.stripePremiumMonthlyPriceId
      : env.stripeProPriceId || env.stripeProMonthlyPriceId;

  if (!priceId) {
    throw new Error(
      planId === "PREMIUM"
        ? "STRIPE_PREMIUM_PRICE_ID (эсвэл STRIPE_PREMIUM_MONTHLY_PRICE_ID) тохируулагдаагүй байна."
        : "STRIPE_PRO_PRICE_ID (эсвэл STRIPE_PRO_MONTHLY_PRICE_ID) тохируулагдаагүй байна.",
    );
  }

  return priceId;
}

export function planFromStripePriceId(priceId: string): PlanId {
  const map: Record<string, PlanId> = {};

  const entries: Array<[string | undefined, PlanId]> = [
    [env.stripePremiumPriceId, "PREMIUM"],
    [env.stripePremiumMonthlyPriceId, "PREMIUM"],
    [env.stripeProPriceId, "PRO"],
    [env.stripeProMonthlyPriceId, "PRO"],
    // Legacy env fallbacks (deprecated)
    [env.stripeStudentMonthlyPriceId, "PREMIUM"],
    [env.stripeStudentYearlyPriceId, "PREMIUM"],
    [env.stripeInstructorMonthlyPriceId, "PRO"],
    [env.stripeInstructorYearlyPriceId, "PRO"],
  ];

  for (const [id, plan] of entries) {
    if (id) map[id] = plan;
  }

  return map[priceId] ?? "STANDARD";
}

export function planFromCheckoutMeta(raw?: string | null): PlanId {
  if (raw && PAID_PLAN_IDS.includes(raw as PlanId)) return raw as PlanId;
  return normalizePlanId(raw);
}

export function getPlanPriceMnt(planId: PlanId): number {
  return getPlanById(planId).priceMnt;
}
