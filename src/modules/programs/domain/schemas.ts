import { z } from "zod";

const imageUrlSchema = z.string().url().or(z.string().startsWith("/uploads/"));

export const programSchema = z.object({
  title: z.string().min(3, "Гарчиг 3-аас дээш тэмдэгттэй байх ёстой"),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Зөвхөн жижиг үсэг, тоо, зураас ашиглана уу"),
  description: z.string().max(2000).optional(),
  thumbnailUrl: imageUrlSchema.optional().or(z.literal("")),
  isOrdered: z.boolean().default(false),
  certificateTitle: z.string().max(200).optional(),
  certificateDescription: z.string().max(500).optional(),
});

export const addProgramCourseSchema = z.object({
  programId: z.string().cuid(),
  courseId: z.string().cuid(),
  orderIndex: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(true),
});

export const enrollProgramSchema = z.object({
  programId: z.string().cuid(),
  source: z.enum(["direct", "invite", "organization"]).default("direct"),
});

export type ProgramInput = z.infer<typeof programSchema>;
export type AddProgramCourseInput = z.infer<typeof addProgramCourseSchema>;
export type EnrollProgramInput = z.infer<typeof enrollProgramSchema>;
