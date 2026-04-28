"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Circle,
  FileText,
  Play,
} from "lucide-react";
import type { LessonType } from "@prisma/client";
import { markLessonComplete } from "@/modules/courses/application/actions";
import { Progress } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { LearningArtwork } from "@/components/course/LearningArtwork";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  contentUrl: string | null;
  contentBody: string | null;
  duration: number | null;
  isFree: boolean;
  isLocked: boolean;
  orderIndex: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Props {
  course: { id: string; title: string; modules: Module[] };
  activeLesson: Lesson;
  completedIds: string[];
  progressPercent: number;
  studentId: string;
}

const lessonIcons: Record<string, React.ElementType> = {
  VIDEO: Play,
  TEXT: FileText,
  PDF: FileText,
  ASSIGNMENT: BookOpen,
  QUIZ: BookOpen,
  LIVE_SESSION: Play,
};

export function LearningPlayer({
  course,
  activeLesson,
  completedIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localCompleted, setLocalCompleted] = useState(new Set(completedIds));
  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(course.modules.map((module) => module.id)),
  );

  const allLessons = course.modules.flatMap((module) => module.lessons);
  const currentIndex = allLessons.findIndex((lesson) => lesson.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = localCompleted.has(activeLesson.id);

  const handleMarkComplete = () => {
    startTransition(async () => {
      const result = await markLessonComplete(activeLesson.id);
      if (result && "error" in result) {
        toast({ type: "error", title: result.error as string });
        return;
      }

      setLocalCompleted((prev) => new Set([...prev, activeLesson.id]));

      if (result?.courseCompleted) {
        toast({
          type: "success",
          title: "Course completed",
          description: "Your certificate is ready.",
        });
      } else {
        toast({ type: "success", title: "Lesson completed" });
        if (nextLesson) {
          router.push(`/student/courses/${course.id}/learn?lessonId=${nextLesson.id}`);
        }
      }
    });
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const completedCount = [...localCompleted].filter((id) =>
    allLessons.some((lesson) => lesson.id === id),
  ).length;
  const liveProgress = Math.round((completedCount / allLessons.length) * 100);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-violet-600">
        <div className="border-b border-slate-800 px-4 py-3">
          <Link
            href="/student"
            className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground/80 transition-colors hover:text-white"
          >
            <ChevronLeft size={14} /> Back to dashboard
          </Link>

          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{course.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <Progress
              value={liveProgress}
              className="h-1.5 flex-1 bg-slate-700 [&>div]:bg-emerald-400"
            />
            <span className="shrink-0 text-xs text-muted-foreground/80">{liveProgress}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {course.modules.map((module) => {
            const isOpen = openModules.has(module.id);
            const moduleCompleted = module.lessons.filter((lesson) => localCompleted.has(lesson.id)).length;

            return (
              <div key={module.id} className="border-b border-slate-800/50">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-violet-500/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">{module.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {moduleCompleted}/{module.lessons.length} lessons
                    </p>
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "ml-2 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="pb-1">
                    {module.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLesson.id;
                      const isDone = localCompleted.has(lesson.id);
                      const Icon = lessonIcons[lesson.type] ?? FileText;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/student/courses/${course.id}/learn?lessonId=${lesson.id}`}
                          className={cn(
                            "group flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors",
                            isActive
                              ? "bg-white/10 text-white"
                              : "text-muted-foreground/80 hover:bg-violet-500/50 hover:text-slate-200",
                          )}
                        >
                          <div className="w-4 shrink-0">
                            {isDone ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : isActive ? (
                              <Circle size={14} className="text-blue-400" />
                            ) : (
                              <Circle size={14} className="text-muted-foreground" />
                            )}
                          </div>
                          <Icon size={12} className="shrink-0 opacity-60" />
                          <span className="line-clamp-2 flex-1 text-xs leading-snug">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-violet-600 px-5">
          <div className="flex items-center gap-2">
            {prevLesson ? (
              <Link
                href={`/student/courses/${course.id}/learn?lessonId=${prevLesson.id}`}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground/80 transition-colors hover:bg-violet-500 hover:text-white"
              >
                <ArrowLeft size={12} /> Previous
              </Link>
            ) : null}
          </div>

          <p className="hidden text-xs text-muted-foreground/80 sm:block">
            {currentIndex + 1} / {allLessons.length}
          </p>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <button
                onClick={handleMarkComplete}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                {isPending ? "Saving..." : "Mark complete"}
              </button>
            ) : (
              <span className="flex items-center gap-1 px-2 text-xs text-emerald-400">
                <CheckCircle2 size={13} /> Completed
              </span>
            )}

            {nextLesson ? (
              <Link
                href={`/student/courses/${course.id}/learn?lessonId=${nextLesson.id}`}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground/80 transition-colors hover:bg-violet-500 hover:text-white"
              >
                Next <ArrowRight size={12} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950">
          <LessonContent lesson={activeLesson} />
        </div>
      </div>
    </div>
  );
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  if (lesson.type === "VIDEO" && lesson.contentUrl) {
    const isYoutube = lesson.contentUrl.includes("youtube") || lesson.contentUrl.includes("youtu.be");
    const embedUrl = isYoutube
      ? lesson.contentUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
      : null;

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 aspect-video overflow-hidden rounded-xl bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={lesson.contentUrl}
              controls
              className="h-full w-full"
              controlsList="nodownload"
            />
          )}
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">{lesson.title}</h1>
        {lesson.description ? (
          <p className="text-sm text-muted-foreground/80">{lesson.description}</p>
        ) : null}
      </div>
    );
  }

  if (lesson.type === "TEXT" || lesson.contentBody) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-6 overflow-hidden rounded-3xl">
          <LearningArtwork
            title={lesson.title}
            subtitle={lesson.description}
            badge="Article"
            className="min-h-[220px] w-full"
          />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-white">{lesson.title}</h1>
        <div
          className="prose prose-invert prose-sm max-w-none leading-relaxed text-muted-foreground/60"
          dangerouslySetInnerHTML={{ __html: lesson.contentBody ?? "" }}
        />
      </div>
    );
  }

  if (lesson.type === "PDF" && lesson.contentUrl) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 overflow-hidden rounded-3xl">
          <LearningArtwork
            title={lesson.title}
            subtitle={lesson.description}
            badge="PDF Lesson"
            className="min-h-[220px] w-full"
          />
        </div>
        <h1 className="mb-4 text-xl font-bold text-white">{lesson.title}</h1>
        <iframe src={lesson.contentUrl} className="h-[75vh] w-full rounded-xl border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl items-center justify-center p-8 text-muted-foreground/80">
      <div className="w-full">
        <div className="overflow-hidden rounded-3xl">
          <LearningArtwork
            title={lesson.title}
            subtitle={lesson.description ?? "Content is being prepared for this lesson."}
            badge="Lesson"
            className="min-h-[240px] w-full"
          />
        </div>
        <div className="mt-5 text-center">
          <p className="text-sm">{lesson.title}</p>
          <p className="mt-1 text-xs opacity-50">Content will be added soon</p>
        </div>
      </div>
    </div>
  );
}
