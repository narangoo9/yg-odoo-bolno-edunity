import type { UserRole } from "@prisma/client";

export const dashboardHomeByRole: Record<UserRole, string> = {
  STUDENT: "/student",
  INSTRUCTOR: "/instructor",
  ORG_ADMIN: "/org",
  SUPER_ADMIN: "/admin",
};

export function getDashboardHomeByRole(role?: string | null) {
  if (!role) {
    return "/student";
  }

  return dashboardHomeByRole[role as UserRole] ?? "/student";
}

export const settingsRouteByRole: Record<UserRole, string> = {
  STUDENT: "/student/settings",
  INSTRUCTOR: "/instructor/settings",
  ORG_ADMIN: "/org/settings",
  SUPER_ADMIN: "/admin/settings",
};

export const notificationsRouteByRole: Record<UserRole, string> = {
  STUDENT: "/student/notifications",
  INSTRUCTOR: "/instructor/notifications",
  ORG_ADMIN: "/org/notifications",
  SUPER_ADMIN: "/admin/notifications",
};
