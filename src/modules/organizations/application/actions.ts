"use server";

import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
  type RemoveMemberInput,
} from "../domain/schemas";
import type { OrgMemberRole } from "@prisma/client";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function requireOrgAdmin(organizationId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  const member = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: session.user.id } },
  });

  const isOrgAdmin = member?.role === "OWNER" || member?.role === "ADMIN";
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  if (!isOrgAdmin && !isSuperAdmin) {
    return { error: "Зөвшөөрөл хангалтгүй" };
  }

  return { session, member };
}

// ─── INVITE MEMBER ────────────────────────────────────────────────────────────

export async function inviteMember(input: InviteMemberInput) {
  const appUrl = getAppUrl();
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { organizationId, email, role } = parsed.data;

  const check = await requireOrgAdmin(organizationId);
  if ("error" in check && check.error) return { error: check.error };

  const session = check.session!;

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) return { error: "Байгууллага олдсонгүй" };

  // Check if already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: existingUser.id } },
    });
    if (existingMember) return { error: "Энэ хэрэглэгч аль хэдийн гишүүн байна" };
  }

  // Check for pending invite
  const pendingInvite = await db.orgInvite.findFirst({
    where: { organizationId, email, acceptedAt: null },
  });
  if (pendingInvite && pendingInvite.expiresAt > new Date()) {
    return { error: "Энэ имэйлд урилга аль хэдийн илгээгдсэн байна" };
  }

  const token = randomUUID();
  const userRole = role === "OWNER" || role === "ADMIN" ? "ORG_ADMIN" : "INSTRUCTOR";

  await db.orgInvite.create({
    data: {
      organizationId,
      email,
      role: userRole,
      token,
      invitedBy: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  await sendEmail({
    to: email,
    subject: `${org.name} байгууллагын урилга`,
    template: "org-invite",
    data: {
      orgName: org.name,
      role,
      inviteUrl: `${appUrl}/org/invite/accept?token=${token}`,
      inviterName: session.user.name ?? "Байгууллагын менежер",
    },
  });

  return { success: true };
}

// ─── ACCEPT INVITE ─────────────────────────────────────────────────────────────

export async function acceptOrgInvite(token: string) {
  const appUrl = getAppUrl();
  const invite = await db.orgInvite.findUnique({ where: { token } });

  if (!invite) return { error: "Урилга олдсонгүй" };
  if (invite.acceptedAt) return { error: "Урилга аль хэдийн ашиглагдсан" };
  if (invite.expiresAt < new Date()) return { error: "Урилгын хугацаа дууссан байна" };

  const session = await auth();

  // Determine user: must be logged in with the invited email or create account
  if (!session?.user) {
    // Redirect to register with invite token pre-filled
    return { redirect: `${appUrl}/register?invite=${token}` };
  }

  if (session.user.email !== invite.email) {
    return { error: `Энэ урилга ${invite.email} имэйлд зориулагдсан` };
  }

  const orgMemberRole: OrgMemberRole =
    invite.role === "ORG_ADMIN" ? "ADMIN" : "INSTRUCTOR";

  await db.$transaction(async (tx) => {
    // Create OrganizationMember record
    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId: session.user.id } },
      create: {
        organizationId: invite.organizationId,
        userId: session.user.id,
        role: orgMemberRole,
        status: "ACTIVE",
        invitedBy: invite.invitedBy,
      },
      update: { role: orgMemberRole, status: "ACTIVE" },
    });

    // Update user's organizationId and role if needed
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });

    // Mark invite as accepted
    await tx.orgInvite.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });
  });

  return { success: true, organizationId: invite.organizationId };
}

// ─── REMOVE MEMBER ─────────────────────────────────────────────────────────────

export async function removeMember(input: RemoveMemberInput) {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const { organizationId, userId } = parsed.data;

  const check = await requireOrgAdmin(organizationId);
  if ("error" in check && check.error) return { error: check.error };

  const session = check.session!;

  // Cannot remove yourself (owner)
  if (userId === session.user.id) return { error: "Өөрийгөө гишүүнээс хасах боломжгүй" };

  // Cannot remove the org owner
  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (org?.ownerId === userId) return { error: "Байгууллагын эзэнийг хасах боломжгүй" };

  await db.$transaction(async (tx) => {
    await tx.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });

    // Clear organizationId if the user's current org matches
    await tx.user.updateMany({
      where: { id: userId, organizationId },
      data: { organizationId: null },
    });
  });

  return { success: true };
}

// ─── UPDATE MEMBER ROLE ────────────────────────────────────────────────────────

export async function updateMemberRole(input: UpdateMemberRoleInput) {
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) return { error: "Буруу оролт" };

  const { organizationId, userId, role } = parsed.data;

  const check = await requireOrgAdmin(organizationId);
  if ("error" in check && check.error) return { error: check.error };

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (org?.ownerId === userId) return { error: "Байгууллагын эзэний эрхийг өөрчлөх боломжгүй" };

  await db.organizationMember.update({
    where: { organizationId_userId: { organizationId, userId } },
    data: { role },
  });

  return { success: true };
}

// ─── GET MEMBERS ───────────────────────────────────────────────────────────────

export async function getOrgMembers(organizationId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Нэвтрээгүй байна" };

  // Must be a member or super admin
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  if (!isSuperAdmin) {
    const member = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: session.user.id } },
    });
    if (!member) return { error: "Зөвшөөрөл хангалтгүй" };
  }

  const [members, pendingInvites] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, lastLoginAt: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    db.orgInvite.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { members, pendingInvites };
}
