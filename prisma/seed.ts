import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Бат", "Энх", "Дорж", "Болд", "Ганбат", "Туяа", "Оюун", "Сарнай",
  "Мөнх", "Анх", "Наран", "Үүлэн", "Долгор", "Пүрэв", "Соёлмаа", "Хулан",
];

const LAST_NAMES = [
  "Батбаяр", "Эрдэнэ", "Болд", "Лхагва", "Сухбат", "Цэрэн", "Хандсүрэн",
  "Өлзийхутаг", "Баяр", "Баатар", "Гэрэлт", "Түвшин", "Оргил", "Гантулга",
];

const COURSE_DATA = [
  {
    title: "Python программчлалын хэл — Эхлэгчдэд",
    slug: "python-beginners",
    desc: "Python-ийг эхнээс нь заах курс. Syntax, data types, control flow, functions, OOP бүх үндсэн ойлголт.",
    level: "BEGINNER", category: "programming", price: 29000,
    tags: ["python", "programming", "beginner"],
    outcomes: ["Python syntax тойм", "OOP ойлголт", "Data structures", "Жижиг төсөл"],
  },
  {
    title: "React.js — Орчин үеийн вэб хөгжүүлэлт",
    slug: "react-modern",
    desc: "React 19, Hooks, Context API, performance optimization, testing бүх орчин үеийн хэрэгсэл.",
    level: "INTERMEDIATE", category: "programming", price: 59000,
    tags: ["react", "javascript", "web"],
    outcomes: ["Component architecture", "State management", "Hooks гүнзгий", "Production app"],
  },
  {
    title: "UI/UX Дизайнтай танилцах",
    slug: "ui-ux-intro",
    desc: "Figma ашиглан хэрэглэгчийн туршлага, интерфейсийн дизайныг суралцъя.",
    level: "BEGINNER", category: "design", price: 39000,
    tags: ["figma", "design", "ux"],
    outcomes: ["Figma эзэмших", "User research", "Wireframing", "Design system"],
  },
  {
    title: "Digital Marketing бүрэн заавар",
    slug: "digital-marketing",
    desc: "SEO, SMM, Email marketing, Google Ads, Analytics нэг курсэд.",
    level: "ALL_LEVELS", category: "business", price: 49000,
    tags: ["marketing", "seo", "smm"],
    outcomes: ["SEO стратеги", "Facebook Ads", "Email funnel", "Analytics"],
  },
  {
    title: "Data Science with Python",
    slug: "data-science-python",
    desc: "NumPy, Pandas, Matplotlib, Scikit-learn ашиглан анализ, ML model бүтээх.",
    level: "ADVANCED", category: "data-science", price: 79000,
    tags: ["python", "ml", "data"],
    outcomes: ["Pandas эзэмшил", "ML моделлинг", "Data viz", "Real project"],
  },
  {
    title: "SQL ба Database дизайн",
    slug: "sql-database",
    desc: "Relational DB үндэс, SQL query, normalization, indexing, performance tuning.",
    level: "INTERMEDIATE", category: "programming", price: 35000,
    tags: ["sql", "database", "postgresql"],
    outcomes: ["Complex query", "DB design", "Index optimization", "Transaction"],
  },
  {
    title: "Бизнесийн үндэс — Стартап эхлүүлэх",
    slug: "startup-basics",
    desc: "Бизнес санаанаас MVP хүртэл, Lean Canvas, validation, fundraising.",
    level: "BEGINNER", category: "business", price: 45000,
    tags: ["startup", "business", "mvp"],
    outcomes: ["Идэя шалгах", "Lean Canvas", "MVP launch", "Customer discovery"],
  },
  {
    title: "Next.js 15 иж бүрэн сургалт",
    slug: "nextjs-15",
    desc: "App Router, Server Components, Server Actions, Prisma ашиглан fullstack app.",
    level: "INTERMEDIATE", category: "programming", price: 65000,
    tags: ["nextjs", "react", "typescript"],
    outcomes: ["App Router", "Server Actions", "Database", "Deploy"],
  },
];

const COURSE_COVERS: Record<string, string> = {
  "python-beginners": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
  "react-modern": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
  "ui-ux-intro": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
  "digital-marketing": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  "data-science-python": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  "sql-database": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
  "startup-basics": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80",
  "nextjs-15": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
};

const INSTRUCTOR_AVATARS = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/46.jpg",
];

const STUDENT_AVATARS = [
  "https://randomuser.me/api/portraits/women/65.jpg",
  "https://randomuser.me/api/portraits/men/67.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/71.jpg",
  "https://randomuser.me/api/portraits/women/72.jpg",
];

type SeedStudent = {
  id: string;
};

type SeedCourse = {
  id: string;
  slug: string;
  title: string;
  organizationId: string | null;
  price: Prisma.Decimal;
};

async function main() {
  console.log("🌱 Seed эхэлж байна...\n");

  const categories = await Promise.all([
    { name: "Программчлал", slug: "programming" },
    { name: "Дизайн", slug: "design" },
    { name: "Бизнес", slug: "business" },
    { name: "Дата шинжлэл", slug: "data-science" },
    { name: "Маркетинг", slug: "marketing" },
    { name: "Гадаад хэл", slug: "language" },
  ].map((cat) => prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat })));

  console.log(`✅ ${categories.length} категори`);

  const adminPw = await bcrypt.hash("Admin@1234", 12);
  const userPw = await bcrypt.hash("Student@1234", 12);

  await prisma.user.upsert({
    where: { email: "admin@elearn.mn" },
    update: {},
    create: {
      name: "Систем Админ", email: "admin@elearn.mn", passwordHash: adminPw,
      role: "SUPER_ADMIN", status: "ACTIVE", emailVerified: new Date(),
    },
  });

  const orgOwner = await prisma.user.upsert({
    where: { email: "ceo@techacademy.mn" },
    update: {},
    create: {
      name: "Энхбат Баяр", email: "ceo@techacademy.mn", passwordHash: userPw,
      role: "ORG_ADMIN", status: "ACTIVE", emailVerified: new Date(),
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "tech-academy" },
    update: {},
    create: {
      name: "Tech Academy Mongolia", slug: "tech-academy",
      description: "Технологийн боловсролын тэргүүлэгч академи",
      ownerId: orgOwner.id, plan: "ORGANIZATION", isActive: true,
    },
  });

  await prisma.user.update({ where: { id: orgOwner.id }, data: { organizationId: org.id } });

  // Org owner as OWNER member
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: orgOwner.id } },
    update: {},
    create: { organizationId: org.id, userId: orgOwner.id, role: "OWNER", status: "ACTIVE" },
  });

  // Second org for multi-tenant isolation testing
  const org2Owner = await prisma.user.upsert({
    where: { email: "ceo@designstudio.mn" },
    update: {},
    create: {
      name: "Сарнай Дизайн", email: "ceo@designstudio.mn", passwordHash: userPw,
      role: "ORG_ADMIN", status: "ACTIVE", emailVerified: new Date(),
    },
  });
  const org2 = await prisma.organization.upsert({
    where: { slug: "design-studio" },
    update: {},
    create: {
      name: "Design Studio MN", slug: "design-studio",
      description: "Дизайны мэргэжлийн сургалтын төв",
      ownerId: org2Owner.id, plan: "STANDARD", isActive: true,
    },
  });
  await prisma.user.update({ where: { id: org2Owner.id }, data: { organizationId: org2.id } });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org2.id, userId: org2Owner.id } },
    update: {},
    create: { organizationId: org2.id, userId: org2Owner.id, role: "OWNER", status: "ACTIVE" },
  });
  console.log(`✅ Байгууллага: ${org.name}, ${org2.name}`);

  const instructorData = [
    { email: "batbayar@elearn.mn", name: "Батбаяр Эрдэнэ", bio: "10+ жилийн туршлагатай программчлалын багш" },
    { email: "oyun@elearn.mn", name: "Оюун-Эрдэнэ Туяа", bio: "UI/UX дизайнер, олон улсын төслүүдэд оролцсон" },
    { email: "temuulen@elearn.mn", name: "Тэмүүлэн Болд", bio: "Data Scientist, MIT төгсөгч" },
  ];

  const instructors = await Promise.all(instructorData.map((i, index) =>
    prisma.user.upsert({
      where: { email: i.email },
      update: {
        name: i.name,
        bio: i.bio,
        avatarUrl: INSTRUCTOR_AVATARS[index % INSTRUCTOR_AVATARS.length],
      },
      create: {
        name: i.name, email: i.email, passwordHash: userPw,
        role: "INSTRUCTOR", status: "ACTIVE", emailVerified: new Date(),
        bio: i.bio, organizationId: org.id,
        avatarUrl: INSTRUCTOR_AVATARS[index % INSTRUCTOR_AVATARS.length],
      },
    })
  ));

  // Create OrganizationMember records for instructors
  for (const instructor of instructors) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: instructor.id } },
      update: {},
      create: {
        organizationId: org.id,
        userId: instructor.id,
        role: "INSTRUCTOR",
        status: "ACTIVE",
        invitedBy: orgOwner.id,
      },
    });
  }
  console.log(`✅ ${instructors.length} багш (OrganizationMember бүртгэлтэй)`);

  const students: SeedStudent[] = [];
  for (let i = 0; i < 25; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
    const student = await prisma.user.upsert({
      where: { email: `student${i + 1}@elearn.mn` },
      update: { avatarUrl: STUDENT_AVATARS[i % STUDENT_AVATARS.length] },
      create: {
        name: `${last} ${first}`,
        email: `student${i + 1}@elearn.mn`,
        passwordHash: userPw,
        role: "STUDENT", status: "ACTIVE", emailVerified: new Date(),
        avatarUrl: STUDENT_AVATARS[i % STUDENT_AVATARS.length],
      },
    });
    students.push(student);
  }

  const demoStudent = await prisma.user.upsert({
    where: { email: "student@elearn.mn" },
    update: { name: "Энхбаяр Оюутан", avatarUrl: STUDENT_AVATARS[0] },
    create: {
      name: "Энхбаяр Оюутан", email: "student@elearn.mn", passwordHash: userPw,
      role: "STUDENT", status: "ACTIVE", emailVerified: new Date(),
      avatarUrl: STUDENT_AVATARS[0],
    },
  });
  students.push(demoStudent);
  console.log(`✅ ${students.length} оюутан`);

  const courses: SeedCourse[] = [];
  for (let i = 0; i < COURSE_DATA.length; i++) {
    const cd = COURSE_DATA[i];
    const category = categories.find((c) => c.slug === cd.category);
    const instructor = instructors[i % instructors.length];

    const course = await prisma.course.upsert({
      where: { slug: cd.slug },
      update: {
        title: cd.title,
        description: cd.desc,
        shortDescription: cd.desc.slice(0, 140) + "…",
        level: cd.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS",
        price: cd.price,
        tags: cd.tags,
        learningOutcomes: cd.outcomes,
        thumbnailUrl: COURSE_COVERS[cd.slug],
        isFeatured: i < 3,
      },
      create: {
        instructorId: instructor.id,
        organizationId: org.id,
        categoryId: category?.id,
        title: cd.title, slug: cd.slug,
        description: cd.desc,
        shortDescription: cd.desc.slice(0, 140) + "…",
        level: cd.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS",
        language: "mn", price: cd.price, currency: "MNT",
        status: "PUBLISHED",
        thumbnailUrl: COURSE_COVERS[cd.slug],
        publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 3600 * 1000),
        tags: cd.tags, learningOutcomes: cd.outcomes,
        prerequisites: ["Компьютерын суурь мэдлэг"],
        isFeatured: i < 3,
      },
    });

    for (let m = 0; m < 3; m++) {
      const mod = await prisma.courseModule.upsert({
        where: { id: `${course.id}-mod-${m}` },
        update: {},
        create: {
          id: `${course.id}-mod-${m}`,
          courseId: course.id,
          title: `${m + 1}-р хэсэг: ${["Танилцуулга", "Үндсэн ойлголт", "Дадлага төсөл"][m]}`,
          orderIndex: m,
        },
      });

      const lessonCount = 3 + m;
      for (let l = 0; l < lessonCount; l++) {
        await prisma.lesson.upsert({
          where: { id: `${mod.id}-lesson-${l}` },
          update: {},
          create: {
            id: `${mod.id}-lesson-${l}`,
            moduleId: mod.id,
            title: `Хичээл ${m + 1}.${l + 1}: ${["Танилцуулга", "Үндсэн концепц", "Жишээ", "Дадлага", "Дүгнэлт"][l]}`,
            type: l === lessonCount - 1 && m === 2 ? "QUIZ" : "VIDEO",
            duration: 300 + Math.floor(Math.random() * 1200),
            orderIndex: l,
            isFree: m === 0 && l === 0,
          },
        });
      }
    }

    courses.push(course);
  }
  console.log(`✅ ${courses.length} курс (модуль, хичээлтэй)`);

  let enrollmentCount = 0;
  for (const student of students) {
    const enrolledCourseIds = new Set<string>();
    const targetCount = 2 + Math.floor(Math.random() * 3);
    while (enrolledCourseIds.size < targetCount) {
      enrolledCourseIds.add(courses[Math.floor(Math.random() * courses.length)].id);
    }

    for (const courseId of enrolledCourseIds) {
      const status: "ACTIVE" | "COMPLETED" = Math.random() < 0.3 ? "COMPLETED" : "ACTIVE";
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId } },
        update: {},
        create: {
          studentId: student.id, courseId, status,
          enrolledAt: new Date(Date.now() - Math.random() * 60 * 24 * 3600 * 1000),
          completedAt: status === "COMPLETED" ? new Date() : null,
          source: "seed",
        },
      });
      enrollmentCount++;

      if (status === "COMPLETED") {
        const code = Math.random().toString(36).slice(2, 14).toUpperCase();
        const courseForCert = courses.find((c) => c.id === courseId);
        const certOrgId = courseForCert?.organizationId ?? org.id;
        // Use findFirst + create to avoid the old studentId_courseId unique key
        const existingCert = await prisma.certificate.findFirst({ where: { studentId: student.id, courseId } });
        if (!existingCert) {
          await prisma.certificate.create({
            data: {
              studentId: student.id,
              courseId,
              organizationId: certOrgId,
              certificateNo: `CERT-${Date.now()}-${code.slice(0, 6)}`,
              verificationCode: code,
            },
          });
        }
      }
    }
  }
  console.log(`✅ ${enrollmentCount} бүртгэл + сертификатууд`);

  const reviewComments = [
    "Маш сайн курс байна. Багш ойлгомжтой тайлбарладаг.",
    "Практик жишээнүүд нь үнэхээр хэрэгтэй байсан.",
    "Үнэ цэнэтэй мэдлэг олж авлаа. Санал болгож байна.",
    "Агуулга гүнзгий бөгөөд бүтэцтэй. Тун таалагдсан.",
    "Багш туршлагатай, хичээлүүд нь ойлгомжтой.",
  ];

  let reviewCount = 0;
  for (let i = 0; i < 30; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const course = courses[Math.floor(Math.random() * courses.length)];
    try {
      await prisma.review.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
        update: {},
        create: {
          studentId: student.id, courseId: course.id,
          rating: 3 + Math.floor(Math.random() * 3),
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          isApproved: true,
        },
      });
      reviewCount++;
    } catch { /* duplicate */ }
  }
  console.log(`✅ ${reviewCount} сэтгэгдэл`);

  for (let i = 0; i < 20; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const course = courses[Math.floor(Math.random() * courses.length)];
    await prisma.payment.create({
      data: {
        userId: student.id,
        amount: course.price,
        currency: "MNT",
        status: Math.random() < 0.9 ? "COMPLETED" : "FAILED",
        description: `Курс худалдан авалт: ${course.title}`,
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 3600 * 1000),
      },
    });
  }
  console.log(`✅ 20 төлбөр`);

  for (const student of students.slice(0, 10)) {
    await prisma.notification.createMany({
      data: [
        { userId: student.id, type: "ENROLLMENT_SUCCESS", title: "Курст бүртгүүллээ", body: "Таны курс бэлэн болсон." },
        { userId: student.id, type: "COURSE_REMINDER", title: "Сургалтаа үргэлжлүүлээрэй", body: "7 хоног хичээл үзээгүй байна." },
      ],
    });
  }

  // ─── PROGRAMS / TRACKS ───────────────────────────────────────────────────────
  const webDevProgram = await prisma.program.upsert({
    where: { slug: "web-developer-track" },
    update: {
      thumbnailUrl: COURSE_COVERS["nextjs-15"],
    },
    create: {
      organizationId: org.id,
      title: "Веб хөгжүүлэгч болох зам",
      slug: "web-developer-track",
      description: "Python-с эхлэн React хүртэл бүрэн веб хөгжүүлэгч болох иж бүрэн программ.",
      status: "PUBLISHED",
      thumbnailUrl: COURSE_COVERS["nextjs-15"],
      publishedAt: new Date(),
      isOrdered: true,
      certificateTitle: "Бүрэн Стэк Веб Хөгжүүлэгч",
      certificateDescription: "Энэхүү сертификат нь веб хөгжүүлэлтийн иж бүрэн программыг амжилттай дуусгасан болохыг гэрчилнэ.",
    },
  });

  const dataProgram = await prisma.program.upsert({
    where: { slug: "data-science-track" },
    update: {
      thumbnailUrl: COURSE_COVERS["data-science-python"],
    },
    create: {
      organizationId: org.id,
      title: "Дата шинжээч болох зам",
      slug: "data-science-track",
      description: "SQL, Python, Data Science ашиглан дата шинжээч болох бүрэн программ.",
      status: "PUBLISHED",
      thumbnailUrl: COURSE_COVERS["data-science-python"],
      publishedAt: new Date(),
      isOrdered: false,
      certificateTitle: "Мэргэшсэн Дата Шинжээч",
      certificateDescription: "Энэхүү сертификат нь дата шинжлэлийн программыг амжилттай дуусгасан болохыг гэрчилнэ.",
    },
  });

  // Add courses to programs
  const webCourseIds = courses
    .filter((c) => ["python-beginners", "react-modern"].includes(c.slug))
    .map((c) => c.id);
  for (let i = 0; i < webCourseIds.length; i++) {
    await prisma.programCourse.upsert({
      where: { programId_courseId: { programId: webDevProgram.id, courseId: webCourseIds[i] } },
      update: {},
      create: { programId: webDevProgram.id, courseId: webCourseIds[i], orderIndex: i, isRequired: true },
    });
  }

  const dataCourseIds = courses
    .filter((c) => ["sql-database", "data-science-python"].includes(c.slug))
    .map((c) => c.id);
  for (let i = 0; i < dataCourseIds.length; i++) {
    await prisma.programCourse.upsert({
      where: { programId_courseId: { programId: dataProgram.id, courseId: dataCourseIds[i] } },
      update: {},
      create: { programId: dataProgram.id, courseId: dataCourseIds[i], orderIndex: i, isRequired: true },
    });
  }
  console.log("✅ 2 сургалтын программ");

  // ─── PROGRAM ENROLLMENTS ─────────────────────────────────────────────────────
  let progEnrollCount = 0;
  for (const student of students.slice(0, 8)) {
    try {
      await prisma.programEnrollment.upsert({
        where: { studentId_programId: { studentId: student.id, programId: webDevProgram.id } },
        update: {},
        create: { studentId: student.id, programId: webDevProgram.id, source: "direct" },
      });
      progEnrollCount++;
    } catch { /* skip */ }
  }
  for (const student of students.slice(4, 12)) {
    try {
      await prisma.programEnrollment.upsert({
        where: { studentId_programId: { studentId: student.id, programId: dataProgram.id } },
        update: {},
        create: { studentId: student.id, programId: dataProgram.id, source: "direct" },
      });
      progEnrollCount++;
    } catch { /* skip */ }
  }
  console.log(`✅ ${progEnrollCount} программын бүртгэл`);

  // ─── ORG PAYOUT (sample) ─────────────────────────────────────────────────────
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  await prisma.orgPayout.upsert({
    where: { id: "seed-payout-001" },
    update: {},
    create: {
      id: "seed-payout-001",
      organizationId: org.id,
      amount: 840000, // 80% of ~1.05M gross sales after 20% commission
      currency: "MNT",
      status: "PAID",
      periodStart: lastMonth,
      periodEnd: lastMonthEnd,
      paidAt: new Date(now.getFullYear(), now.getMonth(), 5),
      notes: "Сарын тооцоо - өмнөх сар",
    },
  });
  console.log("✅ 1 байгууллагын төлбөр");

  // ─── WALLET CREDITS (sample XP conversions for first 5 students) ─────────────
  let walletCount = 0;
  for (const student of students.slice(0, 5)) {
    // Give each student some XP first
    await prisma.user.update({
      where: { id: student.id },
      data: { xp: { increment: 5000 } },
    });

    // Simulate a conversion of 2000 XP → $2 credits
    const conversion = await prisma.xpConversion.create({
      data: { userId: student.id, xpAmount: 2000, creditAmount: 2 },
    });
    await prisma.walletCredit.create({
      data: {
        userId: student.id,
        amount: 2,
        balanceAfter: 2,
        source: "xp_conversion",
        description: "2000 XP → $2.00 кредит",
        xpConversionId: conversion.id,
      },
    });
    await prisma.user.update({
      where: { id: student.id },
      data: {
        walletBalance: 2,
        xpCreditsEarned: 2,
        xp: { decrement: 2000 },
      },
    });
    walletCount++;
  }
  console.log(`✅ ${walletCount} хэтэвч кредит`);

  // ─── XP LOGS + LEADERBOARD ───────────────────────────────────────────────────
  const xpActions = ["LESSON_COMPLETE", "QUIZ_PASS", "COURSE_COMPLETE", "STREAK_BONUS"] as const;
  for (const student of students.slice(0, 15)) {
    const xpGain = 500 + Math.floor(Math.random() * 4500);
    await prisma.user.update({ where: { id: student.id }, data: { xp: { increment: xpGain }, level: Math.max(1, Math.floor(xpGain / 1000)) } });
    await prisma.xpLog.createMany({
      data: xpActions.map((action) => ({
        userId: student.id,
        action,
        amount: action === "COURSE_COMPLETE" ? 500 : action === "QUIZ_PASS" ? 100 : 50,
        entityId: courses[0].id,
      })),
      skipDuplicates: true,
    });
    await prisma.leaderboardEntry.upsert({
      where: { userId: student.id },
      update: { weeklyXp: xpGain, totalXp: xpGain },
      create: { userId: student.id, weeklyXp: xpGain, monthlyXp: xpGain, totalXp: xpGain, rank: 0 },
    });
  }
  // Rank leaderboard
  const entries = await prisma.leaderboardEntry.findMany({ orderBy: { totalXp: "desc" } });
  for (let i = 0; i < entries.length; i++) {
    await prisma.leaderboardEntry.update({ where: { id: entries[i].id }, data: { rank: i + 1 } });
  }
  console.log("✅ XP лог + леадербоард");

  // ─── GAMIFICATION: BADGES ────────────────────────────────────────────────────
  const badgeTypes = ["FIRST_LESSON", "FIRST_COURSE", "STREAK_7"] as const;
  for (const student of students.slice(0, 8)) {
    for (const badge of badgeTypes) {
      try {
        await prisma.userBadge.create({ data: { userId: student.id, badge } });
      } catch { /* skip duplicates */ }
    }
  }
  console.log("✅ Гамификацийн badge");

  // ─── DAILY CHALLENGE ─────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  await prisma.dailyChallenge.upsert({
    where: { date: today },
    update: {},
    create: {
      question: "HTTP болон HTTPS хоёрын ялгаа юу вэ?",
      options: ["Хурд", "Аюулгүй байдал", "Хаяг", "Дэлгэц"],
      correctIdx: 1,
      xpReward: 50,
      date: today,
    },
  });
  console.log("✅ Өнөөдрийн өдрийн даалгавар");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Seed амжилттай дууссан!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 Нэвтрэх мэдээлэл:");
  console.log("   Admin:       admin@elearn.mn       / Admin@1234");
  console.log("   Org Admin:   ceo@techacademy.mn    / Student@1234");
  console.log("   Org Admin 2: ceo@designstudio.mn   / Student@1234");
  console.log("   Instructor:  batbayar@elearn.mn    / Student@1234");
  console.log("   Student:     student@elearn.mn     / Student@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📌 Шинэ нэмэлт:");
  console.log("   /onboard-org            - Байгууллага бүртгүүлэх");
  console.log("   /org/programs           - Программ удирдах (ORG_ADMIN)");
  console.log("   /student/wallet         - Хэтэвч (кредит + XP хөрвүүлэх)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
