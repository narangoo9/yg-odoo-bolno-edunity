import { db } from "@/lib/db";
import {
  WATCH_COMPLETION_RATIO,
  sectionDurationSeconds,
  watchThresholdSeconds,
} from "@/lib/learning/section-watch-utils";

export { WATCH_COMPLETION_RATIO, sectionDurationSeconds, watchThresholdSeconds };

export async function getSectionWatchMetrics(
  userId: string,
  courseId: string,
  sectionId: string,
) {
  const sections = await db.courseSection.findMany({
    where: { courseId },
    select: { id: true, startSeconds: true, endSeconds: true, order: true },
    orderBy: [{ order: "asc" }, { startSeconds: "asc" }],
  });
  const index = sections.findIndex((s) => s.id === sectionId);
  const section = sections[index];
  if (!section) return null;

  const progress = await db.course_section_watch_progress.findUnique({
    where: { userId_sectionId: { userId, sectionId } },
    select: { lastPositionSec: true, watchTimeSec: true },
  });

  const durationSec = sectionDurationSeconds(section, sections, index);
  const requiredSec = watchThresholdSeconds(durationSec);
  const watchedInSection = Math.max(
    0,
    (progress?.lastPositionSec ?? 0) - section.startSeconds,
  );
  const watchTimeSec = progress?.watchTimeSec ?? 0;
  const complete =
    watchTimeSec >= requiredSec || watchedInSection >= requiredSec;

  return {
    durationSec,
    requiredSec,
    watchTimeSec,
    lastPositionSec: progress?.lastPositionSec ?? section.startSeconds,
    percent: Math.min(
      100,
      Math.round((Math.max(watchTimeSec, watchedInSection) / durationSec) * 100),
    ),
    complete,
  };
}

export async function assertSectionWatchComplete(
  userId: string,
  courseId: string,
  sectionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const metrics = await getSectionWatchMetrics(userId, courseId, sectionId);
  if (!metrics) return { ok: false, message: "Section олдсонгүй" };
  if (!metrics.complete) {
    return {
      ok: false,
      message: `Видеог дор хаяж ${Math.round(WATCH_COMPLETION_RATIO * 100)}%-ийг үзсэн байх шаардлагатай (одоо ~${metrics.percent}%).`,
    };
  }
  return { ok: true };
}
