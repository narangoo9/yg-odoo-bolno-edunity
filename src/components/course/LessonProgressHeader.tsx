import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonRef {
  id: string;
  title: string;
}

interface LessonProgressHeaderProps {
  course: { id: string; title: string };
  prevLesson: LessonRef | null;
  nextLesson: LessonRef | null;
  currentIndex: number;
  totalLessons: number;
  isCompleted: boolean;
  isPending: boolean;
  onMarkComplete: () => void;
  showChat?: boolean;
  onToggleChat?: () => void;
}

export function LessonProgressHeader({
  course,
  prevLesson,
  nextLesson,
  currentIndex,
  totalLessons,
  isCompleted,
  isPending,
  onMarkComplete,
  showChat,
  onToggleChat,
}: LessonProgressHeaderProps) {
  const dotCount = Math.min(totalLessons, 12);

  return (
    <div className="shrink-0 border-b border-violet-100/60 bg-white px-5 py-3 shadow-[0_1px_0_0_rgba(124,58,237,0.05)]">
      {/* Breadcrumb */}
      <div className="mb-2.5 flex items-center gap-1 text-[11px] text-slate-400">
        <Link href="/student" className="transition-colors hover:text-violet-600">
          Dashboard
        </Link>
        <ChevronRight size={9} className="text-slate-300" />
        <Link href="/student/courses" className="transition-colors hover:text-violet-600">
          Lessons
        </Link>
        <ChevronRight size={9} className="text-slate-300" />
        <span className="max-w-[220px] truncate font-medium text-violet-600">
          {course.title}
        </span>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between gap-3">
        {/* Previous */}
        {prevLesson ? (
          <Link
            href={`/student/courses/${course.id}/learn?lessonId=${prevLesson.id}`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <ArrowLeft size={11} /> Previous
          </Link>
        ) : (
          <div className="w-20" />
        )}

        {/* Center: counter + segmented progress */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">
            Lesson {currentIndex + 1} of {totalLessons}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: dotCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i < currentIndex
                    ? "w-2.5 bg-emerald-400"
                    : i === currentIndex
                      ? "w-4 bg-violet-500"
                      : "w-1.5 bg-violet-200",
                )}
              />
            ))}
          </div>
        </div>

        {/* Right: status + next + chat toggle */}
        <div className="flex shrink-0 items-center gap-2">
          {isCompleted ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200/80">
              <CheckCircle2 size={11} /> Дууссан
            </span>
          ) : (
            <button
              onClick={onMarkComplete}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={11} />
              {isPending ? "Хадгалж байна..." : "Хичээл дуусгасан гэж тэмдэглэх"}
            </button>
          )}

          {nextLesson ? (
            <Link
              href={`/student/courses/${course.id}/learn?lessonId=${nextLesson.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-violet-200 transition-all hover:bg-violet-500"
            >
              Дараагийн хичээл <ArrowRight size={11} />
            </Link>
          ) : null}

          {onToggleChat && (
            <button
              onClick={onToggleChat}
              title={showChat ? "Chat хаах" : "Chat нээх"}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all active:scale-95",
                showChat
                  ? "border-violet-300 bg-violet-600 text-white hover:bg-violet-500"
                  : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
              )}
            >
              <MessageCircle size={11} />
              Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
