import type { Prisma } from "@prisma/client";
import { deleteCourseById } from "@/lib/user/delete-course";

type Tx = Prisma.TransactionClient;

/** Байгууллага болон түүний бүх course/program-ийг устгана. */
export async function deleteOrganizationById(tx: Tx, organizationId: string) {
  const courses = await tx.course.findMany({
    where: { organizationId },
    select: { id: true },
  });

  for (const course of courses) {
    await deleteCourseById(tx, course.id);
  }

  const programs = await tx.program.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const programIds = programs.map((p) => p.id);

  if (programIds.length > 0) {
    await tx.programEnrollment.deleteMany({ where: { programId: { in: programIds } } });
    await tx.programCourse.deleteMany({ where: { programId: { in: programIds } } });
    await tx.certificate.deleteMany({ where: { programId: { in: programIds } } });
    await tx.capstone.deleteMany({ where: { programId: { in: programIds } } });
    await tx.orderItem.deleteMany({ where: { programId: { in: programIds } } });
    await tx.program.deleteMany({ where: { id: { in: programIds } } });
  }

  await tx.orgInvite.deleteMany({ where: { organizationId } });
  await tx.organizationMember.deleteMany({ where: { organizationId } });
  await tx.orgPayout.deleteMany({ where: { organizationId } });
  await tx.certificate.deleteMany({ where: { organizationId } });
  await tx.user.updateMany({
    where: { organizationId },
    data: { organizationId: null },
  });
  await tx.organization.delete({ where: { id: organizationId } });
}
