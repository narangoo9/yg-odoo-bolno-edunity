import { z } from "zod";

const imageUrlSchema = z.string().url().or(z.string().startsWith("/uploads/"));
const youtubeIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{11}$/, "YouTube video ID is required");

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
  videoType: z.enum(["NONE", "YOUTUBE", "UPLOAD"]).default("NONE"),
  videoUrl: z.string().url().optional().or(z.literal("")),
  videoProvider: z.enum(["YOUTUBE", "CUSTOM"]).nullable().optional(),
  sectionId: z.string().optional().or(z.literal("")),
  startTimeSeconds: z.number().int().min(1).optional(),
  endTimeSeconds: z.number().int().min(1).optional(),
  videoSegments: z.array(
    z.object({
      title: z.string().min(2).max(100),
      topic: z.string().max(150).optional().or(z.literal("")),
      startTimeSeconds: z.number().int().min(0).optional(),
      summary: z.string().max(240).optional().or(z.literal("")),
    })
  ).optional(),
  videoTasks: z.array(z.string().max(180)).optional(),
  sourceCreditName: z.string().max(120).optional().or(z.literal("")),
  sourceCreditUrl: z.string().url().optional().or(z.literal("")),
  isFree: z.boolean().default(false),
  dripDays: z.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema
  .omit({ moduleId: true })
  .partial();

export const reorderLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string().cuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
});

export const lessonSectionSchema = z.object({
  lessonId: z.string().cuid(),
  title: z.string().min(2).max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  order: z.number().int().min(0).optional(),
  youtubeId: youtubeIdSchema,
  startSeconds: z.number().int().min(0),
  endSeconds: z.number().int().min(1),
  taskTitle: z.string().max(160).optional().or(z.literal("")),
  taskDescription: z.string().max(2000).optional().or(z.literal("")),
  pdfUrl: z.string().url().or(z.string().startsWith("/")).optional().or(z.literal("")),
  resourceUrl: z.string().url().or(z.string().startsWith("/")).optional().or(z.literal("")),
}).refine((data) => data.endSeconds > data.startSeconds, {
  path: ["endSeconds"],
  message: "endSeconds must be greater than startSeconds",
});

export const completeLessonSectionSchema = z.object({
  sectionId: z.string().cuid(),
});

export const youtubeCourseSectionSchema = z.object({
  title: z.string().min(1, "Section title is required").max(150),
  order: z.number().int().min(1),
  startSeconds: z.number().int().min(0),
  endSeconds: z.number().int().min(1).nullable().optional(),
}).refine((data) => data.endSeconds == null || data.endSeconds > data.startSeconds, {
  path: ["endSeconds"],
  message: "endSeconds must be greater than startSeconds",
});

export const createYouTubeCourseSchema = z.object({
  sourceYoutubeUrl: z.string().min(1),
  sourceYoutubeId: youtubeIdSchema,
  title: z.string().min(1, "Course title is required").max(150),
  coverImage: z.string().url(),
  durationSeconds: z.number().int().min(1).nullable().optional(),
  sections: z.array(youtubeCourseSectionSchema).min(1, "At least one section is required"),
}).superRefine((data, ctx) => {
  const starts = new Set<number>();
  const sorted = [...data.sections].sort((a, b) => a.startSeconds - b.startSeconds);

  data.sections.forEach((section, index) => {
    if (starts.has(section.startSeconds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections", index, "startSeconds"],
        message: "Duplicate start time",
      });
    }
    starts.add(section.startSeconds);
  });

  data.sections.forEach((section, index) => {
    if (section.startSeconds !== sorted[index]?.startSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections"],
        message: "Sections must be sorted by start time",
      });
    }
  });
});

export const enrollCourseSchema = z.object({
  courseId: z.string().cuid(),
  couponCode: z.string().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type EnrollCourseInput = z.infer<typeof enrollCourseSchema>;
export type LessonSectionInput = z.infer<typeof lessonSectionSchema>;
export type CreateYouTubeCourseInput = z.infer<typeof createYouTubeCourseSchema>;
