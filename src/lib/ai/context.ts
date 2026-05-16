import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AgentPageContext = {
  currentPage?: string;
  currentCourseId?: string;
  currentLessonId?: string;
};

export async function loadAgentContext(userId: string, sessionId: string, page: AgentPageContext) {
  const [
    profile,
    recentTodos,
    activePlans,
    recentMessages,
    courseSnippet,
    lessonSnippet,
    enrollments,
    catalogSample,
  ] = await Promise.all([
    db.userLearningProfile.findUnique({ where: { userId } }).catch(() => null),
    db.todoItem.findMany({
      where: { userId, isCompleted: false },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, title: true, dueDate: true, priority: true, status: true },
    }),
    db.studyPlan.findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, durationDays: true, description: true },
    }),
    db.aiMessage.findMany({
      where: { sessionId, session: { userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { role: true, content: true, createdAt: true },
    }),
    page.currentCourseId
      ? db.course.findFirst({
          where: { id: page.currentCourseId, status: "PUBLISHED" },
          select: { id: true, title: true, slug: true, level: true, description: true },
        })
      : Promise.resolve(null),
    page.currentLessonId
      ? db.lesson.findUnique({
          where: { id: page.currentLessonId },
          select: {
            id: true,
            title: true,
            description: true,
            contentBody: true,
            type: true,
            module: { select: { course: { select: { id: true, title: true, slug: true } } } },
          },
        })
      : Promise.resolve(null),
    db.enrollment
      .findMany({
        where: { studentId: userId, status: { in: ["ACTIVE", "COMPLETED"] } },
        orderBy: { enrolledAt: "desc" },
        take: 8,
        select: {
          progress: true,
          course: { select: { id: true, title: true, slug: true, level: true, status: true } },
        },
      })
      .catch(() => []),
    db.course
      .findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: { id: true, title: true, slug: true, level: true },
      })
      .catch(() => []),
  ]);

  const recentChronological = [...recentMessages].reverse();

  const blocks: string[] = [];
  blocks.push(`USER_ID: ${userId} (do not repeat to user)`);
  if (page.currentPage) blocks.push(`CURRENT_PAGE: ${page.currentPage}`);
  if (page.currentCourseId) blocks.push(`CURRENT_COURSE_ID: ${page.currentCourseId}`);
  if (page.currentLessonId) blocks.push(`CURRENT_LESSON_ID: ${page.currentLessonId}`);

  if (profile) {
    blocks.push(
      `LEARNING_PROFILE:\n${JSON.stringify(
        {
          goals: profile.goals,
          weakTopics: profile.weakTopics,
          interests: profile.interests,
          availableTimePerDay: profile.availableTimePerDay,
          currentLevel: profile.currentLevel,
          preferredLanguage: profile.preferredLanguage,
        },
        null,
        2,
      )}`,
    );
  } else {
    blocks.push("LEARNING_PROFILE: (none yet — create via tools if user shares goals)");
  }

  if (courseSnippet) {
    blocks.push(`CURRENT_COURSE:\n${JSON.stringify(courseSnippet, null, 2)}`);
  }
  if (lessonSnippet) {
    const lessonJson: Record<string, unknown> = {
      id: lessonSnippet.id,
      title: lessonSnippet.title,
      description: lessonSnippet.description,
      type: lessonSnippet.type,
      course: lessonSnippet.module.course,
    };
    const body = lessonSnippet.contentBody;
    lessonJson.contentPreview =
      typeof body === "string" ? body.slice(0, 4000) + (body.length > 4000 ? "…" : "") : null;
    blocks.push(`CURRENT_LESSON:\n${JSON.stringify(lessonJson, null, 2)}`);
  }

  if (activePlans.length) {
    blocks.push(`ACTIVE_STUDY_PLANS:\n${JSON.stringify(activePlans, null, 2)}`);
  }

  if (recentTodos.length) {
    blocks.push(`RECENT_OPEN_TODOS:\n${JSON.stringify(recentTodos, null, 2)}`);
  }

  if (enrollments.length) {
    blocks.push(
      `USER_ENROLLMENTS (real — prefer these for progress-based advice):\n${JSON.stringify(
        enrollments.map((e) => ({
          courseId: e.course.id,
          title: e.course.title,
          slug: e.course.slug,
          level: e.course.level,
          progress: e.progress,
        })),
        null,
        2,
      )}`,
    );
  }

  if (catalogSample.length) {
    blocks.push(
      `PUBLISHED_CATALOG_SAMPLE (only recommend titles from here or recommend_lessons tool output):\n${JSON.stringify(
        catalogSample,
        null,
        2,
      )}`,
    );
  }

  if (recentChronological.length) {
    blocks.push(
      `LAST_AI_THREAD_SNIPPET (most recent last):\n${recentChronological
        .map((m) => `- ${m.role}: ${m.content.slice(0, 1200)}`)
        .join("\n")}`,
    );
  }

  return blocks.join("\n\n");
}

export function prismaJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
