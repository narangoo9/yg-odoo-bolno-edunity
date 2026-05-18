import { type NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCourses } from "@/modules/courses/infrastructure/queries";
import { ok, unauthorized, serverError } from "@/shared/utils/api-response";

export type SearchResultItem = {
  id: string;
  type: "course" | "user";
  title: string;
  subtitle: string | null;
  href: string;
  image: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return ok({ results: [] as SearchResultItem[], query: q });
    }

    const role = session.user.role as UserRole;
    const results: SearchResultItem[] = [];

    if (role === "USER") {
      const listing = await getCourses({
        search: q,
        limit: 8,
        sortBy: "popular",
        status: "PUBLISHED",
      });
      for (const course of listing.courses) {
        results.push({
          id: course.id,
          type: "course",
          title: course.title,
          subtitle: course.instructor?.name ?? null,
          href: `/courses/${course.slug}`,
          image: course.thumbnailUrl,
        });
      }
    } else if (role === "COMPANY") {
      const orgId = session.user.organizationId;
      if (orgId) {
        const courses = await db.course.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            instructor: { select: { name: true } },
          },
        });
        for (const course of courses) {
          results.push({
            id: course.id,
            type: "course",
            title: course.title,
            subtitle: course.instructor?.name ?? null,
            href: `/instructor/courses/${course.id}`,
            image: course.thumbnailUrl,
          });
        }
      }
    } else if (role === "SUPER_ADMIN") {
      const [courses, users] = await Promise.all([
        db.course.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { instructor: { name: { contains: q, mode: "insensitive" } } },
            ],
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            instructor: { select: { name: true } },
          },
        }),
        db.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        }),
      ]);

      for (const course of courses) {
        results.push({
          id: course.id,
          type: "course",
          title: course.title,
          subtitle: course.instructor?.name ?? null,
          href: `/courses/${course.slug}`,
          image: course.thumbnailUrl,
        });
      }
      for (const user of users) {
        results.push({
          id: user.id,
          type: "user",
          title: user.name ?? user.email,
          subtitle: user.email,
          href: `/admin/users?search=${encodeURIComponent(user.email)}`,
          image: user.avatarUrl,
        });
      }
    }

    return ok({ results, query: q });
  } catch (err) {
    console.error("GET /api/v1/search error:", err);
    return serverError("Хайлт хийхэд алдаа гарлаа.");
  }
}
