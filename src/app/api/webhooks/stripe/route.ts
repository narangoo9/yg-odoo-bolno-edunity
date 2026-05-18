import { NextRequest } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  revalidateUserDashboard,
  revalidateUserNotifications,
  revalidateUserSidebar,
} from "@/lib/dashboard-cache";
import {
  downgradeUserToStandard,
  syncStripeSubscription,
} from "@/lib/stripe/subscription-sync";
import { claimStripeWebhookEvent } from "@/lib/stripe/webhook-idempotency";

export async function POST(req: NextRequest) {
  // Public signed endpoint: Stripe authenticates requests with stripe-signature.
  const stripe = getStripe();
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) return new Response("No signature", { status: 400 });

  const webhookSecret = env.stripeWebhookSecret;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    const isNewEvent = await claimStripeWebhookEvent(event.id, event.type);
    if (!isNewEvent) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    switch (event.type) {
      // ── CHECKOUT COMPLETED ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const { userId, type, orderId } = meta;

        if (session.payment_status !== "paid") break;

        if (
          userId &&
          session.client_reference_id &&
          session.client_reference_id !== userId
        ) {
          console.error("Stripe webhook user mismatch", {
            eventId: event.id,
            userId,
            clientReferenceId: session.client_reference_id,
          });
          break;
        }

        // ── Order-based purchase (course / program bundle) ──
        if (orderId && userId) {
          const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (order && order.status === "PENDING") {
            const expectedMinor = Math.round(Number(order.finalAmount) * 100);
            if (
              session.amount_total != null &&
              expectedMinor > 0 &&
              session.amount_total < expectedMinor
            ) {
              console.error("Stripe webhook amount mismatch for order", {
                eventId: event.id,
                orderId,
                expectedMinor,
                paidMinor: session.amount_total,
              });
              break;
            }

            await db.$transaction(async (tx) => {
              // Mark order paid
              await tx.order.update({
                where: { id: orderId },
                data: {
                  status: "PAID",
                  stripePaymentIntentId: session.payment_intent as string,
                },
              });

              // Enroll user in each purchased course / program
              for (const item of order.items) {
                if (item.courseId) {
                  await tx.enrollment.upsert({
                    where: { studentId_courseId: { studentId: userId, courseId: item.courseId } },
                    create: { studentId: userId, courseId: item.courseId, status: "ACTIVE", source: "paid" },
                    update: { status: "ACTIVE" },
                  });
                }
                if (item.programId) {
                  await tx.programEnrollment.upsert({
                    where: { studentId_programId: { studentId: userId, programId: item.programId } },
                    create: { studentId: userId, programId: item.programId, source: "paid" },
                    update: {},
                  });
                  // Auto-enroll in program courses
                  const programCourses = await tx.programCourse.findMany({
                    where: { programId: item.programId },
                  });
                  for (const pc of programCourses) {
                    await tx.enrollment.upsert({
                      where: { studentId_courseId: { studentId: userId, courseId: pc.courseId } },
                      create: { studentId: userId, courseId: pc.courseId, status: "ACTIVE", source: "organization" },
                      update: {},
                    });
                  }
                }
              }

              // Record payment
              await tx.payment.create({
                data: {
                  userId,
                  stripePaymentId: session.payment_intent as string,
                  amount: Number(order.finalAmount),
                  currency: order.currency,
                  status: "COMPLETED",
                  description: `Checkout payment for order ${orderId}`,
                  metadata: { orderId, type },
                },
              });

              // Notify
              await tx.notification.create({
                data: {
                  userId,
                  type: "PAYMENT_SUCCESS",
                  title: "Төлбөр амжилттай",
                  body: "Таны худалдан авалт баталгаажлаа.",
                  data: { orderId },
                },
              });

              // Org revenue accounting — accumulate into OrgPayout
              for (const item of order.items) {
                if (item.organizationId) {
                  await tx.orgPayout.upsert({
                    where: {
                      id: `pending-${item.organizationId}-${new Date().toISOString().slice(0, 7)}`,
                    },
                    create: {
                      id: `pending-${item.organizationId}-${new Date().toISOString().slice(0, 7)}`,
                      organizationId: item.organizationId,
                      amount: Number(item.orgAmount),
                      currency: order.currency,
                      status: "PENDING",
                      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                      periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                      notes: "Monthly accumulation",
                    },
                    update: {
                      amount: { increment: Number(item.orgAmount) },
                    },
                  } as Parameters<typeof tx.orgPayout.upsert>[0]);
                }
              }
            });
            revalidateUserSidebar(userId);
            revalidateUserNotifications(userId);
          }
        }

        // ── Legacy single-course purchase (backward compat) ──
        else if (type === "course_purchase" && userId && meta.courseId) {
          const courseId = meta.courseId;
          const course = await db.course.findUnique({
            where: { id: courseId },
            select: { price: true, discountPrice: true, currency: true },
          });
          if (!course) break;

          const expectedAmount = Number(course.discountPrice ?? course.price);
          const paidAmount = (session.amount_total ?? 0) / 100;
          if (expectedAmount > 0 && paidAmount + 0.01 < expectedAmount) {
            console.error("Stripe webhook course price mismatch", {
              eventId: event.id,
              courseId,
              expectedAmount,
              paidAmount,
            });
            break;
          }

          const paymentIntentId = session.payment_intent as string;
          const existingPayment = paymentIntentId
            ? await db.payment.findUnique({
                where: { stripePaymentId: paymentIntentId },
                select: { id: true },
              })
            : null;
          if (existingPayment) break;

          await db.$transaction([
            db.enrollment.upsert({
              where: { studentId_courseId: { studentId: userId, courseId } },
              create: { studentId: userId, courseId, status: "ACTIVE", source: "paid" },
              update: { status: "ACTIVE" },
            }),
            db.payment.create({
              data: {
                userId,
                courseId,
                stripePaymentId: session.payment_intent as string,
                amount: (session.amount_total ?? 0) / 100,
                currency: session.currency?.toUpperCase() ?? "USD",
                status: "COMPLETED",
              },
            }),
            db.notification.create({
              data: {
                userId,
                type: "PAYMENT_SUCCESS",
                title: "Төлбөр амжилттай",
                body: "Курст бүртгүүллээ.",
                data: { courseId },
              },
            }),
          ]);
          revalidateUserSidebar(userId);
          revalidateUserNotifications(userId);
        }

        // ── Platform subscription purchase ──
        else if (type === "subscription" && userId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const { plan } = await syncStripeSubscription({
            userId,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
            stripeSubscription,
            metadataPlan: meta.planId ?? meta.plan,
          });

          await db.notification.create({
            data: {
              userId,
              type: "PAYMENT_SUCCESS",
              title: `${plan} эрхт болллоо`,
              body: "Таны захиалга идэвхжлээ.",
            },
          });
          revalidateUserDashboard(userId);
          revalidateUserNotifications(userId);
        }
        break;
      }

      // ── SUBSCRIPTION UPDATED ────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptions = await db.subscription.findMany({
          where: { stripeSubscriptionId: sub.id },
          select: { userId: true },
        });

        for (const subscription of subscriptions) {
          const user = await db.user.findUnique({
            where: { id: subscription.userId },
            select: { stripeCustomerId: true },
          });
          await syncStripeSubscription({
            userId: subscription.userId,
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : user?.stripeCustomerId,
            stripeSubscription: sub,
          });
          revalidateUserDashboard(subscription.userId);
        }
        break;
      }

      // ── SUBSCRIPTION DELETED ────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
          select: { userId: true },
        });
        if (dbSub) {
          await downgradeUserToStandard(dbSub.userId);
          await db.notification.create({
            data: {
              userId: dbSub.userId,
              type: "SYSTEM",
              title: "Захиалга цуцлагдлаа",
              body: "Таны багц цуцлагдсан. Одоогийн хугацаа дуусах хүртэл ашиглах боломжтой.",
            },
          });
          revalidateUserDashboard(dbSub.userId);
          revalidateUserNotifications(dbSub.userId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const user = await db.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (!user) break;

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncStripeSubscription({
            userId: user.id,
            stripeCustomerId: customerId,
            stripeSubscription,
          });
          revalidateUserDashboard(user.id);
        }
        break;
      }

      // ── PAYMENT INTENT SUCCEEDED ────────────────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        // Update any matching order
        if (pi.metadata?.orderId) {
          await db.order.updateMany({
            where: { stripePaymentIntentId: pi.id, status: "PENDING" },
            data: { status: "PAID" },
          });
        }
        break;
      }

      // ── INVOICE PAYMENT FAILED ──────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await db.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) {
          await db.$transaction([
            db.payment.create({
              data: {
                userId: user.id,
                amount: (invoice.amount_due ?? 0) / 100,
                currency: invoice.currency?.toUpperCase() ?? "USD",
                status: "FAILED",
                failureReason: "Invoice payment failed",
              },
            }),
            db.subscription.updateMany({
              where: { userId: user.id, status: "ACTIVE" },
              data: { status: "PAST_DUE" },
            }),
            db.notification.create({
              data: {
                userId: user.id,
                type: "PAYMENT_FAILED",
                title: "Төлбөр амжилтгүй",
                body: "Таны захиалгын төлбөр амжилтгүй боллоо. Картаа шалгана уу.",
              },
            }),
          ]);
          revalidateUserDashboard(user.id);
          revalidateUserNotifications(user.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Server error", { status: 500 });
  }
}
