import { z } from "zod";

const imageUrlSchema = z.string().url().or(z.string().startsWith("/uploads/"));

export const createCourseSchema = z.object({
  title: z.string().min(5, "Гарчиг 5-аас дээш тэмдэгттэй байх ёстой").max(150),
  description: z.string().min(20, "Тайлбар 20-оос дээш тэмдэгттэй байх ёстой"),
  shortDescription: z.string().max(200).optional(),
  categoryId: z.string().cuid().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]).default("ALL_LEVELS"),
  language: z.string().default("mn"),
  price: z.number().min(0).default(0),
  currency: z.string().default("MNT"),
  thumbnailUrl: imageUrlSchema.optional().or(z.literal("")),
  tags: z.array(z.string()).max(10).default([]),
  prerequisites: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).min(1, "Дор хаяж 1 сурах зорилт оруулна уу").default([]),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  thumbnailUrl: imageUrlSchema.optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "UNDER_REVIEW"]).optional(),
});

export const createModuleSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const createLessonSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(2).max(150),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "TEXT", "PDF", "ASSIGNMENT", "QUIZ", "LIVE_SESSION"]),
  contentUrl: z.string().url().optional().or(z.literal("")),
  contentBody: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  isFree: z.boolean().default(false),
  dripDays: z.number().int().min(0).optional(),
});

export const reorderLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string().cuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
});

export const enrollCourseSchema = z.object({
  courseId: z.string().cuid(),
  couponCode: z.string().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type EnrollCourseInput = z.infer<typeof enrollCourseSchema>;
