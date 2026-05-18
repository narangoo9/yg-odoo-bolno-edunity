"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveCourseAccess } from "@/lib/subscription-access";
import { revalidateUserNotifications, revalidateUserSidebar, revalidateUserSavedCourses } from "@/lib/dashboard-cache";
import { generateSlug } from "@/shared/utils/slug";
import {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  createLessonSchema,
  updateLessonSchema,
  enrollCourseSchema,
  reorderLessonsSchema,
  lessonSectionSchema,
  completeLessonSectionSchema,
  createYouTubeCourseSchema,
} from "../domain/schemas";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CreateModuleInput,
  CreateLessonInput,
  UpdateLessonInput,
  EnrollCourseInput,
  LessonSectionInput,
  CreateYouTubeCourseInput,
} from "../domain/schemas";
import {
  extractYouTubeVideoId,
  getTimestampLines,
  getYouTubeThumbnailUrls,
  parseTimestampSections,
} from "@/lib/youtube-course";

// ─── COURSE CRUD ──────────────────────────────────────────────────────────────

export async function createCourse(input: CreateCourseInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");
  if (!["COMPANY", "COMPANY", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Эрхгүй");
  }

  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const slug = await generateSlug(parsed.data.title, "courses");

  const course = await db.course.create({
    data: {
      ...parsed.data,
      slug,
      instructorId: session.user.id,
      organizationId: session.user.organizationId,
      status: "DRAFT",
    },
  });

  revalidatePath("/instructor/courses");
  return { success: true, data: course };
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const course = await db.course.findUnique({ where: { id } });
  if (!course) return { error: "Курс олдсонгүй" };

  const canEdit =
    course.instructorId === session.user.id ||
    session.user.role === "SUPER_ADMIN" ||
    (session.user.role === "COMPANY" && course.organizationId === session.user.organizationId);

  if (!canEdit) return { error: "Эрхгүй" };

  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const updated = await db.course.update({
    where: { id },
    data: {
      ...parsed.data,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  revalidatePath(`/instructor/courses/${id}`);
  revalidatePath("/courses");
  return { success: true, data: updated };
}

export async function deleteCourse(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const course = await db.course.findUnique({ where: { id } });
  if (!course) return { error: "Курс олдсонгүй" };

  const canDelete =
    course.instructorId === session.user.id ||
    session.user.role === "SUPER_ADMIN" ||
    (session.user.role === "COMPANY" &&
      course.organizationId &&
      course.organizationId === session.user.organizationId);

  if (!canDelete) return { error: "Эрхгүй" };

  await db.course.update({ where: { id }, data: { status: "ARCHIVED" } });

  revalidatePath("/instructor/courses");
  return { success: true };
}

export async function publishCourse(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const course = await db.course.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, instructor: { select: { name: true } } },
  });
  if (!course) return { error: "Курс олдсонгүй" };

  if (session.user.role === "SUPER_ADMIN") {
    return updateCourse(id, { status: "PUBLISHED" });
  }

  const result = await updateCourse(id, { status: "UNDER_REVIEW" });
  if ("success" in result && result.success) {
    const { notifyAdminCourseReview } = await import(
      "@/modules/admin/application/moderation-actions"
    );
    notifyAdminCourseReview({
      courseId: course.id,
      courseTitle: course.title,
      instructorName: course.instructor.name,
    }).catch(() => null);
    revalidatePath("/admin/courses");
    return { success: true, pendingReview: true };
  }
  return result;
}

export async function unpublishCourse(id: string) {
  return updateCourse(id, { status: "DRAFT" });
}

export async function previewYouTubeCourseImport(input: {
  youtubeUrl: string;
  descriptionText?: string;
  durationSeconds?: number | null;
}) {
  const videoId = extractYouTubeVideoId(input.youtubeUrl);
  if (!videoId) return { error: "Invalid YouTube URL" };

  const thumbnails = getYouTubeThumbnailUrls(videoId);
  let title = "";
  let description = input.descriptionText ?? "";
  let durationSeconds = input.durationSeconds ?? null;
  let fetchedDescription = false;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        id: videoId,
        key: apiKey,
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.[0];
        title = item?.snippet?.title ?? "";
        const apiDescription = item?.snippet?.description || "";
        description = description || apiDescription;
        fetchedDescription = apiDescription.length > 0;
        durationSeconds = durationSeconds ?? parseIsoDuration(item?.contentDetails?.duration);
      }
    } catch {
      // Manual fallback remains available.
    }
  }

  if (!title) {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`,
        { cache: "no-store" },
      );
      if (response.ok) {
        const data = await response.json();
        title = data.title ?? "";
      }
    } catch {
      // Manual fallback remains available.
    }
  }

  const timestampLines = getTimestampLines(description);
  const sections = parseTimestampSections(description, durationSeconds);
  if (process.env.NODE_ENV !== "production") {
    console.log("videoId", videoId);
    console.log("description length", description.length);
    console.log("timestamp lines found", timestampLines.length);
    console.log("parsed sections", sections.length);
  }

  return {
    success: true,
    data: {
      sourceYoutubeId: videoId,
      sourceYoutubeUrl: input.youtubeUrl,
      title,
      coverImage: thumbnails.maxres,
      fallbackCoverImage: thumbnails.fallback,
      description,
      durationSeconds,
      sections,
      descriptionFetchError:
        !fetchedDescription && !input.descriptionText?.trim()
          ? "Could not fetch YouTube description. Please paste timestamp chapters manually."
          : null,
    },
  };
}

export async function createCourseFromYouTube(input: CreateYouTubeCourseInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");
  if (!["COMPANY", "COMPANY", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Эрхгүй");
  }

  const parsed = createYouTubeCourseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const slug = await generateSlug(parsed.data.title, "courses");
  const description = `YouTube course: ${parsed.data.title}`;

  const course = await db.course.create({
    data: {
      title: parsed.data.title,
      slug,
      description,
      shortDescription: "YouTube timestamp course",
      thumbnailUrl: parsed.data.coverImage,
      coverImage: parsed.data.coverImage,
      sourceType: "YOUTUBE",
      sourceYoutubeId: parsed.data.sourceYoutubeId,
      sourceYoutubeUrl: parsed.data.sourceYoutubeUrl,
      durationSeconds: parsed.data.durationSeconds ?? null,
      duration: parsed.data.durationSeconds ? Math.ceil(parsed.data.durationSeconds / 60) : null,
      instructorId: session.user.id,
      organizationId: session.user.organizationId,
      status: "DRAFT",
      tags: ["youtube"],
      prerequisites: [],
      learningOutcomes: ["Watch the YouTube course by timestamp sections"],
      sections: {
        create: parsed.data.sections.map((section, index) => ({
          title: section.title,
          order: index + 1,
          startSeconds: section.startSeconds,
          endSeconds: section.endSeconds ?? null,
        })),
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("saved sections", course.sections.length);
  }

  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${course.id}`);
  return { success: true, data: course };
}

function parseIsoDuration(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// ─── MODULE CRUD ──────────────────────────────────────────────────────────────

export async function createModule(input: CreateModuleInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = createModuleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const course = await db.course.findUnique({ where: { id: parsed.data.courseId } });
  const canEdit =
    course &&
    (course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" && course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  const lastModule = await db.courseModule.findFirst({
    where: { courseId: parsed.data.courseId },
    orderBy: { orderIndex: "desc" },
  });

  const courseModule = await db.courseModule.create({
    data: {
      ...parsed.data,
      orderIndex: (lastModule?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  return { success: true, data: courseModule };
}

export async function deleteModule(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const courseModule = await db.courseModule.findUnique({
    where: { id },
    include: { course: true },
  });

  const canEdit =
    courseModule &&
    (courseModule.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" &&
        courseModule.course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  await db.courseModule.delete({ where: { id } });

  revalidatePath(`/instructor/courses/${courseModule.courseId}`);
  return { success: true };
}

// ─── LESSON CRUD ──────────────────────────────────────────────────────────────

export async function createLesson(input: CreateLessonInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const courseModule = await db.courseModule.findUnique({
    where: { id: parsed.data.moduleId },
    include: { course: true },
  });

  const canEditLesson =
    courseModule &&
    (courseModule.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" &&
        courseModule.course.organizationId === session.user.organizationId));
  if (!canEditLesson) return { error: "Эрхгүй" };

  const lastLesson = await db.lesson.findFirst({
    where: { moduleId: parsed.data.moduleId },
    orderBy: { orderIndex: "desc" },
  });

  const lesson = await db.lesson.create({
    data: {
      ...parsed.data,
      contentUrl: parsed.data.contentUrl || null,
      videoUrl: parsed.data.videoUrl || null,
      videoProvider: parsed.data.videoProvider ?? null,
      sourceCreditName: parsed.data.sourceCreditName || null,
      sourceCreditUrl: parsed.data.sourceCreditUrl || null,
      orderIndex: (lastLesson?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath(`/instructor/courses/${courseModule.courseId}/lessons`);
  return { success: true, data: lesson };
}

export async function updateLesson(lessonId: string, input: UpdateLessonInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  const canEdit =
    lesson &&
    (lesson.module.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" &&
        lesson.module.course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  const parsed = updateLessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  await db.lesson.update({
    where: { id: lessonId },
    data: {
      ...d,
      contentUrl: d.contentUrl === "" ? null : d.contentUrl,
      videoUrl: d.videoUrl === "" ? null : d.videoUrl,
      sectionId: d.sectionId === "" ? null : d.sectionId,
      videoProvider: d.videoProvider ?? undefined,
      sourceCreditName: d.sourceCreditName || null,
      sourceCreditUrl: d.sourceCreditUrl === "" ? null : d.sourceCreditUrl,
      // Treat 0 as null so YouTube embeds never get end=0
      startTimeSeconds:
        d.startTimeSeconds != null && d.startTimeSeconds > 0 ? d.startTimeSeconds : null,
      endTimeSeconds:
        d.endTimeSeconds != null && d.endTimeSeconds > 0 ? d.endTimeSeconds : null,
    },
  });

  revalidatePath(`/instructor/courses/${lesson.module.courseId}`);
  return { success: true };
}

/** One-shot fix: null out any lesson where startTimeSeconds=0 or endTimeSeconds=0. */
export async function fixZeroTimeSegments(courseId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const course = await db.course.findUnique({ where: { id: courseId } });
  const canFix =
    course &&
    (course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" &&
        course.organizationId === session.user.organizationId));
  if (!canFix) return { error: "Эрхгүй" };

  const [fixedEnd, fixedStart] = await Promise.all([
    db.lesson.updateMany({
      where: { module: { courseId }, endTimeSeconds: 0 },
      data: { endTimeSeconds: null },
    }),
    db.lesson.updateMany({
      where: { module: { courseId }, startTimeSeconds: 0 },
      data: { startTimeSeconds: null },
    }),
  ]);

  revalidatePath(`/instructor/courses/${courseId}`);
  return { success: true, fixed: fixedEnd.count + fixedStart.count };
}

export async function deleteLesson(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  const canEdit =
    lesson &&
    (lesson.module.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" &&
        lesson.module.course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  await db.lesson.delete({ where: { id: lessonId } });

  revalidatePath(`/instructor/courses/${lesson.module.courseId}`);
  return { success: true };
}

export async function reorderLessons(input: { lessons: { id: string; orderIndex: number }[] }) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = reorderLessonsSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const lessonIds = parsed.data.lessons.map((l) => l.id);

  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds } },
    include: { module: { include: { course: true } } },
  });

  if (lessons.length !== lessonIds.length) return { error: "Зарим хичээл олдсонгүй" };

  const canEdit = lessons.every((lesson) => {
    const course = lesson.module.course;
    return (
      session.user.role === "SUPER_ADMIN" ||
      course.instructorId === session.user.id ||
      (session.user.role === "COMPANY" && course.organizationId === session.user.organizationId)
    );
  });

  if (!canEdit) return { error: "Эрхгүй" };

  await db.$transaction(
    parsed.data.lessons.map((l) =>
      db.lesson.update({ where: { id: l.id }, data: { orderIndex: l.orderIndex } })
    )
  );

  return { success: true };
}

export async function createLessonSection(input: LessonSectionInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const parsed = lessonSectionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const lesson = await db.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    include: { module: { include: { course: true } } },
  });

  const canEdit =
    lesson &&
    (lesson.module.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "COMPANY" &&
        lesson.module.course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  const lastSection = await db.lessonSection.findFirst({
    where: { lessonId: parsed.data.lessonId },
    orderBy: { order: "desc" },
  });

  const section = await db.lessonSection.create({
    data: {
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      order: parsed.data.order ?? (lastSection?.order ?? -1) + 1,
      youtubeId: parsed.data.youtubeId,
      startSeconds: parsed.data.startSeconds,
      endSeconds: parsed.data.endSeconds,
      taskTitle: parsed.data.taskTitle || null,
      taskDescription: parsed.data.taskDescription || null,
      pdfUrl: parsed.data.pdfUrl || null,
      resourceUrl: parsed.data.resourceUrl || null,
    },
  });

  revalidatePath(`/instructor/courses/${lesson.module.courseId}`);
  revalidatePath(`/student/courses/${lesson.module.courseId}/learn`);
  return { success: true, data: section };
}

// ─── ENROLLMENT ───────────────────────────────────────────────────────────────

export async function enrollCourse(input: EnrollCourseInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = enrollCourseSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const { courseId } = parsed.data;

  try {
    const course = await db.course.findUnique({ where: { id: courseId, status: "PUBLISHED" } });
    if (!course) return { error: "Курс олдсонгүй" };

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
    });
    if (existing) return { error: "Та аль хэдийн бүртгүүлсэн байна" };

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true },
    });

    const listPrice = Number(course.discountPrice ?? course.price ?? 0);
    if (listPrice > 0) {
      const hasSubscriptionAccess = hasActiveCourseAccess(
        subscription?.plan,
        subscription?.status,
      );
      const completedPayment = await db.payment.findFirst({
        where: {
          userId: session.user.id,
          courseId,
          status: "COMPLETED",
        },
        select: { id: true },
      });
      if (!hasSubscriptionAccess && !completedPayment) {
        return { error: "Энэ курсын төлбөр төлөгдөөгүй байна. Төлбөр төлсний дараа бүртгүүлнэ үү." };
      }
    }

    const enrollment = await db.enrollment.create({
      data: {
        studentId: session.user.id,
        courseId,
        status: "ACTIVE",
        source: hasActiveCourseAccess(subscription?.plan, subscription?.status) ? "subscription" : "free_preview",
      },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        type: "ENROLLMENT_SUCCESS",
        title: "Бүртгэл амжилттай",
        body: `"${course.title}" нэмэгдлээ.`,
        data: { courseId, enrollmentId: enrollment.id },
      },
    });
    revalidateUserSidebar(session.user.id);
    revalidateUserNotifications(session.user.id);

    revalidatePath("/student/courses");
    revalidatePath("/courses");
  } catch (err) {
    console.error("enrollCourse error:", err);
    return { error: "Бүртгэл хийхэд алдаа гарлаа" };
  }

  // redirect() must be called outside try/catch in Next.js App Router
  redirect(`/student/courses/${courseId}/learn`);
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

export async function markLessonComplete(lessonId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");
  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true },
  });
  if (!hasActiveCourseAccess(subscription?.plan, subscription?.status)) {
    return { error: "Upgrade required to continue this lesson" };
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return { error: "Хичээл олдсонгүй" };

  const courseId = lesson.module.courseId;

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.user.id, courseId } },
  });
  if (!enrollment) return { error: "Бүртгэл олдсонгүй" };

  await db.progress.upsert({
    where: { studentId_lessonId: { studentId: session.user.id, lessonId } },
    create: {
      studentId: session.user.id,
      courseId,
      lessonId,
      enrollmentId: enrollment.id,
      isCompleted: true,
      completedAt: new Date(),
      lastAccessedAt: new Date(),
    },
    update: { isCompleted: true, completedAt: new Date(), lastAccessedAt: new Date() },
  });

  // Check if course is completed
  const totalLessons = await db.lesson.count({
    where: { module: { courseId } },
  });
  const completedLessons = await db.progress.count({
    where: { studentId: session.user.id, courseId, isCompleted: true },
  });

  const courseCompleted = completedLessons >= totalLessons;

  if (courseCompleted) {
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    revalidateUserSidebar(session.user.id);

    // Auto-generate course certificate
    await generateCourseCertificate(session.user.id, courseId);

    // Check if any programs this student is enrolled in are now fully completed
    await checkAndIssueProgramCertificates(session.user.id, courseId);
  }

  revalidatePath(`/student/courses/${courseId}/learn`);
  return { success: true, courseCompleted };
}

export async function markLessonSectionComplete(input: { sectionId: string }) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const parsed = completeLessonSectionSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу section" };

  const section = await db.lessonSection.findUnique({
    where: { id: parsed.data.sectionId },
    include: {
      lesson: {
        include: {
          sections: { select: { id: true } },
          module: { include: { course: true } },
        },
      },
    },
  });
  if (!section) return { error: "Section олдсонгүй" };

  const courseId = section.lesson.module.courseId;
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.user.id, courseId } },
  });
  if (!enrollment) return { error: "Бүртгэл олдсонгүй" };

  await db.lessonSectionCompletion.upsert({
    where: { sectionId_studentId: { sectionId: section.id, studentId: session.user.id } },
    create: { sectionId: section.id, studentId: session.user.id },
    update: { completedAt: new Date() },
  });

  const completedSections = await db.lessonSectionCompletion.count({
    where: {
      studentId: session.user.id,
      sectionId: { in: section.lesson.sections.map((item) => item.id) },
    },
  });

  const lessonCompleted =
    section.lesson.sections.length > 0 && completedSections >= section.lesson.sections.length;
  let courseCompleted = false;

  if (lessonCompleted) {
    const result = await markLessonComplete(section.lessonId);
    courseCompleted = Boolean(result && "courseCompleted" in result && result.courseCompleted);
  }

  revalidatePath(`/student/courses/${courseId}/learn`);
  return { success: true, lessonCompleted, courseCompleted };
}

export async function trackLessonView(lessonId: string, courseId: string, enrollmentId: string) {
  const session = await auth();
  if (!session?.user) return;
  await db.progress.upsert({
    where: { studentId_lessonId: { studentId: session.user.id, lessonId } },
    create: {
      studentId: session.user.id,
      courseId,
      lessonId,
      enrollmentId,
      isCompleted: false,
      lastAccessedAt: new Date(),
    },
    update: { lastAccessedAt: new Date() },
  });
}

async function generateCourseCertificate(studentId: string, courseId: string) {
  // Find existing cert for this course (check by studentId + courseId index)
  const existing = await db.certificate.findFirst({
    where: { studentId, courseId },
  });
  if (existing) return existing;

  // Get course org for the required organizationId field
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { organizationId: true, title: true, instructor: { select: { name: true } } },
  });

  const verificationCode = randomUUID().replace(/-/g, "").toUpperCase().slice(0, 12);
  const certificateNo = `CERT-${Date.now()}-${verificationCode.slice(0, 6)}`;

  const cert = await db.certificate.create({
    data: {
      studentId,
      courseId,
      organizationId: course?.organizationId ?? undefined,
      certificateNo,
      verificationCode,
      metadata: { courseTitle: course?.title, instructorName: course?.instructor?.name },
    },
  });

  await db.notification.create({
    data: {
      userId: studentId,
      type: "CERTIFICATE_READY",
      title: "Сертификат бэлэн болсон!",
      body: "Та курсаа амжилттай дүүргэлээ. Сертификатаа татаж авна уу.",
      data: { certificateId: cert.id },
    },
  });
  revalidateUserNotifications(studentId);

  return cert;
}

// ─── PROGRAM COMPLETION CHECK ─────────────────────────────────────────────────
async function checkAndIssueProgramCertificates(studentId: string, completedCourseId: string) {
  // Find all programs that include this course and the student is enrolled in
  const programEnrollments = await db.programEnrollment.findMany({
    where: {
      studentId,
      status: { not: "COMPLETED" },
      program: {
        status: "PUBLISHED",
        courses: { some: { courseId: completedCourseId } },
      },
    },
    include: {
      program: {
        include: {
          courses: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  });

  for (const pe of programEnrollments) {
    const requiredCourses = pe.program.courses.filter((pc) => pc.isRequired);
    if (requiredCourses.length === 0) continue;

    // Check if all required courses are completed
    const completedEnrollments = await db.enrollment.findMany({
      where: {
        studentId,
        courseId: { in: requiredCourses.map((pc) => pc.courseId) },
        status: "COMPLETED",
      },
    });

    const completedSet = new Set(completedEnrollments.map((e) => e.courseId));
    const allDone = requiredCourses.every((pc) => completedSet.has(pc.courseId));
    if (!allDone) continue;

    // Issue program certificate if not already issued
    const existing = await db.certificate.findUnique({
      where: { studentId_programId: { studentId, programId: pe.programId } },
    });
    if (existing) continue;

    const code = randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16);
    const certNo = `PROG-${Date.now()}-${code.slice(0, 6)}`;

    const cert = await db.$transaction(async (tx) => {
      const c = await tx.certificate.create({
        data: {
          studentId,
          organizationId: pe.program.organization.id,
          programId: pe.programId,
          programEnrollmentId: pe.id,
          certificateNo: certNo,
          verificationCode: code,
          metadata: {
            programTitle: pe.program.title,
            orgName: pe.program.organization.name,
            issuedBy: pe.program.organization.name,
          },
        },
      });
      await tx.programEnrollment.update({
        where: { id: pe.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return c;
    });

    await db.notification.create({
      data: {
        userId: studentId,
        type: "CERTIFICATE_READY",
        title: "Программын сертификат бэлэн боллоо!",
        body: `"${pe.program.title}" программыг амжилттай дүүргэлээ!`,
        data: { certificateId: cert.id, programId: pe.programId },
      },
    });
    revalidateUserNotifications(studentId);
  }
}

// ─── SAVE / UNSAVE COURSE ─────────────────────────────────────────────────────

export async function toggleSavedCourse(courseId: string): Promise<{ saved: boolean }> {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const existing = await db.savedCourse.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  if (existing) {
    await db.savedCourse.delete({ where: { id: existing.id } });
    revalidateUserSavedCourses(session.user.id);
    revalidatePath("/student");
    revalidatePath("/student/courses");
    revalidatePath("/student/catalog");
    revalidatePath("/student/saved");
    return { saved: false };
  } else {
    await db.savedCourse.create({ data: { userId: session.user.id, courseId } });
    revalidateUserSavedCourses(session.user.id);
    revalidatePath("/student");
    revalidatePath("/student/courses");
    revalidatePath("/student/catalog");
    revalidatePath("/student/saved");
    return { saved: true };
  }
}
