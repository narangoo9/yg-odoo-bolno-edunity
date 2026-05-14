import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";

/* Maps plan+billing → Stripe price ID.
   Falls back to STUDENT/INSTRUCTOR IDs if plan-specific IDs are not set. */
const PRICE_MAP: Record<string, Record<string, string>> = {
  PREMIUM: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
      ?? process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID
      ?? "",
    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
      ?? process.env.STRIPE_STUDENT_YEARLY_PRICE_ID
      ?? "",
  },
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      ?? process.env.STRIPE_INSTRUCTOR_MONTHLY_PRICE_ID
      ?? "",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID
      ?? process.env.STRIPE_INSTRUCTOR_YEARLY_PRICE_ID
      ?? "",
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { plan, billing } = body as { plan: string; billing: string };

    if (!["PREMIUM", "PRO"].includes(plan)) {
      return NextResponse.json({ error: "Буруу төлөвлөгөө" }, { status: 400 });
    }
    if (!["monthly", "yearly"].includes(billing)) {
      return NextResponse.json({ error: "Буруу тооцооллын хугацаа" }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan]?.[billing];
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID тохируулагдаагүй байна. .env файлаа шалгана уу." },
        { status: 400 }
      );
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
        plan,
        billing,
        type: "subscription",
      },
      client_reference_id: session.user.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[SUBSCRIBE_ROUTE]", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
