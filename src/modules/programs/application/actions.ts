"use server";

import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidateUserSidebar } from "@/lib/dashboard-cache";
import { programSchema, addProgramCourseSchema, enrollProgramSchema } from "../domain/schemas";
import type { ProgramInput, AddProgramCourseInput, EnrollProgramInput } from "../domain/schemas";

// ─── CREATE PROGRAM ───────────────────────────────────────────────────────────

export async function createProgram(input: ProgramInput) {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  const parsed = programSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const orgId = session.user.organizationId;
  if (!orgId && session.user.role !== "SUPER_ADMIN") {
    return { error: "Байгууллага олдсонгүй" };
  }

  const existing = await db.program.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: { slug: ["Энэ slug аль хэдийн ашиглагдаж байна"] } };

  const program = await db.program.create({
    data: {
      ...parsed.data,
      organizationId: orgId!,
      description: parsed.data.description ?? null,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      certificateTitle: parsed.data.certificateTitle ?? null,
      certificateDescription: parsed.data.certificateDescription ?? null,
    },
  });

  return { success: true, program };
}

// ─── UPDATE PROGRAM ───────────────────────────────────────────────────────────

export async function updateProgram(programId: string, input: Partial<ProgramInput>) {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) return { error: "Программ олдсонгүй" };

  if (
    session.user.role !== "SUPER_ADMIN" &&
    program.organizationId !== session.user.organizationId
  ) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  const updated = await db.program.update({
    where: { id: programId },
    data: input,
  });

  return { success: true, program: updated };
}

// ─── PUBLISH / ARCHIVE PROGRAM ────────────────────────────────────────────────

export async function publishProgram(programId: string) {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  const program = await db.program.findUnique({
    where: { id: programId },
    include: { courses: true },
  });
  if (!program) return { error: "Программ олдсонгүй" };
  if (program.courses.length === 0) {
    return { error: "Нэг ч курс нэмээгүй байна. Эхлээд курс нэмнэ үү." };
  }

  const updated = await db.program.update({
    where: { id: programId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  return { success: true, program: updated };
}

// ─── ADD COURSE TO PROGRAM ────────────────────────────────────────────────────

export async function addCourseToProgram(input: AddProgramCourseInput) {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  const parsed = addProgramCourseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { programId, courseId, orderIndex, isRequired } = parsed.data;

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) return { error: "Программ олдсонгүй" };

  if (
    session.user.role !== "SUPER_ADMIN" &&
    program.organizationId !== session.user.organizationId
  ) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  // Course must belong to same org
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.organizationId !== program.organizationId) {
    return { error: "Курс энэ байгууллагад харьяалагдахгүй байна" };
  }

  const pc = await db.programCourse.upsert({
    where: { programId_courseId: { programId, courseId } },
    create: { programId, courseId, orderIndex, isRequired },
    update: { orderIndex, isRequired },
  });

  return { success: true, programCourse: pc };
}

// ─── REMOVE COURSE FROM PROGRAM ───────────────────────────────────────────────

export async function removeCourseFromProgram(programId: string, courseId: string) {
  const session = await auth();
  if (!session?.user || !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) return { error: "Программ олдсонгүй" };

  if (
    session.user.role !== "SUPER_ADMIN" &&
    program.organizationId !== session.user.organizationId
  ) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  await db.programCourse.delete({
    where: { programId_courseId: { programId, courseId } },
  });

  return { success: true };
}

// ─── ENROLL IN PROGRAM ────────────────────────────────────────────────────────

export async function enrollInProgram(input: EnrollProgramInput) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const parsed = enrollProgramSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { programId, source } = parsed.data;

  const program = await db.program.findUnique({
    where: { id: programId, status: "PUBLISHED" },
    include: { courses: { include: { course: true } } },
  });
  if (!program) return { error: "Программ олдсонгүй эсвэл нийтлэгдээгүй байна" };

  const existing = await db.programEnrollment.findUnique({
    where: { studentId_programId: { studentId: session.user.id, programId } },
  });
  if (existing) return { error: "Та аль хэдийн бүртгэгдсэн байна" };

  const enrollment = await db.programEnrollment.create({
    data: {
      studentId: session.user.id,
      programId,
      source,
    },
  });

  // Also auto-enroll in each course in the program
  for (const pc of program.courses) {
    await db.enrollment.upsert({
      where: { studentId_courseId: { studentId: session.user.id, courseId: pc.courseId } },
      create: { studentId: session.user.id, courseId: pc.courseId, source: "organization" },
      update: {},
    });
  }
  revalidateUserSidebar(session.user.id);

  return { success: true, enrollment };
}

// ─── ISSUE PROGRAM CERTIFICATE ────────────────────────────────────────────────

export async function issueProgramCertificate(programEnrollmentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрэх шаардлагатай" };

  const enrollment = await db.programEnrollment.findUnique({
    where: { id: programEnrollmentId },
    include: {
      program: {
        include: {
          courses: { include: { course: { include: { enrollments: true } } } },
          organization: true,
        },
      },
      student: true,
    },
  });

  if (!enrollment) return { error: "Бүртгэл олдсонгүй" };
  if (enrollment.studentId !== session.user.id && !["ORG_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Зөвшөөрөл хүрэлцэхгүй байна" };
  }

  // Verify all required courses are completed
  const requiredCourses = enrollment.program.courses.filter((pc) => pc.isRequired);
  for (const pc of requiredCourses) {
    const courseEnrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: enrollment.studentId, courseId: pc.courseId } },
    });
    if (courseEnrollment?.status !== "COMPLETED") {
      return { error: `"${pc.course.title}" курс дуусаагүй байна` };
    }
  }

  // Check if cert already issued
  const existing = await db.certificate.findUnique({
    where: { studentId_programId: { studentId: enrollment.studentId, programId: enrollment.programId } },
  });
  if (existing) return { success: true, certificate: existing };

  const certNo = `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const verificationCode = uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase();

  const certificate = await db.$transaction(async (tx) => {
    const cert = await tx.certificate.create({
      data: {
        studentId: enrollment.studentId,
        organizationId: enrollment.program.organizationId,
        programId: enrollment.programId,
        programEnrollmentId,
        certificateNo: certNo,
        verificationCode,
        metadata: {
          programTitle: enrollment.program.title,
          orgName: enrollment.program.organization.name,
          studentName: enrollment.student.name,
          issuedBy: enrollment.program.organization.name,
        },
      },
    });

    await tx.programEnrollment.update({
      where: { id: programEnrollmentId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return cert;
  });
  revalidateUserSidebar(enrollment.studentId);

  return { success: true, certificate };
}
