import { z } from "zod";

export const inviteMemberSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email("Зөв имэйл хаяг оруулна уу"),
  role: z.enum(["OWNER", "ADMIN", "INSTRUCTOR", "VIEWER"]).default("INSTRUCTOR"),
});

export const updateMemberRoleSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "INSTRUCTOR", "VIEWER"]),
});

export const removeMemberSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
