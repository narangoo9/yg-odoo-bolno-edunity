import type { LessonType } from "@prisma/client";
import { Clock, ExternalLink, Maximize2, Play, VideoOff } from "lucide-react";
import { LearningArtwork } from "@/components/course/LearningArtwork";
import { MascotImage } from "@/components/brand/MascotImage";
import { YouTubeSegmentPlayer } from "@/components/lesson/YouTubeSegmentPlayer";
import { getYouTubeVideoId, isValidYouTubeUrl } from "@/lib/youtube";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  contentUrl: string | null;
  duration: number | null;
  videoType?: "NONE" | "YOUTUBE" | "UPLOAD" | null;
  videoUrl?: string | null;
  videoProvider?: "YOUTUBE" | "CUSTOM" | null;
  sourceCreditName?: string | null;
  sourceCreditUrl?: string | null;
  sectionId?: string | null;
  startTimeSeconds?: number | null;
  endTimeSeconds?: number | null;
  videoSegments?: Array<{
    title: string;
    topic: string;
    startTime?: string;
    summary?: string;
  }> | null;
  videoTasks?: string[] | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getBadge(type: LessonType): string {
  const map: Record<string, string> = {
    VIDEO: "Хичээл",
    TEXT: "Нийтлэл",
    PDF: "PDF",
    ASSIGNMENT: "Даалгавар",
    QUIZ: "Шалгалт",
    LIVE_SESSION: "Шууд хичээл",
  };
  return map[type] ?? "Хичээл";
}

export function LessonArtworkCard({ lesson }: { lesson: Lesson }) {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.18)]">
      <LearningArtwork
        title={lesson.title}
        subtitle={lesson.description}
        badge={getBadge(lesson.type)}
        className="min-h-[280px] w-full"
      />

      <div className="pointer-events-none absolute bottom-4 right-5 z-10 hidden items-end gap-2 sm:flex">
        <div className="relative mb-3 rounded-2xl rounded-br-sm bg-white/15 px-3 py-2 backdrop-blur-sm">
          <p className="whitespace-nowrap text-[11px] font-bold text-white">Суралцахад бэлэн үү?</p>
          <div className="absolute -bottom-[6px] right-4 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/20" />
        </div>
        <MascotImage variant="laptop" size={76} className="animate-float" />
      </div>

      {lesson.duration ? (
        <div className="absolute bottom-4 left-5 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          <Clock size={10} />
          {formatDuration(lesson.duration)}
        </div>
      ) : null}

      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
        <Maximize2 size={14} className="text-white" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40 backdrop-blur-sm transition-transform hover:scale-105">
          <Play size={24} className="translate-x-0.5 fill-white text-white" />
        </div>
      </div>
    </div>
  );
}

function LessonVideoPlaceholder() {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_12px_40px_rgba(124,58,237,0.10)]">
      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <VideoOff size={20} />
        </div>
        <p className="text-sm font-bold text-slate-900">Энэ хичээлд видео нэмэгдээгүй байна.</p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
          Хичээлийн текст, PDF, quiz болон даалгавар доорх хэсгүүдэд хэвээр харагдана.
        </p>
      </div>
    </div>
  );
}

function VideoAttribution({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-2 rounded-2xl border border-violet-100 bg-white/70 p-4 text-[12px] leading-relaxed text-slate-600 shadow-sm">
      {lesson.sourceCreditName ? (
        <p>
          Эх сурвалж:{" "}
          {lesson.sourceCreditUrl ? (
            <a
              href={lesson.sourceCreditUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-violet-600 hover:text-violet-700"
            >
              {lesson.sourceCreditName}
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="font-semibold text-slate-600">{lesson.sourceCreditName}</span>
          )}
        </p>
      ) : null}
      <p>
        Энэ хичээл нь YouTube-ээс шууд embed болсон видео хичээл юм. Видео үзсэний
        дараа &quot;Хичээл дуусгасан гэж тэмдэглэх&quot; товчийг дарж, даалгаварыг гүйцэтгэнэ үү.
      </p>
    </div>
  );
}

function VideoSegments({ segments }: { segments?: Lesson["videoSegments"] }) {
  if (!segments || segments.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-violet-100 bg-white/80 p-4 text-sm text-slate-700 shadow-sm">
      <div className="text-base font-semibold text-slate-900">Видео сегментүүд</div>
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div key={`${segment.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Сегмент {index + 1}: {segment.title}</p>
                <p className="text-xs text-slate-500">{segment.topic}</p>
              </div>
              {segment.startTime ? (
                <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 sm:mt-0">
                  {segment.startTime}
                </span>
              ) : null}
            </div>
            {segment.summary ? (
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{segment.summary}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoTasks({ tasks }: { tasks?: Lesson["videoTasks"] }) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-slate-700 shadow-sm">
      <div className="text-base font-semibold text-slate-900">Видео үзсний дараах даалгавар</div>
      <ol className="list-decimal list-inside space-y-2 pl-3 text-[13px] leading-relaxed text-slate-600">
        {tasks.map((task, index) => (
          <li key={`${task}-${index}`}>{task}</li>
        ))}
      </ol>
    </div>
  );
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const explicitVideoUrl = lesson.videoUrl?.trim() || null;
  const legacyVideoUrl = lesson.type === "VIDEO" ? lesson.contentUrl?.trim() || null : null;
  const videoUrl = explicitVideoUrl ?? legacyVideoUrl;
  const videoType =
    lesson.videoType && lesson.videoType !== "NONE"
      ? lesson.videoType
      : videoUrl && isValidYouTubeUrl(videoUrl)
        ? "YOUTUBE"
        : videoUrl
          ? "UPLOAD"
          : "NONE";

  if (videoType === "YOUTUBE" && videoUrl) {
    const videoId = getYouTubeVideoId(videoUrl);

    return (
      <div className="space-y-4">
        {videoId ? (
          <YouTubeSegmentPlayer
            videoId={videoId}
            title={lesson.title}
            startTimeSeconds={lesson.startTimeSeconds || undefined}
            endTimeSeconds={lesson.endTimeSeconds || undefined}
            lessonId={lesson.id}
            onProgress={() => undefined}
            onCompleted={() => undefined}
          />
        ) : (
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-[0_16px_45px_rgba(124,58,237,0.12)]">
            <p className="text-sm font-bold text-slate-900">YouTube холбоос буруу байна.</p>
            <p className="mt-2 text-xs text-slate-500">Энэ хичээлд зөв YouTube видео холбоос оруулна уу.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {lesson.sectionId ? (
            <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">
              Хэсэг: {lesson.sectionId}
            </span>
          ) : null}
          {((lesson.startTimeSeconds ?? 0) > 0 || (lesson.endTimeSeconds ?? 0) > 0) ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
              Сегмент: {(lesson.startTimeSeconds ?? 0) > 0 ? formatDuration(lesson.startTimeSeconds!) : "00:00"} – {(lesson.endTimeSeconds ?? 0) > 0 ? formatDuration(lesson.endTimeSeconds!) : "end"}
            </span>
          ) : null}
        </div>

        <VideoAttribution lesson={lesson} />
        <VideoSegments segments={lesson.videoSegments} />
        <VideoTasks tasks={lesson.videoTasks} />
      </div>
    );
  }

  if (videoType === "UPLOAD" && videoUrl) {
    return (
      <div className="overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.15)]">
        <div className="aspect-video bg-black">
          <video src={videoUrl} controls className="h-full w-full" controlsList="nodownload" />
        </div>
      </div>
    );
  }

  if (lesson.type === "PDF" && lesson.contentUrl) {
    return (
      <div className="space-y-4">
        <LessonVideoPlaceholder />
        <div className="overflow-hidden rounded-2xl border border-violet-100 shadow-sm">
          <iframe src={lesson.contentUrl} className="h-[65vh] w-full" title={lesson.title} />
        </div>
      </div>
    );
  }

  return <LessonVideoPlaceholder />;
}
