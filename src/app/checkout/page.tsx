import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Shield, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { CheckoutButton } from "@/components/course/CheckoutButton";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { courseId } = await searchParams;
  if (!courseId) redirect("/courses");

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    include: {
      instructor: { select: { name: true } },
      _count: { select: { modules: true, enrollments: true } },
    },
  });
  if (!course) notFound();

  const price = Number(course.discountPrice ?? course.price);
  const originalPrice = Number(course.price);
  const hasDiscount = course.discountPrice && Number(course.discountPrice) < originalPrice;

  return (
    <div className="min-h-screen bg-muted/50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/courses/${course.slug}`}
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Курс руу буцах
        </Link>

        <h1 className="mb-8 text-2xl font-bold text-foreground">Төлбөр төлөх</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 rounded-xl border border-border bg-white p-6">
              <div className="flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-violet-600">
                      <BookOpen size={24} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="mb-1 font-bold text-foreground">{course.title}</h2>
                  <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course._count.modules} модуль · {course._count.enrollments} оюутан
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Таны авах давуу тал</h3>
              <div className="space-y-2.5">
                {[
                  "Насан туршийн хандалт",
                  "Курс дүүргэвэл сертификат олгогдоно",
                  "Мобайл болон десктоп дээр үзэх боломжтой",
                  "30 хоногийн буцаах баталгаа",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-white p-5">
              <h3 className="mb-4 font-semibold text-foreground">Захиалгын хураангуй</h3>

              <div className="mb-4 space-y-2 border-b border-border pb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Курсын үнэ</span>
                  <span className={hasDiscount ? "text-muted-foreground line-through" : "font-medium text-foreground"}>
                    {formatCurrency(originalPrice, course.currency)}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600">Хямдрал</span>
                    <span className="text-emerald-600">
                      -{formatCurrency(originalPrice - price, course.currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-5 flex items-center justify-between">
                <span className="font-semibold text-foreground">Нийт</span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(price, course.currency)}
                </span>
              </div>

              <CheckoutButton
                courseId={course.id}
                courseTitle={course.title}
                price={price}
                currency={course.currency}
              />

              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield size={11} /> Stripe-аар аюулгүй төлбөр
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={11} /> Visa, MasterCard дэмждэг
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} /> Шууд идэвхждэг
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
