import { db } from "@/lib/db";
import type { CourseStatus, CourseLevel } from "@prisma/client";

export interface CourseFilters {
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFree?: boolean;
  instructorId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
  sortBy?: "newest" | "popular" | "rating" | "price-asc" | "price-desc";
  status?: CourseStatus;
}

export async function getCourses(filters: CourseFilters = {}) {
  const {
    search,
    categoryId,
    level,
    language,
    minPrice,
    maxPrice,
    isFree,
    instructorId,
    organizationId,
    page = 1,
    limit = 12,
    sortBy = "newest",
    status = "PUBLISHED",
  } = filters;

  const where = {
    status,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { tags: { has: search } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(level && { level }),
    ...(language && { language }),
    ...(isFree && { price: { equals: 0 } }),
    ...(minPrice !== undefined && { price: { gte: minPrice } }),
    ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
    ...(instructorId && { instructorId }),
    ...(organizationId && { organizationId }),
  };

  const orderBy = {
    newest: { createdAt: "desc" as const },
    popular: { enrollments: { _count: "desc" as const } },
    rating: { reviews: { _count: "desc" as const } },
    "price-asc": { price: "asc" as const },
    "price-desc": { price: "desc" as const },
  }[sortBy];

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instructor: { select: { id: true, name: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { enrollments: true, reviews: true, modules: true } },
        reviews: {
          select: { rating: true },
        },
      },
    }),
    db.course.count({ where }),
  ]);

  const coursesWithRating = courses.map((course) => ({
    ...course,
    averageRating:
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0,
    enrollmentCount: course._count.enrollments,
    reviewCount: course._count.reviews,
  }));

  return {
    courses: coursesWithRating,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getCourseBySlug(slug: string, studentId?: string) {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { coursesCreated: true } },
        },
      },
      category: true,
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              isFree: true,
              isLocked: true,
              orderIndex: true,
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        include: {
          student: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) return null;

  const avgRating =
    course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : 0;

  let enrollment = null;
  if (studentId) {
    enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
    });
  }

  return { ...course, averageRating: avgRating, enrollment };
}

export async function getCourseById(id: string) {
  return db.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true, avatarUrl: true } },
      category: true,
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });
}

export async function getStudentProgress(studentId: string, courseId: string) {
  const [enrollment, progress, totalLessons] = await Promise.all([
    db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    }),
    db.progress.findMany({
      where: { studentId, courseId, isCompleted: true },
      select: { lessonId: true, completedAt: true },
    }),
    db.lesson.count({ where: { module: { courseId } } }),
  ]);

  const completedCount = progress.length;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return {
    enrollment,
    completedLessonIds: progress.map((p) => p.lessonId),
    completedCount,
    totalLessons,
    percentage,
  };
}

export async function getInstructorCourses(instructorId: string) {
  return db.course.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  });
}

export async function getStudentEnrolledCourses(studentId: string) {
  return db.enrollment.findMany({
    where: { studentId, status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: {
          instructor: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { modules: true } },
        },
      },
    },
  });
}
