import NextAuth from "next-auth";
import { headers as nextHeaders } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { Session } from "next-auth";
import type { Provider } from "next-auth/providers";
import { getToken } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { applyTokenToSession, applyUserToToken, authConfig, type AuthUserLike } from "@/lib/auth/config";
import { loginSchema } from "@/modules/auth/domain/schemas";

const authSecret = env.authSecret;
const googleClientId = env.googleClientId;
const googleClientSecret = env.googleClientSecret;
const googleEnabled = Boolean(googleClientId && googleClientSecret);

// Loud server-side diagnostic so missing/empty env vars are obvious in the dev log.
if (!authSecret) {
  console.error(
    "[auth] AUTH_SECRET / NEXTAUTH_SECRET is missing. NextAuth will return Configuration errors.",
  );
}
if (!googleEnabled) {
  console.warn(
    "[auth] Google provider disabled — GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET is empty.",
    {
      hasClientId: Boolean(googleClientId),
      hasClientSecret: Boolean(googleClientSecret),
      nodeEnv: env.nodeEnv,
    },
  );
}

export const authDiagnostics = {
  hasAuthSecret: Boolean(authSecret),
  googleEnabled,
  hasGoogleClientId: Boolean(googleClientId),
  hasGoogleClientSecret: Boolean(googleClientSecret),
  nextAuthUrl: env.nextAuthUrl,
  nodeEnv: env.nodeEnv,
};

const providers: Provider[] = [];

function isGoogleEmailVerified(profile: unknown) {
  if (!profile || typeof profile !== "object") return false;
  const value = (profile as Record<string, unknown>).email_verified;
  return value === true || value === "true";
}

if (googleEnabled) {
  providers.push(
    Google({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    }),
  );
}

providers.push(
  Credentials({
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const email = parsed.data.email.trim().toLowerCase();
      const { password } = parsed.data;

      const user = await db.user.findFirst({
        where: { email },
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
  })
);

const nextAuthResult = NextAuth({
  ...authConfig,
  secret: authSecret,
  adapter: PrismaAdapter(db) as Adapter,
  providers,
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const token = crypto.randomUUID();
      const appUrl = env.appUrl || env.nextAuthUrl || "http://localhost:3000";

      try {
        await db.verificationToken.create({
          data: {
            token,
            type: "email_verify",
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const { sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: user.email,
          subject: "EduNity имэйл баталгаажуулалт",
          template: "verify-email",
          data: {
            name: user.name ?? "EduNity хэрэглэгч",
            verifyUrl: `${appUrl}/verify-email?token=${token}`,
          },
        }).catch(() => null);
      } catch (error) {
        console.error("[auth] createUser verification email failed:", error);
      }
    },
    // Fires once per (user, provider) on first OAuth link. New Google users are
    // created with the DB default status PENDING_VERIFICATION — but Google has
    // already verified the email, so we activate them immediately.
    async linkAccount({ user, account }) {
      if (account.provider !== "google" || !user.id) return;
      const verifiedAt =
        (user as { emailVerified?: Date | string | null }).emailVerified ?? null;
      try {
        await db.user.update({
          where: { id: user.id },
          data: {
            emailVerified: verifiedAt ? new Date(verifiedAt) : null,
          },
        });
      } catch (error) {
        console.error("[auth] linkAccount activation failed:", error);
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user?.email) return true;
      if (!isGoogleEmailVerified(profile)) return false;

      const existing = await db.user.findFirst({
        where: { email: user.email.trim().toLowerCase() },
        select: { id: true, status: true },
      });
      if (existing?.status === "SUSPENDED") return false;
      // Google has verified the email — activate any pending user
      if (existing?.id && existing.status === "PENDING_VERIFICATION") {
        await db.user.update({
          where: { id: existing.id },
          data: { status: "PENDING_VERIFICATION", emailVerified: null },
          select: { id: true },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session: updateSession }) {
      applyUserToToken(token, user as AuthUserLike | undefined);

      const userId =
        (user?.id as string | undefined) ??
        (token.id as string | undefined) ??
        token.sub ??
        "";

      const loadProfileFromDb = async () => {
        if (!userId) return;
        const dbUser = await db.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            status: true,
            organizationId: true,
            avatarUrl: true,
            name: true,
          },
        });
        if (!dbUser) {
          if (user && !(user as AuthUserLike).role) {
            token.role = "STUDENT";
            token.status = "ACTIVE";
            token.organizationId = null;
          }
          return;
        }
        token.role = dbUser.role;
        token.status = dbUser.status;
        token.organizationId = dbUser.organizationId;
        token.name = dbUser.name;
        token.picture = dbUser.avatarUrl;
      };

      if (user && userId) {
        await loadProfileFromDb();
        await db.user
          .update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
            select: { id: true },
          })
          .catch(() => null);
      } else if (trigger === "update") {
        if (updateSession?.user) {
          if (typeof updateSession.user.name === "string") {
            token.name = updateSession.user.name;
          }
          if ("image" in updateSession.user) {
            token.picture = updateSession.user.image;
          }
        }
        await loadProfileFromDb();
      } else if (userId && !("picture" in token)) {
        // Хуучин JWT (logout/login өмнөх session) — avatar token-д байхгүй
        await loadProfileFromDb();
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
  const secret = authSecret;

  if (!secret) {
    return null;
  }

  const token = await getToken({
    req: { headers },
    secret,
    secureCookie:
      headers.get("x-forwarded-proto") === "https" ||
      env.nextAuthUrl.startsWith("https://") ||
      env.appUrl.startsWith("https://"),
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
