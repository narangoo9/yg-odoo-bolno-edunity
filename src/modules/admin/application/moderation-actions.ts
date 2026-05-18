"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import {
  isOrganizationApproved,
  orgApprovedSettings,
  orgRejectedSettings,
} from "@/lib/organization-approval";
import { NotificationType } from "@prisma/client";
import { revalidateUserNotifications } from "@/lib/dashboard-cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Эрхгүй");
  }
  return session;
}

export async function approveOrganization(orgId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });
  if (!org) return { error: "Байгууллага олдсонгүй" };

  await db.organization.update({
    where: { id: orgId },
    data: { isActive: true, settings: orgApprovedSettings() },
  });

  const appUrl = getAppUrl();
  if (org.owner.email) {
    sendEmail({
      to: org.owner.email,
      subject: `${org.name} — бүртгэл зөвшөөрөгдлөө`,
      template: "org-approved",
      data: { name: org.owner.name ?? "Админ", orgName: org.name, loginUrl: `${appUrl}/login` },
    }).catch(() => null);

    await db.notification.create({
      data: {
        userId: org.owner.id,
        type: NotificationType.SYSTEM,
        title: "Байгууллага зөвшөөрөгдлөө",
        body: `${org.name} одоо платформд нэвтэрч ажиллах боломжтой.`,
        data: { orgId },
      },
    });
    revalidateUserNotifications(org.owner.id);
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}

export async function rejectOrganization(orgId: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });
  if (!org) return { error: "Байгууллага олдсонгүй" };

  await db.organization.update({
    where: { id: orgId },
    data: { isActive: false, settings: orgRejectedSettings() },
  });

  if (org.owner.email) {
    sendEmail({
      to: org.owner.email,
      subject: `${org.name} — бүртгэл татгалзагдлаа`,
      template: "org-rejected",
      data: { name: org.owner.name ?? "Админ", orgName: org.name },
    }).catch(() => null);
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}

export async function approveCourse(courseId: string) {
  await requireSuperAdmin();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
      instructor: { select: { id: true, email: true, name: true } },
    },
  });
  if (!course) return { error: "Курс олдсонгүй" };

  await db.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  if (course.instructor.email) {
    sendEmail({
      to: course.instructor.email,
      subject: `Курс нийтлэгдлээ: ${course.title}`,
      template: "course-approved",
      data: {
        name: course.instructor.name ?? "Багш",
        courseTitle: course.title,
        courseUrl: `${getAppUrl()}/instructor/courses/${courseId}`,
      },
    }).catch(() => null);

    await db.notification.create({
      data: {
        userId: course.instructor.id,
        type: NotificationType.SYSTEM,
        title: "Курс зөвшөөрөгдлөө",
        body: `"${course.title}" одоо нийтэд нээгдлээ.`,
        data: { courseId },
      },
    });
    revalidateUserNotifications(course.instructor.id);
  }

  revalidatePath("/admin/courses");
  revalidatePath("/instructor/courses");
  revalidatePath("/courses");
  return { success: true };
}

export async function rejectCourse(courseId: string) {
  await requireSuperAdmin();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      instructor: { select: { id: true, email: true, name: true } },
    },
  });
  if (!course) return { error: "Курс олдсонгүй" };

  await db.course.update({
    where: { id: courseId },
    data: { status: "DRAFT" },
  });

  if (course.instructor.email) {
    await db.notification.create({
      data: {
        userId: course.instructor.id,
        type: NotificationType.SYSTEM,
        title: "Курсын хүсэлт татгалзагдлаа",
        body: `"${course.title}"-ийг засаад дахин илгээнэ үү.`,
        data: { courseId },
      },
    });
    revalidateUserNotifications(course.instructor.id);
  }

  revalidatePath("/admin/courses");
  revalidatePath("/instructor/courses");
  return { success: true };
}

export async function notifyAdminOrgRegistration(payload: {
  orgName: string;
  orgSlug: string;
  adminName: string;
  adminEmail: string;
  orgId: string;
}) {
  const reviewUrl = `${getAppUrl()}/admin/organizations`;
  await sendEmail({
    to: env.supportEmail,
    subject: `Шинэ байгууллага: ${payload.orgName}`,
    template: "org-registration-admin",
    data: { ...payload, reviewUrl },
  }).catch(() => null);
}

export async function notifyAdminCourseReview(payload: {
  courseId: string;
  courseTitle: string;
  instructorName: string;
}) {
  const reviewUrl = `${getAppUrl()}/admin/courses?status=UNDER_REVIEW`;
  await sendEmail({
    to: env.supportEmail,
    subject: `Курс хяналтад: ${payload.courseTitle}`,
    template: "course-review-admin",
    data: { ...payload, reviewUrl },
  }).catch(() => null);
}

export async function getOrganizationApprovalState(orgId: string) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { isActive: true, settings: true },
  });
  return isOrganizationApproved(org);
}
