"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveCourseAccess } from "@/lib/subscription-access";
import { revalidateUserNotifications, revalidateUserSidebar } from "@/lib/dashboard-cache";
import { generateSlug } from "@/shared/utils/slug";
import {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  createLessonSchema,
  enrollCourseSchema,
  reorderLessonsSchema,
} from "../domain/schemas";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CreateModuleInput,
  CreateLessonInput,
  EnrollCourseInput,
} from "../domain/schemas";

// ─── COURSE CRUD ──────────────────────────────────────────────────────────────

export async function createCourse(input: CreateCourseInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");
  if (!["INSTRUCTOR", "ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
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
    (session.user.role === "ORG_ADMIN" && course.organizationId === session.user.organizationId);

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

  if (course.instructorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return { error: "Эрхгүй" };
  }

  await db.course.update({ where: { id }, data: { status: "ARCHIVED" } });

  revalidatePath("/instructor/courses");
  return { success: true };
}

export async function publishCourse(id: string) {
  return updateCourse(id, { status: "PUBLISHED" });
}

export async function unpublishCourse(id: string) {
  return updateCourse(id, { status: "DRAFT" });
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
      (session.user.role === "ORG_ADMIN" && course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  const lastModule = await db.courseModule.findFirst({
    where: { courseId: parsed.data.courseId },
    orderBy: { orderIndex: "desc" },
  });

  const module = await db.courseModule.create({
    data: {
      ...parsed.data,
      orderIndex: (lastModule?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  return { success: true, data: module };
}

export async function deleteModule(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const module = await db.courseModule.findUnique({
    where: { id },
    include: { course: true },
  });

  const canEdit =
    module &&
    (module.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "ORG_ADMIN" &&
        module.course.organizationId === session.user.organizationId));
  if (!canEdit) return { error: "Эрхгүй" };

  await db.courseModule.delete({ where: { id } });

  revalidatePath(`/instructor/courses/${module.courseId}`);
  return { success: true };
}

// ─── LESSON CRUD ──────────────────────────────────────────────────────────────

export async function createLesson(input: CreateLessonInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Нэвтрэх шаардлагатай");

  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const module = await db.courseModule.findUnique({
    where: { id: parsed.data.moduleId },
    include: { course: true },
  });

  const canEditLesson =
    module &&
    (module.course.instructorId === session.user.id ||
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "ORG_ADMIN" &&
        module.course.organizationId === session.user.organizationId));
  if (!canEditLesson) return { error: "Эрхгүй" };

  const lastLesson = await db.lesson.findFirst({
    where: { moduleId: parsed.data.moduleId },
    orderBy: { orderIndex: "desc" },
  });

  const lesson = await db.lesson.create({
    data: {
      ...parsed.data,
      orderIndex: (lastLesson?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath(`/instructor/courses/${module.courseId}/lessons`);
  return { success: true, data: lesson };
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
      (session.user.role === "ORG_ADMIN" && course.organizationId === session.user.organizationId)
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

    if (!hasActiveCourseAccess(subscription?.plan, subscription?.status)) {
      return { requiresUpgrade: true as const };
    }

    const enrollment = await db.enrollment.create({
      data: {
        studentId: session.user.id,
        courseId,
        status: "ACTIVE",
        source: "subscription",
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
    },
    update: { isCompleted: true, completedAt: new Date() },
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

