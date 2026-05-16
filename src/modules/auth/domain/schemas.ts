import { z } from "zod";

const imageUrlSchema = z.string().url().or(z.string().startsWith("/uploads/"));

const emailSchema = z.string().trim().toLowerCase().email("Зөв имэйл хаяг оруулна уу");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Нууц үг оруулна уу"),
});

// Public signup: learners only. Instructors come from org invites.
export const registerSchema = z
  .object({
    name: z.string().min(2, "Нэр 2-оос дээш тэмдэгттэй байх ёстой"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Нууц үг 8-аас дээш тэмдэгттэй байх ёстой")
      .regex(/[A-Z]/, "Нууц үгт том үсэг агуулагдсан байх ёстой")
      .regex(/[0-9]/, "Нууц үгт тоо агуулагдсан байх ёстой"),
    confirmPassword: z.string(),
    referralCode: z.string().trim().max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Нууц үг таарахгүй байна",
    path: ["confirmPassword"],
  });

// Organization onboarding: creates org + first ORG_ADMIN in one flow
export const orgOnboardSchema = z
  .object({
    // Admin user
    adminName: z.string().min(2, "Нэр 2-оос дээш тэмдэгттэй байх ёстой"),
    adminEmail: emailSchema,
    adminPassword: z
      .string()
      .min(8, "Нууц үг 8-аас дээш тэмдэгттэй байх ёстой")
      .regex(/[A-Z]/, "Нууц үгт том үсэг агуулагдсан байх ёстой")
      .regex(/[0-9]/, "Нууц үгт тоо агуулагдсан байх ёстой"),
    confirmPassword: z.string(),
    // Organization
    orgName: z.string().min(2, "Байгууллагын нэр 2-оос дээш тэмдэгттэй байх ёстой"),
    orgSlug: z
      .string()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Зөвхөн жижиг үсэг, тоо, зураас ашиглана уу"),
    orgDescription: z.string().max(500).optional(),
    orgWebsite: z.string().url().optional().or(z.literal("")),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Нууц үг таарахгүй байна",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Нууц үг 8-аас дээш тэмдэгттэй байх ёстой")
      .regex(/[A-Z]/, "Нууц үгт том үсэг агуулагдсан байх ёстой")
      .regex(/[0-9]/, "Нууц үгт тоо агуулагдсан байх ёстой"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Нууц үг таарахгүй байна",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  avatarUrl: imageUrlSchema.optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OrgOnboardInput = z.infer<typeof orgOnboardSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
