import type { UserRole } from "@prisma/client";
import type { NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export type AuthUserLike = Pick<User, "id"> & {
  role?: UserRole;
  status?: string;
  organizationId?: string | null;
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

  return token;
}

export function applyTokenToSession(session: Session, token: JWT) {
  session.user.id = (token.id as string) ?? token.sub ?? "";
  session.user.role = token.role as UserRole;
  session.user.status = (token.status as string) ?? "ACTIVE";
  session.user.organizationId = (token.organizationId as string | null) ?? null;

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
