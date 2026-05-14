"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { registerSchema, orgOnboardSchema, forgotPasswordSchema, resetPasswordSchema } from "../domain/schemas";
import type { RegisterInput, OrgOnboardInput, ForgotPasswordInput, ResetPasswordInput } from "../domain/schemas";

// ─── REGISTER ────────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const appUrl = getAppUrl();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Public signup is STUDENT only — instructors come via org invite
  const { name, email, password } = parsed.data;

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

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      status: "PENDING_VERIFICATION",
    },
  });

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

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

export async function forgotPassword(input: ForgotPasswordInput) {
  const appUrl = getAppUrl();
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const user = await db.user.findFirst({
    where: {
      email: {
        equals: parsed.data.email,
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
    to: parsed.data.email,
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
// Separate flow: creates Organization + first ORG_ADMIN. Not public registration.

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
        role: "ORG_ADMIN",
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

  return { success: true, orgId: result.org.id, adminId: result.admin.id };
}
