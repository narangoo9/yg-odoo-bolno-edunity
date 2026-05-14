import { db } from "@/lib/db";

type CompanySettings = {
  category?: string;
  coverUrl?: string;
  status?: "pending" | "approved" | "rejected" | "suspended";
  rating?: number;
};

export function readCompanySettings(settings: unknown): CompanySettings {
  if (!settings || typeof settings !== "object") return {};
  return settings as CompanySettings;
}

export async function getApprovedCompanies(search?: string, category?: string) {
  const organizations = await db.organization.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      courses: {
        where: { status: "PUBLISHED" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true, sections: true, modules: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { courses: true, orgMembers: true } },
    },
  });

  return organizations
    .map((company) => {
      const settings = readCompanySettings(company.settings);
      const companyCategory = settings.category ?? company.courses[0]?.category?.name ?? "Learning company";
      const studentCount = company.courses.reduce((sum, course) => sum + course._count.enrollments, 0);
      return {
        ...company,
        marketplace: {
          category: companyCategory,
          coverUrl: settings.coverUrl,
          status: settings.status ?? "approved",
          rating: settings.rating ?? 4.8,
          studentCount,
          courseCount: company.courses.length,
          hasFreePreview: company.courses.some((course) => course.sourceType === "YOUTUBE" ? course._count.sections > 0 : true),
        },
      };
    })
    .filter((company) => company.marketplace.status === "approved")
    .filter((company) => company.marketplace.courseCount > 0)
    .filter((company) => !category || company.marketplace.category === category);
}

export async function getCompanyBySlug(slug: string) {
  const company = await db.organization.findUnique({
    where: { slug },
    include: {
      courses: {
        where: { status: "PUBLISHED" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true, sections: true, modules: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { orgMembers: true, courses: true } },
    },
  });

  if (!company) return null;
  const settings = readCompanySettings(company.settings);
  const studentCount = company.courses.reduce((sum, course) => sum + course._count.enrollments, 0);

  return {
    ...company,
    marketplace: {
      category: settings.category ?? company.courses[0]?.category?.name ?? "Learning company",
      coverUrl: settings.coverUrl,
      status: settings.status ?? "approved",
      rating: settings.rating ?? 4.8,
      studentCount,
      courseCount: company.courses.length,
      hasFreePreview: company.courses.some((course) => course.sourceType === "YOUTUBE" ? course._count.sections > 0 : true),
    },
  };
}
