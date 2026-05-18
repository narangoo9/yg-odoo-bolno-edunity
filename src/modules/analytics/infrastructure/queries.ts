import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";

// ─── SUPER ADMIN ANALYTICS ────────────────────────────────────────────────────

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
    db.user.count({ where: { role: "USER", status: "ACTIVE" } }),
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
  const monthRange = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: endOfMonth(now),
  });

  const rows = await Promise.all(
    monthRange.map(async (month) => {
      const agg = await db.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth(month), lte: endOfMonth(month) },
        },
      });
      return {
        month: month.toLocaleDateString("mn-MN", { month: "short", year: "numeric" }),
        revenue: Number(agg._sum.amount ?? 0),
        count: agg._count,
      };
    }),
  );

  return rows;
}

export async function getEnrollmentsByMonth(months = 6) {
  const now = new Date();
  const monthRange = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: endOfMonth(now),
  });

  return Promise.all(
    monthRange.map(async (month) => {
      const range = { gte: startOfMonth(month), lte: endOfMonth(month) };
      const [enrollments, completed] = await Promise.all([
        db.enrollment.count({ where: { enrolledAt: range } }),
        db.enrollment.count({ where: { enrolledAt: range, status: "COMPLETED" } }),
      ]);
      return {
        month: month.toLocaleDateString("mn-MN", { month: "short", year: "numeric" }),
        enrollments,
        completed,
      };
    }),
  );
}

export async function getTopCourses(limit = 10) {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { enrollments: { _count: "desc" } },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      instructor: { select: { name: true } },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  const courseIds = courses.map((c) => c.id);
  const ratingByCourse =
    courseIds.length > 0
      ? await db.review.groupBy({
          by: ["courseId"],
          _avg: { rating: true },
          where: { courseId: { in: courseIds }, isApproved: true },
        })
      : [];
  const avgMap = new Map(ratingByCourse.map((r) => [r.courseId, Number(r._avg.rating ?? 0)]));

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    instructorName: c.instructor.name,
    enrollmentCount: c._count.enrollments,
    reviewCount: c._count.reviews,
    averageRating: avgMap.get(c.id) ?? 0,
    price: Number(c.price),
  }));
}

export async function getUserGrowthByMonth(months = 6) {
  const now = new Date();
  const monthRange = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: endOfMonth(now),
  });

  return Promise.all(
    monthRange.map(async (month) => {
      const range = { gte: startOfMonth(month), lte: endOfMonth(month) };
      const [total, students, instructors] = await Promise.all([
        db.user.count({ where: { createdAt: range } }),
        db.user.count({ where: { createdAt: range, role: "USER" } }),
        db.user.count({ where: { createdAt: range, role: "COMPANY" } }),
      ]);
      return {
        month: month.toLocaleDateString("mn-MN", { month: "short", year: "numeric" }),
        total,
        students,
        instructors,
      };
    }),
  );
}

// ─── INSTRUCTOR ANALYTICS ─────────────────────────────────────────────────────

export async function getInstructorAnalytics(instructorId: string) {
  // Fetch instructor's course ids once, then run all aggregates in parallel.
  const courses = await db.course.findMany({
    where: { instructorId },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: 0,
      totalCertificates: 0,
      averageRating: 0,
    };
  }

  const [totalEnrollments, totalCertificates, avgRating, totalRevenue] = await Promise.all([
    db.enrollment.count({ where: { courseId: { in: courseIds } } }),
    db.certificate.count({ where: { courseId: { in: courseIds } } }),
    db.review.aggregate({
      _avg: { rating: true },
      where: { courseId: { in: courseIds }, isApproved: true },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED", courseId: { in: courseIds } },
    }),
  ]);

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
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      coverImage: true,
      thumbnailUrl: true,
      sourceType: true,
      _count: { select: { enrollments: true, reviews: true, sections: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const [completedByCourse, ratingByCourse] = await Promise.all([
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { courseId: { in: courseIds }, status: "COMPLETED" },
      _count: { _all: true },
    }),
    db.review.groupBy({
      by: ["courseId"],
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const completedMap = new Map(completedByCourse.map((r) => [r.courseId, r._count._all]));
  const ratingMap = new Map(
    ratingByCourse.map((r) => [r.courseId, { avg: r._avg.rating ?? 0, count: r._count._all }]),
  );

  return courses.map((c) => {
    const enrollmentCount = c._count.enrollments;
    const completedCount = completedMap.get(c.id) ?? 0;
    const rating = ratingMap.get(c.id);
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      coverImage: c.coverImage,
      thumbnailUrl: c.thumbnailUrl,
      sourceType: c.sourceType,
      sectionCount: c._count.sections,
      enrollmentCount,
      completedCount,
      reviewCount: rating?.count ?? c._count.reviews,
      averageRating: Number((rating?.avg ?? 0).toFixed(1)),
      completionRate:
        enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0,
    };
  });
}

// ─── STUDENT ANALYTICS ────────────────────────────────────────────────────────

export async function getStudentStats(studentId: string) {
  const [enrollments, completedCourses, certificates, completedLessons, quizAttempts, avgQuizScore] =
    await Promise.all([
      db.enrollment.count({ where: { studentId } }),
      db.enrollment.count({ where: { studentId, status: "COMPLETED" } }),
      db.certificate.count({ where: { studentId } }),
      db.progress.count({ where: { studentId, isCompleted: true } }),
      db.quizAttempt.count({ where: { studentId, status: "GRADED" } }),
      db.quizAttempt.aggregate({
        _avg: { score: true },
        where: { studentId, status: "GRADED" },
      }),
    ]);

  return {
    enrolledCourses: enrollments,
    completedCourses,
    completedLessons,
    certificates,
    quizAttempts,
    averageQuizScore: Number(avgQuizScore._avg.score?.toFixed(1) ?? 0),
  };
}

