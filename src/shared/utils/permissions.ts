import type { UserRole } from "@prisma/client";

export const ROLES = {
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
  ORG_ADMIN: "ORG_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 0,
  INSTRUCTOR: 1,
  ORG_ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdminOrAbove(role: UserRole): boolean {
  return hasRole(role, "ORG_ADMIN");
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageCourse(
  userRole: UserRole,
  userId: string,
  instructorId: string,
  orgId?: string | null,
  userOrgId?: string | null
): boolean {
  if (isSuperAdmin(userRole)) return true;
  // Only instructors (or above) can manage their own courses
  if (hasRole(userRole, "INSTRUCTOR") && instructorId === userId) return true;
  if (userRole === "ORG_ADMIN" && orgId && orgId === userOrgId) return true;
  return false;
}
