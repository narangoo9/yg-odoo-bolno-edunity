import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAdminOverview,
  getRevenueByMonth,
  getEnrollmentsByMonth,
  getTopCourses,
  getUserGrowthByMonth,
} from "@/modules/analytics/infrastructure/queries";
import { ok, unauthorized, forbidden, serverError } from "@/shared/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();
    if (session.user.role !== "SUPER_ADMIN") return forbidden();

    const [overview, revenue, enrollments, topCourses, userGrowth] = await Promise.all([
      getAdminOverview(),
      getRevenueByMonth(6),
      getEnrollmentsByMonth(6),
      getTopCourses(5),
      getUserGrowthByMonth(6),
    ]);

    return ok({ overview, revenue, enrollments, topCourses, userGrowth });
  } catch {
    return serverError();
  }
}
