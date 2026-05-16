import { tool, generateText, zodSchema } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { prismaJson, type AgentPageContext } from "@/lib/ai/context";
import { getFallbackModel, getPrimaryModel } from "@/lib/ai/groq";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  createNoteInputSchema,
  createStudyPlanInputSchema,
  createTodoInputSchema,
  generateDailyTasksInputSchema,
  recommendLessonsInputSchema,
  summarizeLessonInputSchema,
  updateLearningProfileInputSchema,
} from "@/lib/validations/ai";
import type { TodoPriority } from "@prisma/client";

function bumpCache(userId: string) {
  try {
    revalidateUserDashboard(userId);
  } catch {
    /* ignore */
  }
}

function mapPriority(p?: string): TodoPriority {
  if (p === "LOW" || p === "HIGH" || p === "URGENT" || p === "MEDIUM") return p;
  return "MEDIUM";
}

function buildPlanJson(input: z.infer<typeof createStudyPlanInputSchema>) {
  const days = Array.from({ length: input.durationDays }, (_, i) => ({
    day: i + 1,
    focus: input.topics?.length ? input.topics[i % input.topics.length] : input.goal,
    tasks: [
      i === 0 ? `Судлах: ${input.goal.slice(0, 120)}` : `Давтан: өмнөх өдрийн дүн шинжилгээ`,
      `Практик: ${input.title} — ${input.dailyTime ?? "30-60 мин"}`,
    ],
  }));
  return { goal: input.goal, dailyTime: input.dailyTime ?? null, level: input.level ?? null, topics: input.topics ?? [], days };
}

export function createAgentTools(userId: string, page: AgentPageContext) {
  return {
    create_study_plan: tool({
      description:
        "Create a structured multi-day study plan row and optionally seed todo items for the first days.",
      inputSchema: zodSchema(createStudyPlanInputSchema),
      execute: async (raw) => {
        const input = createStudyPlanInputSchema.parse(raw);
        const planJson = buildPlanJson(input);
        const created = await db.studyPlan.create({
          data: {
            userId,
            title: input.title,
            description: input.goal.slice(0, 2000),
            durationDays: input.durationDays,
            plan: prismaJson(planJson),
            status: "active",
          },
          select: { id: true, title: true, durationDays: true },
        });

        const seed = input.seedTodosForFirstDays ?? 7;
        let todosCreated = 0;
        if (seed > 0) {
          const slice = planJson.days.slice(0, seed);
          for (const d of slice) {
            await db.todoItem.create({
              data: {
                userId,
                title: `Өдөр ${d.day}: ${input.title}`,
                body: `${d.tasks.join("\n")}\n\n(studyPlan:${created.id}, day:${d.day})`,
                source: "ai_agent",
                status: "pending",
                priority: "MEDIUM",
              },
            });
            todosCreated += 1;
          }
        }
        bumpCache(userId);
        return { ok: true, studyPlanId: created.id, title: created.title, durationDays: created.durationDays, todosCreated };
      },
    }),

    create_todo: tool({
      description: "Create a single todo/checklist item for the user.",
      inputSchema: zodSchema(createTodoInputSchema),
      execute: async (raw) => {
        const input = createTodoInputSchema.parse(raw);
        const row = await db.todoItem.create({
          data: {
            userId,
            title: input.title,
            body: input.description ?? null,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            priority: mapPriority(input.priority),
            source: "ai_agent",
            status: "pending",
          },
          select: { id: true, title: true },
        });
        bumpCache(userId);
        return { ok: true, todoId: row.id, title: row.title };
      },
    }),

    create_note: tool({
      description: "Save a rich text / markdown note to the user's notes board.",
      inputSchema: zodSchema(createNoteInputSchema),
      execute: async (raw) => {
        const input = createNoteInputSchema.parse(raw);
        const note = await db.note.create({
          data: {
            userId,
            title: input.title,
            content: input.content,
            col: "todo",
            tags: input.tags?.length ? input.tags : ["ai-agent"],
            source: "ai_agent",
          },
          select: { id: true, title: true },
        });
        bumpCache(userId);
        return { ok: true, noteId: note.id, title: note.title };
      },
    }),

    update_learning_profile: tool({
      description: "Upsert learning profile fields (goals, time, level, interests).",
      inputSchema: zodSchema(updateLearningProfileInputSchema),
      execute: async (raw) => {
        const input = updateLearningProfileInputSchema.parse(raw);
        const goals = input.goals ?? [];
        const weakTopics = input.weakTopics ?? [];
        const interests = input.interests ?? [];
        await db.userLearningProfile.upsert({
          where: { userId },
          create: {
            userId,
            goals: prismaJson(goals),
            weakTopics: prismaJson(weakTopics),
            interests: prismaJson(interests),
            availableTimePerDay: input.availableTimePerDay ?? null,
            currentLevel: input.currentLevel ?? null,
            preferredLanguage: input.preferredLanguage ?? "mn",
          },
          update: {
            ...(input.goals !== undefined ? { goals: prismaJson(goals) } : {}),
            ...(input.weakTopics !== undefined ? { weakTopics: prismaJson(weakTopics) } : {}),
            ...(input.interests !== undefined ? { interests: prismaJson(interests) } : {}),
            ...(input.availableTimePerDay !== undefined ? { availableTimePerDay: input.availableTimePerDay } : {}),
            ...(input.currentLevel !== undefined ? { currentLevel: input.currentLevel } : {}),
            ...(input.preferredLanguage !== undefined ? { preferredLanguage: input.preferredLanguage } : {}),
          },
        });
        bumpCache(userId);
        return { ok: true };
      },
    }),

    recommend_lessons: tool({
      description:
        "Search published courses/lessons in the real database. Returns only actual catalog data — never invent titles.",
      inputSchema: zodSchema(recommendLessonsInputSchema),
      execute: async (raw) => {
        const input = recommendLessonsInputSchema.parse(raw);
        const term = (input.topic || input.goal || "").trim();
        const keywords = term
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((w) => w.length > 2)
          .slice(0, 5);

        const orFilters =
          keywords.length > 0
            ? keywords.flatMap((kw) => [
                { title: { contains: kw, mode: "insensitive" as const } },
                { description: { contains: kw, mode: "insensitive" as const } },
              ])
            : [];

        const courses = await db.course.findMany({
          where: {
            status: "PUBLISHED",
            ...(orFilters.length > 0 ? { OR: orFilters } : {}),
          },
          take: 8,
          orderBy: [{ isFeatured: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            description: true,
            modules: {
              orderBy: { orderIndex: "asc" },
              take: 3,
              select: {
                lessons: {
                  orderBy: { orderIndex: "asc" },
                  take: 4,
                  select: { id: true, title: true, type: true },
                },
              },
            },
          },
        });

        const picks = courses.flatMap((c) => {
          const lessonRows = c.modules.flatMap((m) => m.lessons);
          if (lessonRows.length > 0) {
            return lessonRows.map((l) => ({
              courseId: c.id,
              courseTitle: c.title,
              courseSlug: c.slug,
              level: c.level,
              lessonId: l.id,
              lessonTitle: l.title,
              lessonType: l.type,
              href: `/courses/${c.slug}`,
            }));
          }
          return [
            {
              courseId: c.id,
              courseTitle: c.title,
              courseSlug: c.slug,
              level: c.level,
              lessonId: null as string | null,
              lessonTitle: "(хичээлүүд каталогоос нээнэ үү)",
              lessonType: null as string | null,
              href: `/courses/${c.slug}`,
            },
          ];
        });

        const enrolled = await db.enrollment.findMany({
          where: { studentId: userId, status: { in: ["ACTIVE", "COMPLETED"] } },
          take: 5,
          orderBy: { enrolledAt: "desc" },
          select: {
            course: {
              select: { id: true, title: true, slug: true, level: true, status: true },
            },
          },
        });

        return {
          ok: true,
          items: picks.slice(0, 8),
          enrolledCourses: enrolled
            .filter((e) => e.course.status === "PUBLISHED")
            .map((e) => ({
              courseId: e.course.id,
              title: e.course.title,
              slug: e.course.slug,
              href: `/courses/${e.course.slug}`,
            })),
          searchTerm: term || null,
        };
      },
    }),

    summarize_lesson: tool({
      description: "Summarize a lesson the user references (prefer currentLessonId from context). Optionally save as note.",
      inputSchema: zodSchema(summarizeLessonInputSchema),
      execute: async (raw) => {
        const input = summarizeLessonInputSchema.parse(raw);
        const lessonId = input.lessonId || page.currentLessonId;
        if (!lessonId) return { ok: false, error: "lessonId required" };

        const lesson = await db.lesson.findFirst({
          where: { id: lessonId },
          include: {
            module: { include: { course: { select: { id: true, title: true, status: true } } } },
          },
        });
        if (!lesson || lesson.module.course.status !== "PUBLISHED") {
          return { ok: false, error: "Lesson not found or unpublished" };
        }

        const blob = [lesson.title, lesson.description ?? "", lesson.contentBody ?? ""].join("\n\n").slice(0, 14_000);
        const mini = getFallbackModel();
        if (!mini) {
          return { ok: true, summary: blob.slice(0, 1500) + (blob.length > 1500 ? "…" : "") };
        }
        const { text } = await generateText({
          model: mini,
          prompt: `You are a tutor. Summarize the following lesson in clear bullet points. Match Mongolian if the text is mostly Mongolian.\n\n${blob}`,
        });

        if (input.saveAsNote) {
          await db.note.create({
            data: {
              userId,
              title: input.noteTitle ?? `Тайлбар: ${lesson.title}`,
              content: text,
              col: "todo",
              source: "ai_agent",
              tags: ["lesson-summary", lesson.id],
            },
          });
          bumpCache(userId);
        }
        return { ok: true, summary: text, lessonTitle: lesson.title, savedNote: Boolean(input.saveAsNote) };
      },
    }),

    generate_daily_tasks: tool({
      description: "Create multiple todo items from an active study plan title/goal or explicit studyPlanId.",
      inputSchema: zodSchema(generateDailyTasksInputSchema),
      execute: async (raw) => {
        const input = generateDailyTasksInputSchema.parse(raw);
        const n = input.count ?? 5;
        let plan = null as { id: string; title: string; plan: unknown } | null;
        if (input.studyPlanId) {
          plan = await db.studyPlan.findFirst({
            where: { id: input.studyPlanId, userId },
            select: { id: true, title: true, plan: true },
          });
        } else {
          plan = await db.studyPlan.findFirst({
            where: { userId, status: "active" },
            orderBy: { updatedAt: "desc" },
            select: { id: true, title: true, plan: true },
          });
        }
        const base = plan?.title ?? input.goal ?? "Суралцах даалгавар";
        const created: string[] = [];
        for (let i = 0; i < n; i += 1) {
          const row = await db.todoItem.create({
            data: {
              userId,
              title: `${base} — алхам ${i + 1}`,
              body: plan?.id ? `Төлөвлөгөө: ${plan.id}` : null,
              source: "ai_agent",
              status: "pending",
              priority: "MEDIUM",
            },
            select: { id: true },
          });
          created.push(row.id);
        }
        bumpCache(userId);
        return { ok: true, todoIds: created, count: created.length };
      },
    }),
  };
}
