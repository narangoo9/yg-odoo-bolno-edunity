import NextAuth from "next-auth";
import { headers as nextHeaders } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { applyTokenToSession, applyUserToToken, authConfig, type AuthUserLike } from "@/lib/auth/config";
import { loginSchema } from "@/modules/auth/domain/schemas";

const nextAuthResult = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
            avatarUrl: true,
            organizationId: true,
          },
        });

        if (!user || !user.passwordHash) return null;
        if (user.status === "SUSPENDED") return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        await db.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
            select: { id: true },
          })
          .catch(() => null);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          image: user.avatarUrl,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      applyUserToToken(token, user as AuthUserLike | undefined);

      if (user) {
        const ext = user as AuthUserLike;

        if (!ext.role) {
          const userId = user.id ?? token.sub ?? "";
          const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { role: true, status: true, organizationId: true },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.status =
              dbUser.status === "PENDING_VERIFICATION" ? "ACTIVE" : dbUser.status;
            token.organizationId = dbUser.organizationId;

            if (dbUser.status === "PENDING_VERIFICATION") {
              await db.user.update({
                where: { id: userId },
                data: { status: "ACTIVE", emailVerified: new Date(), lastLoginAt: new Date() },
                select: { id: true },
              });
            } else {
              await db.user.update({
                where: { id: userId },
                data: { lastLoginAt: new Date() },
                select: { id: true },
              });
            }
          } else {
            token.role = "STUDENT";
            token.status = "ACTIVE";
            token.organizationId = null;
          }
        }
      }

      if (trigger === "update") {
        const userId = (token.id as string) ?? token.sub ?? "";

        if (userId) {
          const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { role: true, status: true, organizationId: true },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.organizationId = dbUser.organizationId;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      return applyTokenToSession(session, token);
    },
  },
});

async function getServerSessionFromToken(): Promise<Session | null> {
  const headers = await nextHeaders();
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    return null;
  }

  const token = await getToken({
    req: { headers },
    secret,
    secureCookie:
      headers.get("x-forwarded-proto") === "https" ||
      process.env.NEXTAUTH_URL?.startsWith("https://") ||
      process.env.AUTH_URL?.startsWith("https://"),
  });

  if (!token) {
    return null;
  }

  return {
    user: {
      id: token.id ?? token.sub ?? "",
      name: typeof token.name === "string" ? token.name : "",
      email: typeof token.email === "string" ? token.email : "",
      image: typeof token.picture === "string" ? token.picture : null,
      role: token.role,
      status: token.status,
      organizationId: token.organizationId,
    },
    expires:
      typeof token.exp === "number"
        ? new Date(token.exp * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export const { handlers, signIn, signOut } = nextAuthResult;

export const auth = ((...args: unknown[]) => {
  if (args.length === 0) {
    return getServerSessionFromToken();
  }

  return (nextAuthResult.auth as (...innerArgs: unknown[]) => unknown)(...args);
}) as typeof nextAuthResult.auth;
