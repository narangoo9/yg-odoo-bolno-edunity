/**
 * UI adapter for billing plans — maps SSOT to legacy tier card shape.
 * Prefer `@/lib/billing/plans` for new code.
 */
import {
  BILLING_COMPARISON,
  PLANS,
  PLAN_LIST,
  formatMnt,
  getPlanById,
  type PlanId,
} from "@/lib/billing/plans";

export type BillingTierId = PlanId;
export type BillingPeriod = "monthly";

export interface BillingTier {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: "Most Popular" | "Best Value";
  features: string[];
}

function toBillingTier(plan: (typeof PLAN_LIST)[number]): BillingTier {
  return {
    id: plan.id,
    name: plan.name,
    tagline: plan.description,
    monthlyPrice: plan.priceMnt,
    yearlyPrice: plan.priceMnt * 12,
    badge: plan.badge ?? undefined,
    features: plan.features,
  };
}

export const BILLING_TIERS: BillingTier[] = PLAN_LIST.map(toBillingTier);

export function getBillingTier(id: PlanId): BillingTier {
  return toBillingTier(getPlanById(id));
}

export { BILLING_COMPARISON, formatMnt };

export function formatTierPrice(tier: BillingTier): string {
  return formatMnt(tier.monthlyPrice);
}

/** Yearly billing disabled — always 0 savings display. */
export function tierYearlySavings(): number {
  return 0;
}

export { PLANS };
