export interface ParsedCourseSection {
  title: string;
  order: number;
  startSeconds: number;
  endSeconds: number | null;
}

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const TIMESTAMP_LINE_PATTERN = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*(?:[-|:—–•]\s*)?(.*?)\s*$/;

export function extractYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "shorts") && YOUTUBE_ID_PATTERN.test(parts[1] ?? "")) {
        return parts[1];
      }
    }

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id && YOUTUBE_ID_PATTERN.test(id)) return id;
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeThumbnailUrls(videoId: string) {
  return {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    fallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export function parseTimeToSeconds(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;

  const nums = parts.map(Number);
  if (nums.some((num) => Number.isNaN(num))) return null;

  if (nums.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = nums;
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatSeconds(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) return "";
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getTimestampLines(description: string): string[] {
  return description
    .split(/\r?\n/)
    .filter((line) => TIMESTAMP_LINE_PATTERN.test(line));
}

export function parseTimestampSections(description: string, durationSeconds?: number | null): ParsedCourseSection[] {
  const rows = description
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(TIMESTAMP_LINE_PATTERN);
      if (!match) return null;

      const startSeconds = parseTimeToSeconds(match[1]);
      if (startSeconds == null) return null;

      return {
        startSeconds,
        title: match[2]?.trim() ?? "",
      };
    })
    .filter((item): item is { startSeconds: number; title: string } => Boolean(item))
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const unique = rows.filter(
    (item, index, arr) => index === 0 || item.startSeconds !== arr[index - 1].startSeconds,
  );

  return unique.map((item, index) => ({
    title: item.title || `Section ${index + 1}`,
    order: index + 1,
    startSeconds: item.startSeconds,
    endSeconds: unique[index + 1]?.startSeconds ?? durationSeconds ?? null,
  }));
}
