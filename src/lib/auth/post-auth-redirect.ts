import type { UserRole, UserStatus } from "@prisma/client";
import { getDashboardHomeByRole } from "@/lib/dashboard-routes";

export type PostAuthUser = {
  role: UserRole;
  status: UserStatus;
  onboardingCompleted: boolean;
  passwordHash: string | null;
};

export type PostAuthSessionUser = {
  role: UserRole;
  status: string;
  onboardingCompleted: boolean;
  profileComplete: boolean;
};

/** Нэвтэрсний дараа хэрэглэгчийг зөв хуудас руу чиглүүлнэ. */
export function getPostAuthRedirectPath(user: PostAuthUser): string {
  if (user.status === "PENDING_VERIFICATION") {
    return "/verify-email";
  }

  if (user.role !== "USER") {
    return getDashboardHomeByRole(user.role);
  }

  if (!user.onboardingCompleted) {
    return "/onboarding/welcome";
  }

  if (!user.passwordHash) {
    return "/register";
  }

  return getDashboardHomeByRole(user.role);
}

export function getPostAuthRedirectFromSession(user: PostAuthSessionUser): string {
  return getPostAuthRedirectPath({
    role: user.role,
    status: user.status as UserStatus,
    onboardingCompleted: user.onboardingCompleted,
    passwordHash: user.profileComplete ? "set" : null,
  });
}
