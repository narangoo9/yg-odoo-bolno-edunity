/**
 * Super admin + YouTube embed course-тай company-г үлдээж бусад user-ийг DB-ээс устгана.
 *
 * Ажиллуулах:
 *   npx tsx scripts/purge-non-yt-users.ts           # dry-run (юу устгагдахыг харуулна)
 *   npx tsx scripts/purge-non-yt-users.ts --confirm # бодит устгалт
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { deleteCourseById } from "../src/lib/user/delete-course";
import { deleteOrganizationById } from "../src/lib/user/delete-organization";
import { deleteUserById } from "../src/lib/user/delete-user";

const prisma = new PrismaClient();
const confirm = process.argv.includes("--confirm");

/** User бүр олон table цэвэрлэдэг тул transaction timeout урт байх ёстой. */
const TX_OPTIONS = { maxWait: 60_000, timeout: 300_000 };

const youtubeCourseWhere: Prisma.CourseWhereInput = {
  OR: [
    { sourceType: "YOUTUBE" },
    { sourceYoutubeId: { not: null } },
    { slug: { startsWith: "youtube-" } },
  ],
};

async function buildKeepSets() {
  const ytCourses = await prisma.course.findMany({
    where: youtubeCourseWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      organizationId: true,
      instructorId: true,
    },
  });

  const keepOrgIds = new Set<string>();
  const keepUserIds = new Set<string>();

  for (const course of ytCourses) {
    if (course.organizationId) keepOrgIds.add(course.organizationId);
    keepUserIds.add(course.instructorId);
  }

  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, email: true, name: true },
  });
  for (const admin of superAdmins) {
    keepUserIds.add(admin.id);
  }

  for (const orgId of keepOrgIds) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, ownerId: true },
    });
    if (!org) continue;

    keepUserIds.add(org.ownerId);

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      select: { userId: true },
    });
    for (const member of members) {
      keepUserIds.add(member.userId);
    }

    const orgUsers = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    for (const user of orgUsers) {
      keepUserIds.add(user.id);
    }
  }

  return { ytCourses, keepOrgIds, keepUserIds, superAdmins };
}

async function main() {
  console.log(confirm ? "\n⚠️  CONFIRM MODE — DB өөрчлөлт хийгдэнэ\n" : "\n📋 DRY RUN — зөвхөн тайлан (устгахгүй)\n");

  const { ytCourses, keepOrgIds, keepUserIds, superAdmins } = await buildKeepSets();

  const allOrgs = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true, ownerId: true },
  });
  const orgsToDelete = allOrgs.filter((org) => !keepOrgIds.has(org.id));

  const nonYtCoursesInKeptOrgs = await prisma.course.findMany({
    where: {
      organizationId: { in: [...keepOrgIds] },
      NOT: youtubeCourseWhere,
    },
    select: { id: true, title: true, slug: true, organizationId: true },
  });

  const usersToDelete = await prisma.user.findMany({
    where: { id: { notIn: [...keepUserIds] } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  const keptUsers = await prisma.user.findMany({
    where: { id: { in: [...keepUserIds] } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { role: "asc" },
  });

  console.log("── Үлдэх YouTube course ──");
  console.table(
    ytCourses.map((c) => ({
      title: c.title.slice(0, 50),
      slug: c.slug,
      orgId: c.organizationId?.slice(0, 8) ?? "—",
    })),
  );

  console.log(`\n── Үлдэх user (${keptUsers.length}) ──`);
  console.table(
    keptUsers.map((u) => ({
      email: u.email,
      role: u.role,
      name: u.name,
    })),
  );

  console.log(`\n── Устгах байгууллага (${orgsToDelete.length}) ──`);
  if (orgsToDelete.length > 0) {
    console.table(orgsToDelete.map((o) => ({ name: o.name, slug: o.slug })));
  }

  console.log(`\n── Үлдэх org-оос YouTube биш course устгах (${nonYtCoursesInKeptOrgs.length}) ──`);
  if (nonYtCoursesInKeptOrgs.length > 0) {
    console.table(nonYtCoursesInKeptOrgs.map((c) => ({ slug: c.slug, title: c.title.slice(0, 40) })));
  }

  console.log(`\n── Устгах user (${usersToDelete.length}) ──`);
  if (usersToDelete.length > 0) {
    console.table(
      usersToDelete.slice(0, 50).map((u) => ({
        email: u.email,
        role: u.role,
        name: u.name,
      })),
    );
    if (usersToDelete.length > 50) {
      console.log(`... болон дахиад ${usersToDelete.length - 50} user`);
    }
  }

  if (!confirm) {
    console.log("\n✅ Dry-run дууслаа. Бодит устгах: npx tsx scripts/purge-non-yt-users.ts --confirm\n");
    return;
  }

  if (superAdmins.length === 0) {
    throw new Error("SUPER_ADMIN user олдсонгүй — устгалтыг зогсоолоо.");
  }

  console.log("Устгалт эхэлж байна...\n");

  for (const org of orgsToDelete) {
    await prisma.$transaction(async (tx) => {
      await deleteOrganizationById(tx, org.id);
    }, TX_OPTIONS);
    console.log(`🗑 Org устгалаа: ${org.name}`);
  }

  for (const course of nonYtCoursesInKeptOrgs) {
    await prisma.$transaction(async (tx) => {
      await deleteCourseById(tx, course.id);
    }, TX_OPTIONS);
    console.log(`🗑 Course устгалаа: ${course.slug}`);
  }

  let deletedUsers = 0;
  for (const user of usersToDelete) {
    const stillExists = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
    if (!stillExists) continue;

    const ownsKeptOrg = await prisma.organization.findFirst({
      where: { ownerId: user.id, id: { in: [...keepOrgIds] } },
      select: { id: true },
    });
    if (ownsKeptOrg) {
      console.log(`⏭ Алгасав (YT company owner): ${user.email}`);
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await deleteUserById(tx, user.id);
      }, TX_OPTIONS);
      deletedUsers += 1;
      console.log(`🗑 User устгалаа: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`✗ User устгахад алдаа (${user.email}):`, error);
    }
  }

  const remaining = await prisma.user.count();
  const remainingYtCourses = await prisma.course.count({ where: youtubeCourseWhere });

  console.log("\n── Дууссан ──");
  console.log(`User устгасан: ${deletedUsers}`);
  console.log(`DB-д үлдсэн user: ${remaining}`);
  console.log(`YouTube course үлдсэн: ${remainingYtCourses}`);
  console.log("\nОдоо шинээр бүртгүүлж туршина уу.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
