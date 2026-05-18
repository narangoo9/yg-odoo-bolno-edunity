import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { unauthorized, forbidden } from "@/shared/utils/api-response";

export type SessionUser = {
  id: string;
  role: UserRole;
  organizationId?: string | null;
  email?: string | null;
  name?: string | null;
};

/** Require an authenticated session for API routes. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: unauthorized() } as const;
  }
  return {
    session,
    user: session.user as SessionUser,
  } as const;
}

/** Require one of the given roles. */
export async function requireRoles(roles: UserRole[]) {
  const result = await requireSession();
  if ("error" in result) return result;
  if (!roles.includes(result.user.role as UserRole)) {
    return { error: forbidden("Эрх хүрэлцэхгүй") } as const;
  }
  return result;
}
