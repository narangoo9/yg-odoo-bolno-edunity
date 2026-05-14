"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Focus,
  Lock,
  NotebookPen,
  Play,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { UpgradeModal } from "@/components/marketplace/UpgradeModal";
import { YouTubeSectionPlayer } from "@/components/lesson/YouTubeSectionPlayer";
import {
  canAccessLearningItem,
  getAllowedLearningItemCount,
  getRequiredPlanForIndex,
  type MarketplacePlan,
} from "@/lib/marketplace-access";
import { usePersistentVideoStore } from "@/lib/learning-player-store";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/lib/youtube-course";

interface CourseSection {
  id: string;
  title: string;
  order: number;
  startSeconds: number;
  endSeconds: number | null;
}

interface TimestampNote {
  id: string;
  sectionId: string;
  seconds: number;
  text: string;
  createdAt: string;
}

type TabId = "overview" | "description" | "tasks" | "notes";
type TaskState = "not-started" | "draft" | "submitted" | "completed";

interface Props {
  course: {
    id: string;
    title: string;
    sourceYoutubeId: string;
    sections: CourseSection[];
  };
  accessPlan?: MarketplacePlan;
}

const tabs: Array<{ id: TabId; label: string; icon: typeof BookOpen }> = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "description", label: "Description", icon: Sparkles },
  { id: "tasks", label: "Tasks", icon: ClipboardCheck },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function groupIntoChapters(sections: CourseSection[]) {
  const groups: Array<{ id: string; title: string; sections: CourseSection[]; start: number; end: number | null }> = [];

  const chapterSize = sections.length > 36 ? 8 : 6;
  for (let index = 0; index < sections.length; index += chapterSize) {
    const items = sections.slice(index, index + chapterSize);
    groups.push({
      id: `chapter-${groups.length + 1}`,
      title: `Chapter ${groups.length + 1}`,
      sections: items,
      start: items[0]?.startSeconds ?? 0,
      end: items.at(-1)?.endSeconds ?? null,
    });
  }

  return groups;
}

function statusText(status: TaskState) {
  if (status === "draft") return "Draft";
  if (status === "submitted") return "Submitted";
  if (status === "completed") return "Completed";
  return "Not started";
}

function planLabel(plan: MarketplacePlan) {
  return plan === "ALL_ACCESS" ? "PREMIUM" : plan;
}

function sectionRange(section: CourseSection) {
  return `${formatSeconds(section.startSeconds)}${section.endSeconds != null ? ` - ${formatSeconds(section.endSeconds)}` : ""}`;
}

export function YouTubeCoursePlayer({ course, accessPlan = "FREE" }: Props) {
  const pathname = usePathname();
  const storagePrefix = `edunity-course-player:${course.id}`;
  const setPersistentVideo = usePersistentVideoStore((state) => state.setVideo);
  const updatePersistentTimestamp = usePersistentVideoStore((state) => state.updateTimestamp);
  const setPersistentPlaying = usePersistentVideoStore((state) => state.setPlaying);
  const setPersistentMinimized = usePersistentVideoStore((state) => state.setMinimized);

  const sections = useMemo(
    () => [...course.sections].sort((a, b) => a.order - b.order || a.startSeconds - b.startSeconds),
    [course.sections],
  );

  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [openChapterId, setOpenChapterId] = useState("chapter-1");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [focusMode, setFocusMode] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(sections[0]?.startSeconds ?? 0);
  const [storageReady, setStorageReady] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(() => new Set());
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [notes, setNotes] = useState<TimestampNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  const activeSection = sections.find((section) => section.id === activeId) ?? sections[0];
  const activeIndex = activeSection ? sections.findIndex((section) => section.id === activeSection.id) : -1;
  const nextSection = activeIndex >= 0 && activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;
  const chapters = useMemo(() => groupIntoChapters(sections), [sections]);
  const activeChapter = chapters.find((chapter) => chapter.sections.some((section) => section.id === activeSection?.id));
  const watchedPercent = sections.length > 0 ? Math.round((completedSections.size / sections.length) * 100) : 0;
  const allowedSectionCount = getAllowedLearningItemCount(accessPlan, sections.length);
  const estimatedDuration = formatSeconds(sections.at(-1)?.endSeconds ?? sections.at(-1)?.startSeconds ?? 0);
  const activeTaskState = taskStates[activeSection?.id ?? ""] ?? "not-started";

  useEffect(() => {
    if (activeChapter) setOpenChapterId(activeChapter.id);
  }, [activeChapter?.id]);

  useEffect(() => {
    setCompletedSections(new Set(readJson<string[]>(`${storagePrefix}:completed-sections`, [])));
    setTaskStates(readJson<Record<string, TaskState>>(`${storagePrefix}:tasks`, {}));
    setNotes(readJson<TimestampNote[]>(`${storagePrefix}:notes`, []));
    setStorageReady(true);
  }, [storagePrefix]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(`${storagePrefix}:completed-sections`, JSON.stringify([...completedSections]));
  }, [completedSections, storagePrefix, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(`${storagePrefix}:tasks`, JSON.stringify(taskStates));
  }, [taskStates, storagePrefix, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(`${storagePrefix}:notes`, JSON.stringify(notes));
  }, [notes, storagePrefix, storageReady]);

  useEffect(() => {
    if (!activeSection) return;

    setPersistentVideo({
      courseId: course.id,
      lessonUrl: pathname,
      lessonTitle: course.title,
      sectionTitle: activeSection.title,
      videoId: course.sourceYoutubeId,
      timestamp: currentSeconds,
      isPlaying: true,
    });

    return () => {
      setPersistentMinimized(true);
    };
  }, [
    activeSection,
    course.id,
    course.sourceYoutubeId,
    course.title,
    currentSeconds,
    pathname,
    setPersistentMinimized,
    setPersistentVideo,
  ]);

  if (!activeSection) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        This course does not have timestamp sections yet.
      </div>
    );
  }

  const filteredChapters = chapters
    .map((chapter) => ({
      ...chapter,
      sections: chapter.sections.filter((section) => section.title.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((chapter) => chapter.sections.length > 0);

  const setTaskState = (sectionId: string, state: TaskState) => {
    setTaskStates((current) => ({ ...current, [sectionId]: state }));
  };

  const completeActiveSection = () => {
    setCompletedSections((current) => new Set([...current, activeSection.id]));
    setTaskState(activeSection.id, "completed");
  };

  const addTimestampNote = () => {
    if (!noteDraft.trim()) return;
    setNotes((current) => [
      {
        id: crypto.randomUUID(),
        sectionId: activeSection.id,
        seconds: Math.floor(currentSeconds),
        text: noteDraft.trim(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setNoteDraft("");
  };

  const selectSection = (section: CourseSection, seconds = section.startSeconds) => {
    const sectionIndex = sections.findIndex((item) => item.id === section.id);
    if (!canAccessLearningItem(accessPlan, sectionIndex, sections.length)) {
      const requiredPlan = getRequiredPlanForIndex(sectionIndex, sections.length);
      setUpgradeReason(
        requiredPlan === "PRO"
          ? "This section requires Pro access. Upgrade to unlock the full course, final tasks, reviews, and certificate."
          : "Your free preview is finished. Upgrade to Standard or Pro to continue the course.",
      );
      return;
    }

    setActiveId(section.id);
    setCurrentSeconds(seconds);
    updatePersistentTimestamp(seconds);
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        focusMode ? "fixed inset-0 z-50 bg-[#F8F5FF]" : "-m-5 h-[calc(100vh-4rem)]",
      )}
    >
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-violet-100 bg-gradient-to-r from-white via-white to-violet-50/80 px-6 py-4 shadow-[0_1px_0_0_rgba(124,58,237,0.07)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-violet-500">Course Player</p>
            <h1 className="mt-1 max-w-xl text-xl font-black leading-tight text-slate-900">{course.title}</h1>
            <p className="mt-1 text-[13px] text-slate-400">
              Continue from Section {activeSection.order} at {formatSeconds(currentSeconds)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => selectSection(activeSection, currentSeconds)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-[13px] font-black text-white shadow-sm shadow-violet-200 transition-colors hover:bg-violet-500 active:scale-95"
            >
              <Play size={14} /> Continue Learning
            </button>
            <button
              type="button"
              onClick={() => setFocusMode((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-[13px] font-black text-violet-700 transition-colors hover:bg-violet-50 active:scale-95"
            >
              <Focus size={14} /> {focusMode ? "Exit Focus" : "Focus Mode"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: focusMode ? "minmax(0,1fr)" : "400px minmax(0,1fr)",
          gridTemplateRows: "1fr",
        }}
      >
        {/* Left panel */}
        {!focusMode ? (
          <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-violet-100 bg-[#FAF8FF]">
            {/* Progress card */}
            <div className="shrink-0 border-b border-violet-100 bg-white px-4 pb-4 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-black text-slate-700">Watch progress</span>
                <span className="text-[13px] font-black text-violet-700">{watchedPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all"
                  style={{ width: `${watchedPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {completedSections.size} of {sections.length} sections completed
              </p>
            </div>

            {/* Search */}
            <div className="shrink-0 border-b border-violet-100 bg-white px-3 py-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search sections…"
                  className="h-9 w-full rounded-lg border border-violet-100 bg-violet-50/60 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-200/60"
                />
              </div>
            </div>

            {/* Chapter accordion */}
            <div className="flex flex-col divide-y divide-violet-50">
              {filteredChapters.map((chapter) => {
                const open = query.trim().length > 0 || openChapterId === chapter.id;
                const doneInChapter = chapter.sections.filter((section) => completedSections.has(section.id)).length;

                return (
                  <div key={chapter.id} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenChapterId(openChapterId === chapter.id ? "" : chapter.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-violet-50/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-black text-slate-800">{chapter.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatSeconds(chapter.start)} – {formatSeconds(chapter.end)} · {doneInChapter}/{chapter.sections.length} done
                        </p>
                      </div>
                      <ChevronDown
                        size={15}
                        className={cn("shrink-0 text-violet-400 transition-transform", open && "rotate-180")}
                      />
                    </button>

                    {open ? (
                      <div className="border-t border-violet-50">
                        {chapter.sections.map((section) => {
                          const selected = section.id === activeSection.id;
                          const done = completedSections.has(section.id);
                          const taskState = taskStates[section.id] ?? "not-started";
                          const sectionIndex = sections.findIndex((item) => item.id === section.id);
                          const locked = !canAccessLearningItem(accessPlan, sectionIndex, sections.length);

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => selectSection(section)}
                              className={cn(
                                "group relative w-full border-b border-violet-50 px-4 py-3 text-left last:border-b-0 transition-colors",
                                selected
                                  ? "bg-violet-50/80"
                                  : locked
                                    ? "opacity-60 hover:bg-slate-50"
                                    : "hover:bg-violet-50/40",
                              )}
                            >
                              {selected && (
                                <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-violet-500" />
                              )}
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                                    done
                                      ? "bg-emerald-500 text-white"
                                      : locked
                                        ? "bg-slate-200 text-slate-400"
                                        : selected
                                          ? "bg-violet-600 text-white"
                                          : "bg-violet-100 text-violet-700",
                                  )}
                                >
                                  {done ? <CheckCircle2 size={13} /> : locked ? <Lock size={12} /> : section.order}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "line-clamp-1 text-[13px] font-bold leading-snug",
                                      selected ? "text-violet-900" : locked ? "text-slate-400" : "text-slate-800",
                                    )}
                                  >
                                    {section.title}
                                  </p>
                                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">{sectionRange(section)}</p>
                                </div>
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                                    locked
                                      ? "bg-slate-100 text-slate-400"
                                      : done
                                        ? "bg-emerald-50 text-emerald-600"
                                        : taskState === "submitted"
                                          ? "bg-amber-50 text-amber-600"
                                          : taskState === "draft"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-slate-100 text-slate-500",
                                  )}
                                >
                                  {locked ? "Locked" : statusText(taskState)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </aside>
        ) : null}

        {/* Right panel */}
        <main className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-[#F8F5FF] p-4 lg:p-5">
          {/* Video */}
          <div className="w-full max-w-[640px]">
            <YouTubeSectionPlayer
              key={activeSection.id}
              videoId={course.sourceYoutubeId}
              startSeconds={activeSection.startSeconds}
              endSeconds={activeSection.endSeconds}
              title={activeSection.title}
              onEnded={() => {
                completeActiveSection();
                if (nextSection) selectSection(nextSection);
              }}
              onProgress={(seconds) => {
                setCurrentSeconds(seconds);
                updatePersistentTimestamp(seconds);
              }}
              onPlayingChange={setPersistentPlaying}
            />
          </div>

          {/* Now Watching + Access Plan */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Now Watching */}
            <section className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-4 shadow-md shadow-violet-200">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">Now Watching</p>
              <h2 className="mt-2 line-clamp-2 pr-10 text-[16px] font-black leading-snug text-white">
                {activeSection.title}
              </h2>
              <p className="mt-1.5 text-[12px] text-violet-300">
                Section {activeSection.order} · {sectionRange(activeSection)}
              </p>
              <span className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-[15px] font-black text-white">
                {activeSection.order}
              </span>
            </section>

            {/* Access Plan */}
            <section
              className={cn(
                "min-w-0 rounded-2xl border p-4 shadow-sm",
                accessPlan === "FREE"
                  ? "border-slate-200 bg-slate-50"
                  : accessPlan === "PRO"
                    ? "border-amber-200 bg-amber-50"
                    : accessPlan === "ALL_ACCESS"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-violet-200 bg-violet-50",
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Access Plan</p>
              <div className="mt-2.5 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    accessPlan === "FREE"
                      ? "bg-slate-200 text-slate-500"
                      : accessPlan === "PRO"
                        ? "bg-amber-200 text-amber-700"
                        : accessPlan === "ALL_ACCESS"
                          ? "bg-emerald-200 text-emerald-700"
                          : "bg-violet-200 text-violet-700",
                  )}
                >
                  {accessPlan === "FREE" ? <Lock size={18} /> : <Award size={18} />}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[15px] font-black",
                      accessPlan === "FREE"
                        ? "text-slate-700"
                        : accessPlan === "PRO"
                          ? "text-amber-700"
                          : accessPlan === "ALL_ACCESS"
                            ? "text-emerald-700"
                            : "text-violet-700",
                    )}
                  >
                    {planLabel(accessPlan)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {allowedSectionCount}/{sections.length} sections unlocked
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Tabs */}
          <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
            <div className="flex gap-1 overflow-x-auto bg-violet-50/60 p-1.5">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-black transition-all",
                    tab === id
                      ? "bg-white text-violet-700 shadow-sm shadow-violet-100"
                      : "text-slate-500 hover:text-violet-600",
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === "overview" ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Sections", value: `${sections.length}`, color: "from-violet-500 to-violet-600", light: "bg-violet-50 text-violet-600" },
                    { label: "Completed", value: `${completedSections.size}`, color: "from-emerald-500 to-emerald-600", light: "bg-emerald-50 text-emerald-600" },
                    { label: "Duration", value: estimatedDuration, color: "from-amber-500 to-amber-600", light: "bg-amber-50 text-amber-600" },
                  ].map(({ label, value, color, light }) => (
                    <div key={label} className="overflow-hidden rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <span className={cn("inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", light)}>
                        {label}
                      </span>
                      <p className={cn("mt-2 bg-gradient-to-r bg-clip-text text-[26px] font-black text-transparent", color)}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {tab === "description" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{activeSection.title}</h3>
                    <p className="mt-3 text-[14px] leading-7 text-slate-600">
                      This player turns the course video into section-based learning. Use the chapter list to jump between
                      timestamps, complete tasks, and save timestamp notes while studying.
                    </p>
                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-[13px] font-black text-violet-700">Current section</p>
                      <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                        Section {activeSection.order} covers <span className="font-bold">{activeSection.title}</span> from{" "}
                        {sectionRange(activeSection)}.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      ["Course", course.title],
                      ["Progress", `${completedSections.size}/${sections.length} completed`],
                      ["Access", `${allowedSectionCount}/${sections.length} unlocked`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-violet-100 p-3.5">
                        <p className="text-[10px] font-black uppercase tracking-wide text-violet-600">{label}</p>
                        <p className="mt-1.5 text-[13px] font-bold text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "tasks" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">Section task</p>
                        <h3 className="mt-2 text-[17px] font-black text-slate-900">{activeSection.title}</h3>
                        <p className="mt-2 text-[13px] leading-6 text-slate-600">
                          Mark your work as draft, submitted, or completed. Completion also updates the watch progress.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-violet-700 shadow-sm">
                        {statusText(activeTaskState)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setTaskState(activeSection.id, "draft")}
                        className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-[13px] font-black text-violet-700 hover:bg-violet-50"
                      >
                        Save draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskState(activeSection.id, "submitted")}
                        className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-[13px] font-black text-violet-700 hover:bg-violet-50"
                      >
                        Submit
                      </button>
                      <button
                        type="button"
                        onClick={completeActiveSection}
                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-black text-white hover:bg-violet-500"
                      >
                        Complete
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-white p-4">
                    <p className="text-[11px] font-black uppercase tracking-wide text-violet-600">Next step</p>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600">
                      {nextSection
                        ? `After finishing, continue to Section ${nextSection.order}: ${nextSection.title}.`
                        : "This is the final section in the course."}
                    </p>
                    {nextSection ? (
                      <button
                        type="button"
                        onClick={() => selectSection(nextSection)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-black text-white hover:bg-slate-800"
                      >
                        <Play size={14} /> Next section
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {tab === "notes" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div>
                    <textarea
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder={`Write a note at ${formatSeconds(currentSeconds)}`}
                      className="min-h-[140px] w-full resize-none rounded-xl border border-violet-100 bg-violet-50 p-4 text-[14px] outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
                    />
                    <button
                      type="button"
                      onClick={addTimestampNote}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-black text-white hover:bg-violet-500"
                    >
                      <Send size={14} /> Save timestamp note
                    </button>
                  </div>

                  <div className="flex max-h-[320px] flex-col gap-2.5 overflow-y-auto pr-1">
                    {notes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4 text-[13px] text-slate-500">
                        No notes yet.
                      </div>
                    ) : null}
                    {notes.map((note) => {
                      const noteSection = sections.find((section) => section.id === note.sectionId);
                      return (
                        <div key={note.id} className="rounded-xl border border-violet-100 bg-white p-3.5">
                          <button
                            type="button"
                            onClick={() => noteSection && selectSection(noteSection, note.seconds)}
                            className="w-full text-left"
                          >
                            <p className="font-mono text-[11px] font-black text-violet-700">
                              {noteSection ? `Section ${noteSection.order}` : "Section"} · {formatSeconds(note.seconds)}
                            </p>
                            <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{note.text}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))}
                            className="mt-2 text-[11px] font-black text-slate-400 hover:text-rose-600"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>

      <UpgradeModal
        open={upgradeReason != null}
        reason={upgradeReason ?? undefined}
        requiredPlan={upgradeReason?.includes("Pro") ? "PRO" : "STANDARD"}
        onClose={() => setUpgradeReason(null)}
      />
    </div>
  );
}
