import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { id: true, plan: true, status: true, stripeSubscriptionId: true },
    });

    if (!subscription || subscription.plan === "FREE") {
      return NextResponse.json({ error: "Идэвхтэй захиалга байхгүй" }, { status: 400 });
    }

    if (subscription.status === "CANCELLED") {
      return NextResponse.json({ error: "Захиалга аль хэдийн цуцлагдсан" }, { status: 400 });
    }

    // Cancel in Stripe if we have a stripe subscription id
    if (subscription.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeErr) {
        console.warn("Stripe cancel error (continuing with DB update):", stripeErr);
      }
    }

    // Keep access until Stripe ends the period; webhook will set CANCELLED.
    await db.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        ...(subscription.stripeSubscriptionId ? {} : { status: "CANCELLED" }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Захиалга таны хугацааны төгсгөлд цуцлагдана.",
    });
  } catch (err) {
    console.error("[CANCEL_SUBSCRIPTION]", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
