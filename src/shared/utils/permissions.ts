import type { UserRole } from "@prisma/client";

export const ROLES = {
  USER: "USER",
  COMPANY: "COMPANY",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  COMPANY: 1,
  SUPER_ADMIN: 3,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdminOrAbove(role: UserRole): boolean {
  return hasRole(role, "COMPANY");
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
  // Company users can manage their own courses or courses inside their organization.
  if (hasRole(userRole, "COMPANY") && instructorId === userId) return true;
  if (userRole === "COMPANY" && orgId && orgId === userOrgId) return true;
  return false;
}
