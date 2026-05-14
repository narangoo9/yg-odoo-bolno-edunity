"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileText } from "lucide-react";
import type { LessonType } from "@prisma/client";
import { markLessonComplete, markLessonSectionComplete } from "@/modules/courses/application/actions";
import { toast } from "@/components/ui/toaster";
import { CourseOutlinePanel } from "@/components/course/CourseOutlinePanel";
import { LessonProgressHeader } from "@/components/course/LessonProgressHeader";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import { LessonTabs } from "@/components/course/LessonTabs";
import { YouTubeSectionPlayer } from "@/components/lesson/YouTubeSectionPlayer";
import { LessonChat } from "@/components/lesson/LessonChat";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  contentUrl: string | null;
  contentBody: string | null;
  duration: number | null;
  videoType?: "NONE" | "YOUTUBE" | "UPLOAD" | null;
  videoUrl?: string | null;
  videoProvider?: "YOUTUBE" | "CUSTOM" | null;
  sourceCreditName?: string | null;
  sourceCreditUrl?: string | null;
  isFree: boolean;
  isLocked: boolean;
  orderIndex: number;
  sections?: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    youtubeId: string;
    startSeconds: number;
    endSeconds: number;
    taskTitle: string | null;
    taskDescription: string | null;
    pdfUrl: string | null;
    resourceUrl: string | null;
    completions?: Array<{ id: string; completedAt: Date }>;
  }>;
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

export function LearningPlayer({ course, activeLesson, completedIds, studentId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localCompleted, setLocalCompleted] = useState(new Set(completedIds));
  const [showChat, setShowChat] = useState(false);
  const sections = useMemo(
    () => [...(activeLesson.sections ?? [])].sort((a, b) => a.order - b.order),
    [activeLesson],
  );
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sections[0]?.id ?? null);
  const [completedSectionIds, setCompletedSectionIds] = useState(
    () => new Set(sections.filter((section) => section.completions?.length).map((section) => section.id)),
  );

  useEffect(() => {
    setActiveSectionId(sections[0]?.id ?? null);
    setCompletedSectionIds(new Set(sections.filter((section) => section.completions?.length).map((section) => section.id)));
  }, [activeLesson.id, sections]);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = localCompleted.has(activeLesson.id);
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null;
  const activeSectionIndex = activeSection
    ? sections.findIndex((section) => section.id === activeSection.id)
    : -1;
  const prevSection = activeSectionIndex > 0 ? sections[activeSectionIndex - 1] : null;
  const nextSection =
    activeSectionIndex >= 0 && activeSectionIndex < sections.length - 1
      ? sections[activeSectionIndex + 1]
      : null;
  const sectionProgress =
    sections.length > 0 ? Math.round((completedSectionIds.size / sections.length) * 100) : 0;

  const completedCount = [...localCompleted].filter((id) =>
    allLessons.some((l) => l.id === id),
  ).length;
  const liveProgress =
    allLessons.length > 0
      ? Math.round((completedCount / allLessons.length) * 100)
      : 0;

  const handleMarkComplete = () => {
    setLocalCompleted((prev) => new Set([...prev, activeLesson.id]));
    startTransition(async () => {
      const result = await markLessonComplete(activeLesson.id);
      if (result && "error" in result) {
        setLocalCompleted((prev) => {
          const next = new Set(prev);
          next.delete(activeLesson.id);
          return next;
        });
        toast({ type: "error", title: result.error as string });
        return;
      }

      if (result?.courseCompleted) {
        toast({
          type: "success",
          title: "Курс дууслаа!",
          description: "Сертификат бэлэн боллоо.",
        });
      } else {
        toast({ type: "success", title: "Хичээл дууслаа" });
        if (nextLesson) {
          router.push(`/student/courses/${course.id}/learn?lessonId=${nextLesson.id}`);
        }
      }
    });
  };

  const handleSectionComplete = (sectionId: string, advance = false) => {
    setCompletedSectionIds((prev) => new Set([...prev, sectionId]));
    startTransition(async () => {
      const result = await markLessonSectionComplete({ sectionId });
      if (result && "error" in result) {
        setCompletedSectionIds((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
        toast({ type: "error", title: result.error as string });
        return;
      }

      if (result?.lessonCompleted) {
        setLocalCompleted((prev) => new Set([...prev, activeLesson.id]));
      }

      if (advance && nextSection) {
        setActiveSectionId(nextSection.id);
      } else if (result?.lessonCompleted && nextLesson) {
        toast({ type: "success", title: "Хичээлийн бүх section дууслаа" });
      }
    });
  };

  return (
    <div className="-m-5 flex h-[calc(100vh-4rem)] overflow-hidden">
      <CourseOutlinePanel
        course={course}
        activeLesson={activeLesson}
        completedIds={localCompleted}
        progressPercent={liveProgress}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F4FF]">
        <LessonProgressHeader
          course={course}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          currentIndex={currentIndex}
          totalLessons={allLessons.length}
          isCompleted={isCompleted}
          isPending={isPending}
          onMarkComplete={handleMarkComplete}
          showChat={showChat}
          onToggleChat={() => setShowChat((v) => !v)}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-5 p-5">
            {activeSection ? (
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-violet-600">Sections</p>
                      <p className="text-[11px] text-slate-500">{completedSectionIds.size}/{sections.length} completed</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-700">
                      {sectionProgress}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sections.map((section, index) => {
                      const selected = section.id === activeSection.id;
                      const done = completedSectionIds.has(section.id);
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSectionId(section.id)}
                          className={cn(
                            "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                            selected
                              ? "border-violet-300 bg-violet-50 text-violet-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-400">Section {index + 1}</span>
                            {done ? <CheckCircle2 size={13} className="text-emerald-500" /> : null}
                          </div>
                          <p className="mt-1 text-xs font-bold leading-snug">{section.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {Math.floor(section.startSeconds / 60)}:{String(section.startSeconds % 60).padStart(2, "0")}-
                            {Math.floor(section.endSeconds / 60)}:{String(section.endSeconds % 60).padStart(2, "0")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="space-y-4">
                  <YouTubeSectionPlayer
                    key={activeSection.id}
                    videoId={activeSection.youtubeId}
                    startSeconds={activeSection.startSeconds}
                    endSeconds={activeSection.endSeconds}
                    title={activeSection.title}
                    onEnded={() => handleSectionComplete(activeSection.id)}
                  />

                  <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase text-violet-600">Current section</p>
                    <h2 className="mt-1 text-lg font-black text-slate-900">{activeSection.title}</h2>
                    {activeSection.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{activeSection.description}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase text-emerald-700">Task</p>
                      <h3 className="mt-1 text-sm font-black text-slate-900">
                        {activeSection.taskTitle ?? "Section task"}
                      </h3>
                      {activeSection.taskDescription ? (
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                          {activeSection.taskDescription}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">Resource</p>
                      {activeSection.pdfUrl || activeSection.resourceUrl ? (
                        <a
                          href={activeSection.pdfUrl ?? activeSection.resourceUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          <Download size={14} />
                          Open resource
                        </a>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                          <FileText size={15} /> No resource attached
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={!prevSection}
                      onClick={() => prevSection && setActiveSectionId(prevSection.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
                    >
                      <ArrowLeft size={14} /> Previous section
                    </button>
                    <div className="flex items-center gap-2">
                      {!completedSectionIds.has(activeSection.id) ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSectionComplete(activeSection.id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Mark section done
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={!nextSection}
                        onClick={() => {
                          if (!nextSection) return;
                          if (!completedSectionIds.has(activeSection.id)) {
                            handleSectionComplete(activeSection.id, true);
                          } else {
                            setActiveSectionId(nextSection.id);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Next section <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <LessonPlayer lesson={activeLesson} />
            )}

            <div>
              <h1 className="text-[19px] font-black leading-snug text-slate-900">
                {activeLesson.title}
              </h1>
              {activeLesson.description ? (
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                  {activeLesson.description}
                </p>
              ) : null}
            </div>

            <LessonTabs lesson={activeLesson} />

            <div className="flex items-center justify-between border-t border-violet-100 pb-6 pt-5">
              {prevLesson ? (
                <Link
                  href={`/student/courses/${course.id}/learn?lessonId=${prevLesson.id}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  <ArrowLeft size={14} /> Өмнөх хичээл
                </Link>
              ) : (
                <div />
              )}

              {!isCompleted ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {isPending ? "Хадгалж байна..." : "Хичээл дуусгасан гэж тэмдэглэх"}
                </button>
              ) : (
                <span className="flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-[13px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                  <CheckCircle2 size={14} /> Дууссан
                </span>
              )}

              {nextLesson ? (
                <Link
                  href={`/student/courses/${course.id}/learn?lessonId=${nextLesson.id}`}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-violet-200 transition-all hover:bg-violet-500"
                >
                  Дараагийн хичээл <ArrowRight size={14} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      </div>

      {showChat && (
        <LessonChat
          courseId={course.id}
          lessonId={activeLesson.id}
          lessonTitle={activeLesson.title}
          currentUserId={studentId}
        />
      )}
    </div>
  );
}
