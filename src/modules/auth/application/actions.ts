"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { RATE_LIMIT_UNAVAILABLE_MESSAGE, sensitiveRateLimit } from "@/lib/cache";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { auth, signOut } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { orgPendingSettings } from "@/lib/organization-approval";
import { notifyAdminOrgRegistration } from "@/modules/admin/application/moderation-actions";
import { awardXP, XP_REWARDS } from "@/modules/gamification/application/gamification-service";
import { XpAction } from "@prisma/client";
import {
  registerSchema,
  googleCompleteSchema,
  orgOnboardSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../domain/schemas";
import type {
  RegisterInput,
  GoogleCompleteInput,
  OrgOnboardInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../domain/schemas";

// ─── REGISTER ────────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const appUrl = getAppUrl();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Public signup creates USER accounts. Company users come via organization flows.
  const { name, email, password, referralCode } = parsed.data;

  const existingUser = await db.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });
  if (existingUser) {
    return { error: { email: ["Энэ имэйл хаяг бүртгэлтэй байна"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newReferralCode = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const referrer = referralCode
    ? await db.user.findUnique({
        where: { referralCode },
        select: { id: true, referralCode: true },
      })
    : null;

  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
        status: "PENDING_VERIFICATION",
        referralCode: newReferralCode,
        referredById: referrer?.id ?? null,
      },
    });

    if (referrer) {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: createdUser.id,
          code: referrer.referralCode ?? referralCode ?? "",
          convertedAt: new Date(),
          rewardXp: XP_REWARDS.REFERRAL_SIGNUP,
        },
      });

      await tx.friendship.upsert({
        where: {
          requesterId_addresseeId: {
            requesterId: referrer.id,
            addresseeId: createdUser.id,
          },
        },
        create: {
          requesterId: referrer.id,
          addresseeId: createdUser.id,
          status: "ACCEPTED",
        },
        update: { status: "ACCEPTED" },
      });
    }

    return createdUser;
  });

  if (referrer) {
    await awardXP(referrer.id, XpAction.REFERRAL_SIGNUP, user.id);
  }

  // Create verification token
  const token = randomUUID();
  await db.verificationToken.create({
    data: {
      token,
      type: "email_verify",
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  // Send verification email (non-blocking — registration succeeds even if email fails)
  sendEmail({
    to: email,
    subject: "Имэйл хаягаа баталгаажуулна уу",
    template: "verify-email",
    data: {
      name,
      verifyUrl: `${appUrl}/verify-email?token=${token}`,
    },
  }).catch(() => null);

  return { success: true, message: "Бүртгэл амжилттай. Имэйлээ шалгана уу." };
}

// ─── VERIFY EMAIL ────────────────────────────────────────────────────────────

export async function verifyEmail(token: string) {
  const record = await db.verificationToken.findUnique({ where: { token } });

  if (!record || record.type !== "email_verify") {
    return { error: "Буруу баталгаажуулах холбоос" };
  }
  if (record.expiresAt < new Date()) {
    return { error: "Холбоосны хугацаа дууссан байна" };
  }
  if (record.usedAt) {
    return { error: "Холбоос аль хэдийн ашиглагдсан" };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { status: "ACTIVE", emailVerified: new Date() },
    }),
    db.verificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}

// ─── GOOGLE REGISTER COMPLETE ────────────────────────────────────────────────

export async function completeGoogleRegistration(input: GoogleCompleteInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: { _form: ["Эхлээд Google-ээр нэвтэрнэ үү"] } };
  }

  const parsed = googleCompleteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
      passwordHash: true,
      onboardingCompleted: true,
    },
  });

  if (!user) {
    return { error: { _form: ["Хэрэглэгч олдсонгүй"] } };
  }
  if (user.role !== "USER") {
    return { error: { _form: ["Энэ алхам зөвхөн хувь хүний бүртгэлд зориулагдсан"] } };
  }
  if (user.status !== "ACTIVE") {
    return { error: { _form: ["Эхлээд имэйлээ баталгаажуулна уу"] } };
  }
  if (!user.onboardingCompleted) {
    return { error: { _form: ["Эхлээд onboarding-оо дуусгана уу"] } };
  }
  if (user.passwordHash) {
    return { success: true, alreadyComplete: true };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      passwordHash,
    },
    select: { id: true },
  });

  return { success: true };
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

export async function forgotPassword(input: ForgotPasswordInput) {
  const appUrl = getAppUrl();
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const email = parsed.data.email.trim().toLowerCase();
  const rl = await sensitiveRateLimit(`auth:forgot-password:${email}`, 3, 600);
  if (rl.unavailable) return { error: RATE_LIMIT_UNAVAILABLE_MESSAGE };
  if (!rl.success) return { error: "Too many password reset requests. Please try again later." };

  const user = await db.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  // Don't reveal if user exists or not
  if (!user) return { success: true };

  const token = randomUUID();
  await db.verificationToken.create({
    data: {
      token,
      type: "password_reset",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    },
  });

  await sendEmail({
    to: email,
    subject: "Нууц үг сэргээх",
    template: "reset-password",
    data: {
      name: user.name,
      resetUrl: `${appUrl}/reset-password?token=${token}`,
    },
  });

  return { success: true };
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export async function resetPassword(input: ResetPasswordInput) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const rl = await sensitiveRateLimit(
    `auth:reset-password:${parsed.data.token.slice(0, 16)}`,
    5,
    600
  );
  if (rl.unavailable) return { error: RATE_LIMIT_UNAVAILABLE_MESSAGE };
  if (!rl.success) return { error: "Too many password reset attempts. Please try again later." };

  const record = await db.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.type !== "password_reset") {
    return { error: "Буруу холбоос" };
  }
  if (record.expiresAt < new Date()) {
    return { error: "Холбоосны хугацаа дууссан байна" };
  }
  if (record.usedAt) {
    return { error: "Холбоос аль хэдийн ашиглагдсан" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    db.verificationToken.update({
      where: { token: parsed.data.token },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// ─── ORGANIZATION ONBOARDING ─────────────────────────────────────────────────
// Separate flow: creates Organization + first COMPANY account. Not public registration.

export async function onboardOrganization(input: OrgOnboardInput) {
  const appUrl = getAppUrl();
  const parsed = orgOnboardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { adminName, adminEmail, adminPassword, orgName, orgSlug, orgDescription, orgWebsite } =
    parsed.data;

  const existingUser = await db.user.findFirst({
    where: {
      email: {
        equals: adminEmail,
        mode: "insensitive",
      },
    },
  });
  if (existingUser) {
    return { error: { adminEmail: ["Энэ имэйл хаяг бүртгэлтэй байна"] } };
  }

  const existingOrg = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (existingOrg) {
    return { error: { orgSlug: ["Энэ slug аль хэдийн ашиглагдаж байна"] } };
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Create org admin + org in a transaction
  const result = await db.$transaction(async (tx) => {
    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "COMPANY",
        status: "PENDING_VERIFICATION",
      },
    });

    const org = await tx.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        description: orgDescription ?? null,
        website: orgWebsite ?? null,
        ownerId: admin.id,
        isActive: false,
        settings: orgPendingSettings(),
      },
    });

    // Link admin to org
    await tx.user.update({
      where: { id: admin.id },
      data: { organizationId: org.id },
    });

    return { admin, org };
  });

  // Email verification
  const token = randomUUID();
  await db.verificationToken.create({
    data: {
      token,
      type: "email_verify",
      userId: result.admin.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  sendEmail({
    to: adminEmail,
    subject: "Байгууллагын бүртгэл баталгаажуулна уу",
    template: "verify-email",
    data: {
      name: adminName,
      verifyUrl: `${appUrl}/verify-email?token=${token}`,
    },
  }).catch(() => null);

  notifyAdminOrgRegistration({
    orgId: result.org.id,
    orgName,
    orgSlug,
    adminName,
    adminEmail,
  }).catch(() => null);

  return { success: true, orgId: result.org.id, adminId: result.admin.id, pendingApproval: true };
}

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────

export async function resendVerificationEmail(userId: string) {
  const appUrl = getAppUrl();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!user) return { error: "Хэрэглэгч олдсонгүй" };
  if (user.status !== "PENDING_VERIFICATION") return { error: "Имэйл аль хэдийн баталгаажсан байна" };

  // Invalidate existing tokens
  await db.verificationToken.updateMany({
    where: { userId, type: "email_verify", usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomUUID();
  await db.verificationToken.create({
    data: {
      token,
      type: "email_verify",
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  if (!env.isProduction) {
    console.log(`[DEV] Resend verification link for ${user.email}: ${verifyUrl}`);
  }

  sendEmail({
    to: user.email,
    subject: "Имэйл хаягаа баталгаажуулна уу",
    template: "verify-email",
    data: { name: user.name, verifyUrl },
  }).catch(() => null);

  return { success: true };
}
