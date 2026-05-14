import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  {
    name: "CodeNest Academy",
    slug: "codenest-academy",
    email: "owner@codenest.edunity.local",
    description: "Fullstack IT, AI, web development, backend, DevOps, and modern developer tooling.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=CodeNest%20Academy",
    website: "https://edunity.local/companies/codenest-academy",
    settings: {
      status: "approved",
      category: "Fullstack IT",
      coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      rating: 4.9,
    },
    match: (slug) =>
      slug.includes("nodejs") ||
      slug.includes("react") ||
      slug.includes("nextjs") ||
      slug.includes("typescript") ||
      slug.includes("vuejs") ||
      slug.includes("angular") ||
      slug.includes("tailwind") ||
      slug.includes("docker") ||
      slug.includes("cursor") ||
      slug.includes("git-github"),
  },
  {
    name: "LinguaSpace",
    slug: "linguaspace",
    email: "owner@linguaspace.edunity.local",
    description: "Language and communication learning company for English, Korean, Chinese, and career communication.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=LinguaSpace",
    website: "https://edunity.local/companies/linguaspace",
    settings: {
      status: "approved",
      category: "Language learning",
      coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
      rating: 4.7,
    },
    match: () => false,
  },
  {
    name: "BusinessLab",
    slug: "businesslab",
    email: "owner@businesslab.edunity.local",
    description: "Marketing, finance, operations, management, and startup skills for growing teams.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=BusinessLab",
    website: "https://edunity.local/companies/businesslab",
    settings: {
      status: "approved",
      category: "Business",
      coverUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
      rating: 4.8,
    },
    match: () => false,
  },
  {
    name: "DesignForge",
    slug: "designforge",
    email: "owner@designforge.edunity.local",
    description: "UI/UX, product design, brand systems, and visual communication courses.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=DesignForge",
    website: "https://edunity.local/companies/designforge",
    settings: {
      status: "approved",
      category: "Design",
      coverUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
      rating: 4.8,
    },
    match: (slug) => slug.includes("html-css"),
  },
  {
    name: "MindUp",
    slug: "mindup",
    email: "owner@mindup.edunity.local",
    description: "Personal development, productivity, career growth, and learning discipline.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=MindUp",
    website: "https://edunity.local/companies/mindup",
    settings: {
      status: "approved",
      category: "Personal development",
      coverUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      rating: 4.6,
    },
    match: () => false,
  },
  {
    name: "GlowUp Studio",
    slug: "glowup-studio",
    email: "owner@glowup.edunity.local",
    description: "Beauty, makeup, personal branding, and creator confidence programs.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=GlowUp%20Studio",
    website: "https://edunity.local/companies/glowup-studio",
    settings: {
      status: "approved",
      category: "Beauty and branding",
      coverUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      rating: 4.7,
    },
    match: () => false,
  },
];

async function main() {
  const organizations = new Map();

  for (const company of companies) {
    const owner = await prisma.user.upsert({
      where: { email: company.email },
      update: {
        name: company.name,
        role: "ORG_ADMIN",
        status: "ACTIVE",
        avatarUrl: company.logoUrl,
      },
      create: {
        name: company.name,
        email: company.email,
        role: "ORG_ADMIN",
        status: "ACTIVE",
        avatarUrl: company.logoUrl,
      },
    });

    const organization = await prisma.organization.upsert({
      where: { slug: company.slug },
      update: {
        name: company.name,
        description: company.description,
        logoUrl: company.logoUrl,
        website: company.website,
        ownerId: owner.id,
        isActive: true,
        settings: company.settings,
        commissionRate: 30,
      },
      create: {
        name: company.name,
        slug: company.slug,
        description: company.description,
        logoUrl: company.logoUrl,
        website: company.website,
        ownerId: owner.id,
        isActive: true,
        settings: company.settings,
        commissionRate: 30,
      },
    });

    organizations.set(company.slug, organization);
  }

  const courses = await prisma.course.findMany({
    where: { slug: { startsWith: "youtube-" } },
    select: { id: true, slug: true },
  });

  for (const course of courses) {
    const company = companies.find((candidate) => candidate.match(course.slug)) ?? companies[0];
    const organization = organizations.get(company.slug);
    await prisma.course.update({
      where: { id: course.id },
      data: { organizationId: organization.id },
    });
  }

  const summary = await prisma.organization.findMany({
    select: { name: true, slug: true, _count: { select: { courses: true } } },
    orderBy: { name: "asc" },
  });

  console.table(summary.map((org) => ({ company: org.name, slug: org.slug, courses: org._count.courses })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

