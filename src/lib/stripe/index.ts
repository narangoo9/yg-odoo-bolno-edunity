import Stripe from "stripe";
import { getAppUrl } from "@/lib/app-url";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    stripeClient = new Stripe(apiKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripeClient;
}

export const SUBSCRIPTION_PRICES = {
  STUDENT: {
    monthly: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_STUDENT_YEARLY_PRICE_ID ?? "",
  },
  INSTRUCTOR: {
    monthly: process.env.STRIPE_INSTRUCTOR_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_INSTRUCTOR_YEARLY_PRICE_ID ?? "",
  },
  ORGANIZATION: {
    monthly: process.env.STRIPE_ORG_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_ORG_YEARLY_PRICE_ID ?? "",
  },
};

export async function createCourseCheckoutSession({
  courseId,
  userId,
  courseTitle,
  price,
  currency,
}: {
  courseId: string;
  userId: string;
  courseTitle: string;
  price: number;
  currency: string;
}) {
  const stripe = getStripe();
  const appUrl = getAppUrl();

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: courseTitle, metadata: { courseId } },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/student/courses/${courseId}/learn?payment=success`,
    cancel_url: `${appUrl}/courses?payment=cancelled`,
    metadata: { userId, courseId, type: "course_purchase" },
    client_reference_id: userId,
  });
}

export async function createSubscriptionCheckoutSession({
  userId,
  priceId,
  stripeCustomerId,
}: {
  userId: string;
  priceId: string;
  stripeCustomerId?: string | null;
}) {
  const stripe = getStripe();
  const appUrl = getAppUrl();

  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: stripeCustomerId ?? undefined,
    success_url: `${appUrl}/student?subscription=success`,
    cancel_url: `${appUrl}/pricing?subscription=cancelled`,
    metadata: { userId, type: "subscription" },
    client_reference_id: userId,
  });
}
