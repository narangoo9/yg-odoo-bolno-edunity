import { db } from "@/lib/db";
import { awardXP, updateStreak } from "@/modules/gamification/application/gamification-service";
import { XpAction } from "@prisma/client";

export type TaskState = "not-started" | "draft" | "submitted" | "completed";

export interface CourseLearningState {
  completedSectionIds: string[];
  taskStates: Record<string, TaskState>;
  watchProgress: Record<string, { lastPositionSec: number; watchTimeSec: number }>;
  notes: Array<{
    id: string;
    sectionId: string | null;
    seconds: number;
    content: string;
    createdAt: string;
  }>;
}

/** Load the full learning state for a YouTube course from DB. */
export async function getCourseLearningState(
  userId: string,
  courseId: string,
): Promise<CourseLearningState> {
  const [completions, taskStates, watchProgress, notes] = await Promise.all([
    db.course_section_completions.findMany({
      where: { studentId: userId, course_sections: { courseId } },
      select: { sectionId: true },
    }),
    db.course_section_task_states.findMany({
      where: { userId, courseId },
      select: { sectionId: true, state: true },
    }),
    db.course_section_watch_progress.findMany({
      where: { userId, courseId },
      select: { sectionId: true, lastPositionSec: true, watchTimeSec: true },
    }),
    db.study_notes.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, sectionId: true, seconds: true, content: true, createdAt: true },
    }),
  ]);

  return {
    completedSectionIds: completions.map((c) => c.sectionId),
    taskStates: Object.fromEntries(
      taskStates.map((t) => [t.sectionId, t.state as TaskState]),
    ),
    watchProgress: Object.fromEntries(
      watchProgress.map((w) => [
        w.sectionId,
        { lastPositionSec: w.lastPositionSec, watchTimeSec: w.watchTimeSec },
      ]),
    ),
    notes: notes.map((n) => ({
      id: n.id,
      sectionId: n.sectionId,
      seconds: n.seconds,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/** Mark a CourseSection as complete. Idempotent — XP awarded only on first completion. */
export async function completeCourseSectionInDB(
  userId: string,
  courseId: string,
  sectionId: string,
): Promise<{ alreadyCompleted: boolean; xpAwarded: number }> {
  // Check existing state to detect if this is the first completion
  const existing = await db.course_section_task_states.findUnique({
    where: { userId_sectionId: { userId, sectionId } },
    select: { completedAt: true, xpAwarded: true },
  });

  const alreadyCompleted = existing?.completedAt !== null && existing?.completedAt !== undefined;

  // Upsert completion record
  await db.course_section_completions.upsert({
    where: { sectionId_studentId: { sectionId, studentId: userId } },
    create: { sectionId, studentId: userId },
    update: { completedAt: new Date() },
  });

  // Upsert task state to completed
  await db.course_section_task_states.upsert({
    where: { userId_sectionId: { userId, sectionId } },
    create: { userId, courseId, sectionId, state: "completed", completedAt: new Date() },
    update: { state: "completed", completedAt: new Date() },
  });

  let xpAwarded = 0;

  // Award XP only on first completion
  if (!alreadyCompleted && !(existing?.xpAwarded)) {
    await db.course_section_task_states.update({
      where: { userId_sectionId: { userId, sectionId } },
      data: { xpAwarded: true },
    });
    const result = await awardXP(userId, XpAction.SECTION_COMPLETE, sectionId);
    xpAwarded = result.xp;
    await updateStreak(userId);
  }

  // Log activity (deduplicated by userId+sectionId)
  await db.learning_activities.upsert({
    where: { userId_dedupeKey: { userId, dedupeKey: `section_complete:${sectionId}` } },
    create: {
      userId,
      courseId,
      sectionId,
      type: "SECTION_COMPLETED",
      dedupeKey: `section_complete:${sectionId}`,
      xpAwarded,
    },
    update: {},
  });

  return { alreadyCompleted, xpAwarded };
}

/** Upsert task state for a section without marking it complete. */
export async function updateSectionTaskState(
  userId: string,
  courseId: string,
  sectionId: string,
  state: TaskState,
): Promise<void> {
  await db.course_section_task_states.upsert({
    where: { userId_sectionId: { userId, sectionId } },
    create: { userId, courseId, sectionId, state },
    update: { state },
  });
}

/** Throttle-safe watch progress update. */
export async function updateSectionWatchProgress(
  userId: string,
  courseId: string,
  sectionId: string,
  lastPositionSec: number,
  watchedDeltaSec: number,
): Promise<void> {
  const pos = Math.max(0, Math.min(lastPositionSec, 86400));
  const delta = Math.max(0, Math.min(watchedDeltaSec, 3600));

  await db.course_section_watch_progress.upsert({
    where: { userId_sectionId: { userId, sectionId } },
    create: {
      userId,
      courseId,
      sectionId,
      lastPositionSec: pos,
      watchTimeSec: delta,
    },
    update: {
      lastPositionSec: pos,
      watchTimeSec: { increment: delta },
      lastWatchedAt: new Date(),
    },
  });
}

/** Get course completion percent based on DB completions. */
export async function getCourseProgressPercent(
  userId: string,
  courseId: string,
): Promise<number> {
  const [totalSections, completedSections] = await Promise.all([
    db.courseSection.count({ where: { courseId } }),
    db.course_section_completions.count({
      where: { studentId: userId, course_sections: { courseId } },
    }),
  ]);

  if (totalSections === 0) return 0;
  return Math.round((completedSections / totalSections) * 100);
}

/** Check if a user has completed all sections of a course (for certificate gating). */
export async function isCourseCompletedForCertificate(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const percent = await getCourseProgressPercent(userId, courseId);
  return percent >= 100;
}
