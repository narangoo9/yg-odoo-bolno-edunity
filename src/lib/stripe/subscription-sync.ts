import type Stripe from "stripe";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export function planFromStripePriceId(priceId: string): Extract<SubscriptionPlan, "STANDARD" | "PREMIUM" | "PRO"> {
  const map: Record<string, Extract<SubscriptionPlan, "STANDARD" | "PREMIUM" | "PRO">> = {
    [env.stripeStandardPriceId]: "STANDARD",
    [env.stripePremiumPriceId]: "PREMIUM",
    [env.stripeProPriceId]: "PRO",
    [env.stripePremiumMonthlyPriceId]: "PREMIUM",
    [env.stripePremiumYearlyPriceId]: "PREMIUM",
    [env.stripeProMonthlyPriceId]: "PRO",
    [env.stripeProYearlyPriceId]: "PRO",
    [env.stripeStudentMonthlyPriceId]: "PREMIUM",
    [env.stripeStudentYearlyPriceId]: "PREMIUM",
    [env.stripeInstructorMonthlyPriceId]: "PRO",
    [env.stripeInstructorYearlyPriceId]: "PRO",
  };

  delete map[""];
  return map[priceId] ?? "STANDARD";
}

export function planFromCheckoutMeta(raw?: string): Extract<SubscriptionPlan, "STANDARD" | "PREMIUM" | "PRO"> {
  if (raw === "PREMIUM" || raw === "PRO" || raw === "STANDARD") return raw;
  return "STANDARD";
}

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
  metadataPlan,
}: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscription: Stripe.Subscription;
  metadataPlan?: string;
}) {
  const priceId = stripeSubscription.items.data[0]?.price.id ?? "";
  const metadataPlanValue = planFromCheckoutMeta(metadataPlan);
  const plan = metadataPlanValue !== "STANDARD" ? metadataPlanValue : planFromStripePriceId(priceId);
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
