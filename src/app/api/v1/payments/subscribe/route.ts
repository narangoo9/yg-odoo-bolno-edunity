import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import {
  assertStripeBillingConfigured,
  checkoutPlanIdSchema,
  getPlanPriceMnt,
} from "@/lib/stripe/plan-prices";
import { getPlanById } from "@/lib/billing/plans";

const bodySchema = z.object({
  planId: checkoutPlanIdSchema,
  /** @deprecated use planId */
  plan: checkoutPlanIdSchema.optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Зөвхөн Premium эсвэл Pro багцыг сонгоно уу." },
        { status: 400 },
      );
    }

    const planId = parsed.data.planId ?? parsed.data.plan!;
    const plan = getPlanById(planId);
    let priceId: string;

    try {
      priceId = assertStripeBillingConfigured(planId);
    } catch (configError) {
      const message =
        configError instanceof Error
          ? configError.message
          : "Stripe price ID тохируулагдаагүй байна.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: user?.stripeCustomerId ?? undefined,
      success_url: `${appUrl}/api/v1/payments/subscribe/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/student/upgrade?subscription=cancelled`,
      metadata: {
        userId: session.user.id,
        planId,
        priceMnt: String(getPlanPriceMnt(planId)),
        source: "edunity",
        type: "subscription",
      },
      client_reference_id: session.user.id,
    });

    return NextResponse.json({ url: checkoutSession.url, plan: plan.name });
  } catch (err) {
    console.error("[SUBSCRIBE_ROUTE]", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
