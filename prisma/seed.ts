import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const OLD_DEMO_SLUGS = [
  "python-beginners",
  "react-modern",
  "ui-ux-intro",
  "digital-marketing",
  "data-science-python",
  "sql-database",
  "startup-basics",
];

const OLD_YOUTUBE_DEMO_SLUG = "nextjs-youtube-course";

async function main() {
  const passwordHash = await bcrypt.hash("Student@1234", 10);
  const instructorHash = await bcrypt.hash("Instructor@1234", 10);

  const standardUser = await prisma.user.upsert({
    where: { email: "student@elearn.mn" },
    update: { status: "ACTIVE", role: "USER" },
    create: {
      name: "Demo Student (Standard)",
      email: "student@elearn.mn",
      passwordHash,
      role: "USER",
      status: "ACTIVE",
    },
  });

  const premiumUser = await prisma.user.upsert({
    where: { email: "premium@elearn.mn" },
    update: { status: "ACTIVE", role: "USER" },
    create: {
      name: "Demo Student (Premium)",
      email: "premium@elearn.mn",
      passwordHash,
      role: "USER",
      status: "ACTIVE",
    },
  });

  const proUser = await prisma.user.upsert({
    where: { email: "pro@elearn.mn" },
    update: { status: "ACTIVE", role: "USER" },
    create: {
      name: "Demo Student (Pro)",
      email: "pro@elearn.mn",
      passwordHash,
      role: "USER",
      status: "ACTIVE",
    },
  });

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await Promise.all([
    prisma.subscription.upsert({
      where: { userId: standardUser.id },
      update: { plan: "STANDARD", status: "ACTIVE" },
      create: {
        userId: standardUser.id,
        plan: "STANDARD",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.subscription.upsert({
      where: { userId: premiumUser.id },
      update: { plan: "PREMIUM", status: "ACTIVE" },
      create: {
        userId: premiumUser.id,
        plan: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.subscription.upsert({
      where: { userId: proUser.id },
      update: { plan: "PRO", status: "ACTIVE" },
      create: {
        userId: proUser.id,
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.user.upsert({
      where: { email: "instructor@elearn.mn" },
      update: { status: "ACTIVE", role: "COMPANY" },
      create: {
        name: "Demo Instructor",
        email: "instructor@elearn.mn",
        passwordHash: instructorHash,
        role: "COMPANY",
        status: "ACTIVE",
      },
    }),
    prisma.category.upsert({
      where: { slug: "youtube" },
      update: { name: "YouTube" },
      create: { name: "YouTube", slug: "youtube", description: "YouTube timestamp courses" },
    }),
  ]);

  await prisma.course.updateMany({
    where: { slug: { in: OLD_DEMO_SLUGS }, sourceType: null },
    data: { status: "ARCHIVED" },
  });

  await prisma.course.updateMany({
    where: { slug: OLD_YOUTUBE_DEMO_SLUG, sourceType: "YOUTUBE" },
    data: { status: "ARCHIVED" },
  });

  console.log("Seeded demo users and archived old fixed-section courses.");
  console.log("Standard: student@elearn.mn / Student@1234");
  console.log("Premium: premium@elearn.mn / Student@1234");
  console.log("Pro: pro@elearn.mn / Student@1234");
  console.log("Instructor: instructor@elearn.mn / Instructor@1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
