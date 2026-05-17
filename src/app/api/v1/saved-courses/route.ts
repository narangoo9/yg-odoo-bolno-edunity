import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  // Public-tolerant endpoint: anonymous callers get an empty list; authenticated callers see only their own saved courses.
  const session = await auth();
  if (!session?.user) return NextResponse.json({ courses: [] });

  const saved = await db.savedCourse.findMany({
    where: { userId: session.user.id },
    orderBy: { savedAt: "desc" },
    take: 20,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          instructor: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ courses: saved.map((s) => s.course) });
}
