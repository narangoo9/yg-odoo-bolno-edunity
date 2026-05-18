import type { UserRole } from "@prisma/client";
import type { NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export type AuthUserLike = Pick<User, "id"> & {
  role?: UserRole;
  status?: string;
  organizationId?: string | null;
  name?: string | null;
  image?: string | null;
};

export function applyUserToToken(token: JWT, user?: AuthUserLike | null) {
  if (!user) {
    return token;
  }

  token.id = user.id ?? token.sub ?? "";

  if (user.role) {
    token.role = user.role;
    token.status = user.status ?? "ACTIVE";
    token.organizationId = user.organizationId ?? null;
  }

  if (typeof user.name === "string") {
    token.name = user.name;
  }
  if ("image" in user) {
    token.picture = user.image;
  }

  return token;
}

export function applyTokenToSession(session: Session, token: JWT) {
  session.user.id = (token.id as string) ?? token.sub ?? "";
  session.user.role = (token.role as UserRole | undefined) ?? "USER";
  session.user.status = (token.status as string) ?? "ACTIVE";
  session.user.organizationId = (token.organizationId as string | null) ?? null;
  if (typeof token.name === "string") {
    session.user.name = token.name;
  }
  if ("picture" in token) {
    session.user.image = typeof token.picture === "string" ? token.picture : null;
  }
  session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
  session.user.profileComplete = Boolean(token.profileComplete);
  session.user.orgApproved = token.orgApproved !== undefined ? Boolean(token.orgApproved) : true;

  return session;
}

export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      return applyUserToToken(token, user as AuthUserLike | undefined);
    },
    async session({ session, token }) {
      return applyTokenToSession(session, token);
    },
  },
} satisfies NextAuthConfig;
