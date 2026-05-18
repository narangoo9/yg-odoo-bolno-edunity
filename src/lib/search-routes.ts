import type { UserRole } from "@prisma/client";

/** Full search results page for role (Enter without picking a suggestion). */
export function searchResultsPath(role: UserRole, query: string): string {
  const q = encodeURIComponent(query.trim());
  if (role === "USER") return `/student/catalog?search=${q}`;
  if (role === "COMPANY") return `/org/courses?search=${q}`;
  if (role === "SUPER_ADMIN") return `/admin/courses?search=${q}`;
  return `/student/catalog?search=${q}`;
}
