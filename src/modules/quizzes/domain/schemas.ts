import { z } from "zod";

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────

export const createQuizSchema = z.object({
  courseId: z.string().cuid(),
  lessonId: z.string().cuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  timeLimit: z.number().int().min(1).optional(), // minutes
  passingScore: z.number().int().min(0).max(100).default(70),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  randomOrder: z.boolean().default(false),
  showResult: z.boolean().default(true),
});

export const createQuestionSchema = z.object({
  quizId: z.string().cuid(),
  type: z.enum(["MULTIPLE_CHOICE", "SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "FILE_UPLOAD"]),
  text: z.string().min(1),
  explanation: z.string().optional(),
  points: z.number().int().min(1).default(1),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .min(2)
    .optional(),
});

export const submitQuizSchema = z.object({
  attemptId: z.string().cuid(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      selectedIds: z.array(z.string()).default([]),
      textAnswer: z.string().optional(),
    })
  ),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
