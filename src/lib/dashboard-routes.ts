import type { UserRole } from "@prisma/client";

export const dashboardHomeByRole: Record<UserRole, string> = {
  USER: "/student",
  COMPANY: "/org",
  SUPER_ADMIN: "/admin",
};

export function getDashboardHomeByRole(role?: string | null) {
  if (!role) {
    return "/student";
  }

  return dashboardHomeByRole[role as UserRole] ?? "/student";
}

export const settingsRouteByRole: Record<UserRole, string> = {
  USER: "/student/settings",
  COMPANY: "/org/settings",
  SUPER_ADMIN: "/admin/settings",
};

export const notificationsRouteByRole: Record<UserRole, string> = {
  USER: "/student/notifications",
  COMPANY: "/org/notifications",
  SUPER_ADMIN: "/admin/notifications",
};
