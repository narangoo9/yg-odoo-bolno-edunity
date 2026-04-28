"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import {
  createOrderSchema,
  requestRefundSchema,
  processRefundSchema,
  type CreateOrderInput,
  type RequestRefundInput,
  type ProcessRefundInput,
} from "../domain/schemas";
import type { Decimal } from "@prisma/client/runtime/library";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : parseFloat(d.toString());
}

// ─── CREATE ORDER + STRIPE CHECKOUT ───────────────────────────────────────────

export async function createOrderCheckout(input: CreateOrderInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { items, couponCode, useWalletCredits } = parsed.data;

  // Fetch prices for all items
  type LineItem = {
    courseId?: string;
    programId?: string;
    title: string;
    unitPrice: number;
    organizationId: string | null;
    commissionRate: number;
  };

  const lineItems: LineItem[] = [];

  for (const item of items) {
    if (item.courseId) {
      const course = await db.course.findUnique({
        where: { id: item.courseId },
        include: { organization: { select: { commissionRate: true } } },
      });
      if (!course || course.status !== "PUBLISHED") {
        return { error: `Курс олдсонгүй: ${item.courseId}` };
      }
      lineItems.push({
        courseId: item.courseId,
        title: course.title,
        unitPrice: toNumber(course.discountPrice ?? course.price),
        organizationId: course.organizationId,
        commissionRate: toNumber(course.organization?.commissionRate) || 20,
      });
    } else if (item.programId) {
      const program = await db.program.findUnique({
        where: { id: item.programId },
        include: {
          organization: { select: { commissionRate: true } },
          courses: {
            include: {
              course: {
                select: {
                  price: true,
                  discountPrice: true,
                },
              },
            },
          },
        },
      });
      if (!program || program.status !== "PUBLISHED") {
        return { error: `Программ олдсонгүй: ${item.programId}` };
      }
      lineItems.push({
        programId: item.programId,
        title: program.title,
        unitPrice: program.courses.reduce(
          (sum, entry) => sum + toNumber(entry.course.discountPrice ?? entry.course.price),
          0,
        ),
        organizationId: program.organizationId,
        commissionRate: toNumber(program.organization?.commissionRate) || 20,
      });
    }
  }

  // Apply coupon if provided
  let discountAmount = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: couponCode } });
    if (coupon && coupon.isActive && (!coupon.validUntil || coupon.validUntil > new Date())) {
      const totalBeforeDiscount = lineItems.reduce((sum, i) => sum + i.unitPrice, 0);
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (totalBeforeDiscount * toNumber(coupon.discountValue)) / 100;
      } else {
        discountAmount = Math.min(toNumber(coupon.discountValue), totalBeforeDiscount);
      }
      couponId = coupon.id;
    }
  }

  const totalAmount = lineItems.reduce((sum, i) => sum + i.unitPrice, 0);

  // Wallet credit discount (up to 20% of final amount)
  let walletDiscount = 0;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true },
  });
  const walletBalance = toNumber(user?.walletBalance);

  if (useWalletCredits && walletBalance > 0) {
    const afterCoupon = totalAmount - discountAmount;
    const maxWalletDiscount = afterCoupon * 0.2;
    walletDiscount = Math.min(walletBalance, maxWalletDiscount);
    discountAmount += walletDiscount;
  }

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Create order record
  const order = await db.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      totalAmount,
      discountAmount,
      finalAmount,
      currency: "MNT",
      couponId,
      items: {
        create: lineItems.map((item) => {
          const commissionAmount = (item.unitPrice * item.commissionRate) / 100;
          return {
            courseId: item.courseId ?? null,
            programId: item.programId ?? null,
            unitPrice: item.unitPrice,
            commissionRate: item.commissionRate,
            commissionAmount,
            orgAmount: item.unitPrice - commissionAmount,
            organizationId: item.organizationId,
          };
        }),
      },
    },
  });

  // Apply wallet deduction immediately (hold)
  if (walletDiscount > 0) {
    await db.user.update({
      where: { id: session.user.id },
      data: { walletBalance: { decrement: walletDiscount } },
    });
  }

  // Create Stripe checkout
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems.map((item) => ({
      price_data: {
        currency: "mnt",
        product_data: { name: item.title },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: 1,
    })),
    discounts: discountAmount > 0 ? [] : undefined,
    success_url: `${appUrl}/student/orders/${order.id}?status=success`,
    cancel_url: `${appUrl}/student/orders/${order.id}?status=cancelled`,
    metadata: {
      orderId: order.id,
      userId: session.user.id,
      type: "order",
      walletDiscount: walletDiscount.toString(),
    },
    client_reference_id: order.id,
  });

  // Store Stripe payment intent ID
  await db.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: stripeSession.payment_intent as string | null },
  });

  return { success: true, checkoutUrl: stripeSession.url, orderId: order.id };
}

// ─── REQUEST REFUND ────────────────────────────────────────────────────────────

export async function requestRefund(input: RequestRefundInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const parsed = requestRefundSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { orderId, reason } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) return { error: "Захиалга олдсонгүй" };
  if (order.status !== "PAID") return { error: "Буцаан олголт хийх боломжгүй" };

  const existing = await db.refundRequest.findUnique({ where: { orderId } });
  if (existing) return { error: "Буцаан олголтын хүсэлт аль хэдийн илгээгдсэн" };

  const refund = await db.refundRequest.create({
    data: {
      orderId,
      requestedBy: session.user.id,
      reason,
      status: "REQUESTED",
    },
  });

  return { success: true, refundId: refund.id };
}

// ─── PROCESS REFUND (admin) ────────────────────────────────────────────────────

export async function processRefund(input: ProcessRefundInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Зөвшөөрөл хангалтгүй" };
  }

  const parsed = processRefundSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const { refundRequestId, approve, notes } = parsed.data;

  const refundReq = await db.refundRequest.findUnique({
    where: { id: refundRequestId },
    include: { order: true },
  });
  if (!refundReq) return { error: "Хүсэлт олдсонгүй" };

  if (!approve) {
    await db.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: "REJECTED",
        processedBy: session.user.id,
        processedAt: new Date(),
        notes,
      },
    });
    return { success: true };
  }

  // Approve: issue Stripe refund if payment intent exists
  let stripeRefundId: string | null = null;
  const order = refundReq.order;

  if (order.stripePaymentIntentId) {
    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: Math.round(toNumber(order.finalAmount) * 100),
      });
      stripeRefundId = refund.id;
    } catch {
      return { error: "Stripe буцаан олголт амжилтгүй" };
    }
  }

  await db.$transaction([
    db.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: "PROCESSED",
        refundAmount: order.finalAmount,
        processedBy: session.user.id,
        processedAt: new Date(),
        stripeRefundId,
        notes,
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED" },
    }),
  ]);

  return { success: true };
}

// ─── GET ORDER ─────────────────────────────────────────────────────────────────

export async function getOrder(orderId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          course: { select: { title: true, thumbnailUrl: true } },
          program: { select: { title: true } },
        },
      },
      refund: true,
    },
  });

  if (!order) return { error: "Захиалга олдсонгүй" };

  const isOwner = order.userId === session.user.id;
  const isAdmin = session.user.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) return { error: "Зөвшөөрөл хангалтгүй" };

  return { order };
}

// ─── GET USER ORDERS ───────────────────────────────────────────────────────────

export async function getUserOrders() {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          course: { select: { title: true } },
          program: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { orders };
}
