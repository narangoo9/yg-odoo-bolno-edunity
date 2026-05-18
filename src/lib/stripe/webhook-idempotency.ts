import { db } from "@/lib/db";

/**
 * Stripe retries webhooks on non-2xx responses. Record event IDs to prevent duplicate fulfillment.
 */
export async function claimStripeWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
  try {
    await db.stripeWebhookEvent.create({
      data: { id: eventId, type: eventType },
    });
    return true;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return false;
    throw error;
  }
}
