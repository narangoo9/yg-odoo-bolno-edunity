import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/stripe/subscription-sync";
import {
  revalidateUserDashboard,
  revalidateUserNotifications,
  revalidateUserSidebar,
} from "@/lib/dashboard-cache";

export async function GET(req: NextRequest) {
  const session = await auth();
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/student/upgrade");
  }

  if (!sessionId) {
    redirect("/student/upgrade?subscription=missing_session");
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const checkoutUserId = checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id;
  if (checkoutUserId !== session.user.id) {
    redirect("/student/upgrade?subscription=forbidden");
  }

  if (checkoutSession.mode !== "subscription" || checkoutSession.payment_status !== "paid") {
    redirect("/student/upgrade?subscription=not_paid");
  }

  const stripeSubscription = checkoutSession.subscription;
  if (!stripeSubscription || typeof stripeSubscription === "string") {
    redirect("/student/upgrade?subscription=missing_subscription");
  }

  await syncStripeSubscription({
    userId: session.user.id,
    stripeCustomerId:
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id,
    stripeSubscription,
    metadataPlan: checkoutSession.metadata?.plan,
  });

  revalidateUserDashboard(session.user.id);
  revalidateUserSidebar(session.user.id);
  revalidateUserNotifications(session.user.id);

  return NextResponse.redirect(new URL("/student?subscription=success", req.url));
}
