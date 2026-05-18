import type Stripe from "stripe";
import type { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { type PlanId, DEFAULT_PLAN_ID } from "@/lib/billing/plans";
import { planFromCheckoutMeta, planFromStripePriceId } from "@/lib/stripe/plan-prices";

export { planFromStripePriceId, planFromCheckoutMeta };

export function stripeStatusToSubscriptionStatus(status: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    canceled: "CANCELLED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    unpaid: "PAST_DUE",
    incomplete: "PAST_DUE",
    incomplete_expired: "EXPIRED",
  };

  return map[status] ?? "ACTIVE";
}

export async function syncStripeSubscription({
  userId,
  stripeCustomerId,
  stripeSubscription,
  metadataPlan: _metadataPlan,
}: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscription: Stripe.Subscription;
  metadataPlan?: string;
}) {
  const priceId = stripeSubscription.items.data[0]?.price.id ?? "";
  const plan: PlanId = planFromStripePriceId(priceId);
  void _metadataPlan;
  const status = stripeStatusToSubscriptionStatus(stripeSubscription.status);

  await db.$transaction(async (tx) => {
    if (stripeCustomerId) {
      await tx.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
        select: { id: true },
      });
    }

    await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      update: {
        plan,
        status,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });
  });

  return { plan, status, priceId };
}

export async function downgradeUserToStandard(userId: string) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: DEFAULT_PLAN_ID,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: DEFAULT_PLAN_ID,
      status: "CANCELLED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
    },
  });
}

export async function syncLatestStripeSubscriptionForUser({
  stripe,
  userId,
  email,
  stripeCustomerId,
}: {
  stripe: Stripe;
  userId: string;
  email?: string | null;
  stripeCustomerId?: string | null;
}) {
  let customerId = stripeCustomerId ?? null;

  if (!customerId && email) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    customerId = customers.data[0]?.id ?? null;
  }

  if (!customerId) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const subscription =
    subscriptions.data.find((item) => item.status === "active" || item.status === "trialing") ??
    subscriptions.data[0] ??
    null;

  if (!subscription) return null;

  return syncStripeSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscription: subscription,
  });
}
