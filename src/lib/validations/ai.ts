import { z } from "zod";

export const agentRequestSchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z.string().min(1).max(12_000),
  currentPage: z.string().max(500).optional(),
  currentCourseId: z.string().cuid().optional(),
  currentLessonId: z.string().cuid().optional(),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export const createStudyPlanInputSchema = z.object({
  title: z.string().min(1).max(200),
  goal: z.string().min(1).max(2000),
  durationDays: z.number().int().min(1).max(365),
  dailyTime: z.string().max(120).optional(),
  level: z.string().max(80).optional(),
  topics: z.array(z.string().max(120)).max(40).optional(),
  seedTodosForFirstDays: z.number().int().min(0).max(14).optional(),
});

export const createTodoInputSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const createNoteInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50_000),
  tags: z.array(z.string().max(64)).max(20).optional(),
});

export const updateLearningProfileInputSchema = z.object({
  goals: z.array(z.string().max(500)).max(30).optional(),
  weakTopics: z.array(z.string().max(200)).max(30).optional(),
  interests: z.array(z.string().max(200)).max(30).optional(),
  availableTimePerDay: z.string().max(120).optional().nullable(),
  currentLevel: z.string().max(120).optional().nullable(),
  preferredLanguage: z.string().max(16).optional(),
});

export const recommendLessonsInputSchema = z.object({
  goal: z.string().max(1000).optional(),
  level: z.string().max(80).optional(),
  topic: z.string().max(200).optional(),
});

export const summarizeLessonInputSchema = z.object({
  lessonId: z.string().cuid().optional(),
  saveAsNote: z.boolean().optional(),
  noteTitle: z.string().max(200).optional(),
});

export const generateDailyTasksInputSchema = z.object({
  studyPlanId: z.string().cuid().optional(),
  goal: z.string().max(2000).optional(),
  count: z.number().int().min(1).max(20).optional(),
});
