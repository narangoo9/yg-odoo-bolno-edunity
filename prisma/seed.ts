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

  await Promise.all([
    prisma.user.upsert({
      where: { email: "student@elearn.mn" },
      update: { status: "ACTIVE", role: "USER" },
      create: {
        name: "Demo Student",
        email: "student@elearn.mn",
        passwordHash,
        role: "USER",
        status: "ACTIVE",
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
  console.log("Student login: student@elearn.mn / Student@1234");
  console.log("Instructor login: instructor@elearn.mn / Instructor@1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
