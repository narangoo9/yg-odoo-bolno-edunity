import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";

// â”€â”€â”€ SUPER ADMIN ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAdminOverview() {
  const [
    totalUsers,
    activeStudents,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    totalCertificates,
    totalRevenue,
    newUsersThisMonth,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    db.course.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.enrollment.count(),
    db.certificate.count(),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    db.user.count({
      where: {
        createdAt: {
          gte: startOfMonth(new Date()),
          lte: endOfMonth(new Date()),
        },
      },
    }),
  ]);

  return {
    totalUsers,
    activeStudents,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    totalCertificates,
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    newUsersThisMonth,
  };
}

export async function getRevenueByMonth(months = 6) {
  const now = new Date();
  const start = subMonths(startOfMonth(now), months - 1);
  const end = endOfMonth(now);

  const monthRange = eachMonthOfInterval({ start, end });

  const payments = await db.payment.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: start, lte: end },
    },
    select: { amount: true, createdAt: true },
  });

  return monthRange.map((month) => {
    const monthPayments = payments.filter((p) => {
      const d = new Date(p.createdAt);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });

    return {
      month: month.toLocaleDateString("mn-MN", { month: "short", year: "numeric" }),
      revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      count: monthPayments.length,
    };
  });
}

export async function getEnrollmentsByMonth(months = 6) {
  const now = new Date();
  const start = subMonths(startOfMonth(now), months - 1);
  const end = endOfMonth(now);

  const monthRange = eachMonthOfInterval({ start, end });

  const enrollments = await db.enrollment.findMany({
    where: { enrolledAt: { gte: start, lte: end } },
    select: { enrolledAt: true, status: true },
  });

  return monthRange.map((month) => {
    const monthEnrollments = enrollments.filter((e) => {
      const d = new Date(e.enrolledAt);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });

    return {
      month: month.toLocaleDateString("mn-MN", { month: "short", year: "numeric" }),
      enrollments: monthEnrollments.length,
      completed: monthEnrollments.filter((e) => e.status === "COMPLETED").length,
    };
  });
}

export async function getTopCourses(limit = 10) {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { enrollments: { _count: "desc" } },
    take: limit,
    include: {
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    instructorName: c.instructor.name,
    enrollmentCount: c._count.enrollments,
    reviewCount: c._count.reviews,
    averageRating:
      c.reviews.length > 0 ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : 0,
    price: Number(c.price),
  }));
}

export async function getUserGrowthByMonth(months = 6) {
  const now = new Date();
  const start = subMonths(startOfMonth(now), months - 1);
  const end = endOfMonth(now);
  const monthRange = eachMonthOfInterval({ start, end });

  const users = await db.user.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true, role: true },
  });

  return monthRange.map((month) => {
    const monthUsers = users.filter((u) => {
      const d = new Date(u.createdAt);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });

    return {
      month: month.toLocaleDateString("mn-MN", { month: "short", year: "numeric" }),
      total: monthUsers.length,
      students: monthUsers.filter((u) => u.role === "STUDENT").length,
      instructors: monthUsers.filter((u) => u.role === "INSTRUCTOR").length,
    };
  });
}

// â”€â”€â”€ INSTRUCTOR ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function getInstructorCourseIds(instructorId: string) {
  const courses = await db.course.findMany({
    where: { instructorId },
    select: { id: true },
  });

  return courses.map((course) => course.id);
}

export async function getInstructorAnalytics(instructorId: string) {
  const [courseIds, totalEnrollments, totalCertificates, avgRating] = await Promise.all([
    getInstructorCourseIds(instructorId),
    db.enrollment.count({ where: { course: { instructorId } } }),
    db.certificate.count({ where: { course: { instructorId } } }),
    db.review.aggregate({
      _avg: { rating: true },
      where: { course: { instructorId }, isApproved: true },
    }),
  ]);

  const totalRevenue =
    courseIds.length === 0
      ? { _sum: { amount: null } }
      : await db.payment.aggregate({
          _sum: { amount: true },
          where: { status: "COMPLETED", courseId: { in: courseIds } },
        });

  return {
    totalCourses: courseIds.length,
    totalStudents: totalEnrollments,
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    totalCertificates,
    averageRating: Number(avgRating._avg.rating?.toFixed(1) ?? 0),
  };
}

export async function getInstructorCourseStats(instructorId: string) {
  const courses = await db.course.findMany({
    where: { instructorId },
    include: {
      _count: { select: { enrollments: true, reviews: true, sections: true } },
      reviews: { select: { rating: true } },
      enrollments: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status,
    coverImage: c.coverImage,
    thumbnailUrl: c.thumbnailUrl,
    sourceType: c.sourceType,
    sectionCount: c._count.sections,
    enrollmentCount: c._count.enrollments,
    completedCount: c.enrollments.filter((e) => e.status === "COMPLETED").length,
    reviewCount: c._count.reviews,
    averageRating:
      c.reviews.length > 0 ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : 0,
    completionRate:
      c._count.enrollments > 0
        ? Math.round(
            (c.enrollments.filter((e) => e.status === "COMPLETED").length /
              c._count.enrollments) *
              100
          )
        : 0,
  }));
}

// â”€â”€â”€ STUDENT ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getStudentStats(studentId: string) {
  const [enrollments, certificates, completedLessons, quizAttempts] = await Promise.all([
    db.enrollment.count({ where: { studentId } }),
    db.certificate.count({ where: { studentId } }),
    db.progress.count({ where: { studentId, isCompleted: true } }),
    db.quizAttempt.count({ where: { studentId, status: "GRADED" } }),
  ]);

  const completedCourses = await db.enrollment.count({
    where: { studentId, status: "COMPLETED" },
  });

  const avgQuizScore = await db.quizAttempt.aggregate({
    _avg: { score: true },
    where: { studentId, status: "GRADED" },
  });

  return {
    enrolledCourses: enrollments,
    completedCourses,
    completedLessons,
    certificates,
    quizAttempts,
    averageQuizScore: Number(avgQuizScore._avg.score?.toFixed(1) ?? 0),
  };
}

