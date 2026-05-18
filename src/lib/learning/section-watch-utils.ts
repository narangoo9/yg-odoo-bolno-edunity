/** Client-safe helpers (no Node/db imports). */

export const WATCH_COMPLETION_RATIO = 0.9;

export function sectionDurationSeconds(
  section: { startSeconds: number; endSeconds: number | null },
  sections: Array<{ startSeconds: number; endSeconds: number | null; order: number }>,
  sectionIndex: number,
): number {
  const end =
    section.endSeconds ??
    (sectionIndex >= 0 && sectionIndex < sections.length - 1
      ? Math.max(section.startSeconds + 1, sections[sectionIndex + 1]!.startSeconds - 1)
      : section.startSeconds + 900);
  return Math.max(30, end - section.startSeconds + 1);
}

export function watchThresholdSeconds(durationSec: number) {
  return Math.ceil(durationSec * WATCH_COMPLETION_RATIO);
}
