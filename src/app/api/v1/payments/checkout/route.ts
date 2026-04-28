import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCourseCheckoutSession } from "@/lib/stripe";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/shared/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const { courseId } = await req.json();
    if (!courseId) return badRequest("courseId шаардлагатай");

    const course = await db.course.findUnique({
      where: { id: courseId, status: "PUBLISHED" },
      select: { id: true, title: true, price: true, discountPrice: true, currency: true },
    });
    if (!course) return notFound("Курс олдсонгүй");

    const price = Number(course.discountPrice ?? course.price);
    if (price === 0) return badRequest("Энэ курс үнэгүй");

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
    });
    if (existing) return badRequest("Аль хэдийн бүртгүүлсэн");

    const checkout = await createCourseCheckoutSession({
      courseId: course.id,
      userId: session.user.id,
      courseTitle: course.title,
      price,
      currency: course.currency,
    });

    return ok({ url: checkout.url, sessionId: checkout.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return serverError("Checkout session үүсгэж чадсангүй");
  }
}
