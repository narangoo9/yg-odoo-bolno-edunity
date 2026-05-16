import { unstable_cache } from "next/cache";
import {
  getAdminOverview,
  getEnrollmentsByMonth,
  getRevenueByMonth,
  getTopCourses,
  getUserGrowthByMonth,
} from "@/modules/analytics/infrastructure/queries";

const ADMIN_ANALYTICS_TAG = "admin-analytics";

export function getCachedAdminOverview() {
  return unstable_cache(() => getAdminOverview(), ["admin-overview"], {
    revalidate: 60,
    tags: [ADMIN_ANALYTICS_TAG],
  })();
}

export function getCachedRevenueByMonth(months: number) {
  return unstable_cache(() => getRevenueByMonth(months), [`admin-revenue-${months}`], {
    revalidate: 60,
    tags: [ADMIN_ANALYTICS_TAG],
  })();
}

export function getCachedEnrollmentsByMonth(months: number) {
  return unstable_cache(() => getEnrollmentsByMonth(months), [`admin-enrollments-${months}`], {
    revalidate: 60,
    tags: [ADMIN_ANALYTICS_TAG],
  })();
}

export function getCachedTopCourses(limit: number) {
  return unstable_cache(() => getTopCourses(limit), [`admin-top-courses-${limit}`], {
    revalidate: 60,
    tags: [ADMIN_ANALYTICS_TAG],
  })();
}

export function getCachedUserGrowthByMonth(months: number) {
  return unstable_cache(() => getUserGrowthByMonth(months), [`admin-user-growth-${months}`], {
    revalidate: 60,
    tags: [ADMIN_ANALYTICS_TAG],
  })();
}
