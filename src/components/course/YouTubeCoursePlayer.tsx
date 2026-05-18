"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { CourseProgressPanel } from "@/components/course/CourseProgressPanel";
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
import { WATCH_COMPLETION_RATIO, sectionDurationSeconds } from "@/lib/learning/section-watch-utils";
import { FinalProjectPanel } from "@/components/course/FinalProjectPanel";
import { LearningJourneyGuide } from "@/components/course/LearningJourneyGuide";
import {
  assertMongolianSpellOk,
  MongolianSpellTextarea,
} from "@/components/mongolian/MongolianSpellTextarea";

interface CourseSection {
  id: string;
  title: string;
  order: number;
  startSeconds: number;
  endSeconds: number | null;
}

interface TimestampNote {
  id: string;
  sectionId: string | null;
  seconds: number;
  content: string;
  createdAt: string;
}

type TabId = "overview" | "description" | "tasks" | "notes";
type TaskState = "not-started" | "draft" | "submitted" | "completed";

interface TaskSubmission {
  id: string;
  status: string;
  score: number | null;
  submittedAt: string;
  reviewCount: number;
  completedReviewCount: number;
}

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
  if (plan === "PRO") return "Pro";
  if (plan === "PREMIUM") return "Premium";
  return "Standard";
}

function sectionRange(section: CourseSection) {
  return `${formatSeconds(section.startSeconds)}${section.endSeconds != null ? ` - ${formatSeconds(section.endSeconds)}` : ""}`;
}

function firstAccessibleSectionId(sections: CourseSection[], accessPlan: MarketplacePlan) {
  for (let index = 0; index < sections.length; index++) {
    if (canAccessLearningItem(accessPlan, index, sections.length)) {
      return sections[index]!.id;
    }
  }
  return sections[0]?.id ?? "";
}

function sectionIndexOf(sections: CourseSection[], sectionId: string) {
  return sections.findIndex((section) => section.id === sectionId);
}

/** Stops playback at section boundary when DB endSeconds is null */
function getEffectiveEndSeconds(section: CourseSection, sections: CourseSection[]) {
  if (section.endSeconds != null) return section.endSeconds;
  const index = sectionIndexOf(sections, section.id);
  const next = index >= 0 ? sections[index + 1] : undefined;
  if (next) return Math.max(section.startSeconds + 1, next.startSeconds - 1);
  return section.startSeconds + 900;
}

function lockedSectionMessage(sectionIndex: number, totalSections: number) {
  const requiredPlan = getRequiredPlanForIndex(sectionIndex, totalSections);
  return requiredPlan === "PRO"
    ? "Дараагийн хэсэг Pro багцад нээгдэнэ. Багцаа ахиулна уу?"
    : "Дараагийн хэсэг түгжээтэй. Premium аваад курсын 50%-ийг үргэлжлүүлэн үзнэ үү?";
}

function resumeSecondsForSection(
  section: CourseSection,
  sections: CourseSection[],
  watchProgress: Record<string, { lastPositionSec: number; watchTimeSec: number }>,
  explicitSeconds?: number,
) {
  if (explicitSeconds != null && explicitSeconds > section.startSeconds + 1) {
    const end = getEffectiveEndSeconds(section, sections);
    return Math.min(explicitSeconds, Math.max(section.startSeconds, end - 1));
  }
  const saved = watchProgress[section.id]?.lastPositionSec;
  if (saved != null && saved > section.startSeconds + 2) {
    const end = getEffectiveEndSeconds(section, sections);
    return Math.min(saved, Math.max(section.startSeconds, end - 1));
  }
  return section.startSeconds;
}

export function YouTubeCoursePlayer({ course, accessPlan = "STANDARD" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const storagePrefix = `edunity-course-player:${course.id}`;
  const setPersistentVideo = usePersistentVideoStore((state) => state.setVideo);
  const updatePersistentTimestamp = usePersistentVideoStore((state) => state.updateTimestamp);
  const setPersistentPlaying = usePersistentVideoStore((state) => state.setPlaying);
  const setPersistentMinimized = usePersistentVideoStore((state) => state.setMinimized);

  const sections = useMemo(
    () => [...course.sections].sort((a, b) => a.order - b.order || a.startSeconds - b.startSeconds),
    [course.sections],
  );

  const [activeId, setActiveId] = useState(() => firstAccessibleSectionId(sections, accessPlan));
  const [openChapterId, setOpenChapterId] = useState("chapter-1");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [focusMode, setFocusMode] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(sections[0]?.startSeconds ?? 0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(() => new Set());
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [taskSubmissions, setTaskSubmissions] = useState<Record<string, TaskSubmission>>({});
  const [taskDraft, setTaskDraft] = useState("");
  const [taskUrl, setTaskUrl] = useState("");
  const [taskSubmitError, setTaskSubmitError] = useState<string | null>(null);
  const [taskSubmitSuccess, setTaskSubmitSuccess] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [certificate, setCertificate] = useState<{ id: string; certificateNo: string; verificationCode: string } | null>(null);
  const [finalProject, setFinalProject] = useState<{
    unlocked: boolean;
    lessonsComplete: boolean;
    reviewsGiven: number;
    reviewsRequired: number;
    submission: {
      id: string;
      title: string;
      description: string;
      demoUrl: string | null;
      githubUrl: string | null;
      status: string;
      reviewCount: number;
      passed: boolean;
      reviews: Array<{ starRating: number; decision: string; feedback: string }>;
    } | null;
  } | null>(null);
  const [sectionWatchPercent, setSectionWatchPercent] = useState(0);
  const [notes, setNotes] = useState<TimestampNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [sectionCompleteError, setSectionCompleteError] = useState<string | null>(null);
  const [watchProgressMap, setWatchProgressMap] = useState<
    Record<string, { lastPositionSec: number; watchTimeSec: number }>
  >({});
  const [playerSeekSeconds, setPlayerSeekSeconds] = useState(sections[0]?.startSeconds ?? 0);
  const [progressHydrated, setProgressHydrated] = useState(false);

  const activeSection = sections.find((section) => section.id === activeId) ?? sections[0];
  const activeIndex = activeSection ? sections.findIndex((section) => section.id === activeSection.id) : -1;
  const nextSection = activeIndex >= 0 && activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;
  const chapters = useMemo(() => groupIntoChapters(sections), [sections]);
  const activeChapter = chapters.find((chapter) => chapter.sections.some((section) => section.id === activeSection?.id));
  const watchedPercent = sections.length > 0 ? Math.round((completedSections.size / sections.length) * 100) : 0;
  const peerReviewPending = useMemo(
    () =>
      Object.values(taskSubmissions).some(
        (s) => s.status === "SUBMITTED" || s.status === "PENDING_REVIEW",
      ),
    [taskSubmissions],
  );
  const allSectionsComplete = sections.length > 0 && completedSections.size >= sections.length;
  const gradedTasks = Object.values(taskSubmissions).filter((s) => s.status === "GRADED").length;
  const submittedTasks = Object.values(taskSubmissions).filter(
    (s) => s.status === "SUBMITTED" || s.status === "PENDING_REVIEW" || s.status === "GRADED",
  ).length;
  const certificateReadiness = Math.min(
    100,
    Math.round(watchedPercent * 0.5 + (gradedTasks > 0 ? 25 : 0) + (certificate ? 25 : 0)),
  );
  const allowedSectionCount = getAllowedLearningItemCount(accessPlan, sections.length);
  const estimatedDuration = formatSeconds(sections.at(-1)?.endSeconds ?? sections.at(-1)?.startSeconds ?? 0);
  const activeTaskState = taskStates[activeSection?.id ?? ""] ?? "not-started";
  const activeTaskSubmission = taskSubmissions[activeSection?.id ?? ""];
  const activeSectionCompleted = activeSection ? completedSections.has(activeSection.id) : false;

  // Mutable refs updated each render so callbacks always see fresh values
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;
  const currentSecondsRef = useRef(currentSeconds);
  currentSecondsRef.current = currentSeconds;
  const completedSectionsRef = useRef(completedSections);
  completedSectionsRef.current = completedSections;

  // Watch progress accumulation
  const watchDeltaRef = useRef(0);
  const prevProgressSecondsRef = useRef<number | null>(null);
  const lastWatchFlushRef = useRef(0);
  const sectionEndHandledRef = useRef(false);

  const effectiveEndSeconds = useMemo(
    () => (activeSection ? getEffectiveEndSeconds(activeSection, sections) : 0),
    [activeSection, sections],
  );

  const flushWatchProgress = useCallback(async (): Promise<boolean> => {
    const section = activeSectionRef.current;
    if (!section) return true;
    const delta = Math.min(Math.floor(watchDeltaRef.current), 3600);
    const lastPos = Math.floor(currentSecondsRef.current);
    watchDeltaRef.current = 0;
    if (delta <= 0) return true;
    try {
      const res = await fetch("/api/v1/learning/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          sectionId: section.id,
          lastPositionSec: lastPos,
          watchedDeltaSec: delta,
        }),
      });
      if (res.ok) {
        setWatchProgressMap((current) => ({
          ...current,
          [section.id]: {
            lastPositionSec: lastPos,
            watchTimeSec: (current[section.id]?.watchTimeSec ?? 0) + delta,
          },
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [course.id]);

  useEffect(() => {
    if (activeChapter) setOpenChapterId(activeChapter.id);
  }, [activeChapter]);

  // Keep playback on an accessible section when plan changes or state drifts
  useEffect(() => {
    const index = sectionIndexOf(sections, activeId);
    if (index < 0 || canAccessLearningItem(accessPlan, index, sections.length)) return;
    const fallbackId = firstAccessibleSectionId(sections, accessPlan);
    if (fallbackId && fallbackId !== activeId) {
      const fallback = sections.find((section) => section.id === fallbackId);
      if (fallback) {
        const resume = resumeSecondsForSection(fallback, sections, watchProgressMap);
        setActiveId(fallbackId);
        setPlayerSeekSeconds(resume);
        setCurrentSeconds(resume);
      }
    }
  }, [accessPlan, activeId, sections, watchProgressMap]);

  // Load progress from DB (source of truth for completions + watch position)
  useEffect(() => {
    const prefix = storagePrefix;

    type LsNote = { id: string; sectionId: string; seconds: number; text: string; createdAt: string };
    type DbState = {
      completedSectionIds: string[];
      taskStates: Record<string, TaskState>;
      taskSubmissions: Record<string, TaskSubmission>;
      certificate: { id: string; certificateNo: string; verificationCode: string } | null;
      watchProgress: Record<string, { lastPositionSec: number; watchTimeSec: number }>;
      watchBySection?: Record<string, { percent: number; complete: boolean }>;
      finalProject?: typeof finalProject;
      notes: TimestampNote[];
    };

    fetch(`/api/v1/learning/progress?courseId=${course.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: { data: DbState }) => {
        const {
          completedSectionIds,
          taskStates: dbTaskStates,
          taskSubmissions: dbTaskSubmissions,
          certificate: dbCertificate,
          watchProgress,
          watchBySection,
          finalProject: dbFinalProject,
          notes: dbNotes,
        } = json.data;

        setCompletedSections(new Set(completedSectionIds ?? []));
        setTaskStates(dbTaskStates ?? {});
        setTaskSubmissions(dbTaskSubmissions ?? {});
        setCertificate(dbCertificate ?? null);
        setFinalProject(dbFinalProject ?? null);
        setNotes(dbNotes ?? []);
        setWatchProgressMap(watchProgress ?? {});

        const active = sections.find((s) => s.id === activeId) ?? sections[0];
        if (active) {
          const resume = resumeSecondsForSection(active, sections, watchProgress ?? {});
          setPlayerSeekSeconds(resume);
          setCurrentSeconds(resume);
          const watch = watchBySection?.[active.id];
          if (watch) setSectionWatchPercent(watch.percent);
          else if (completedSectionIds.includes(active.id)) setSectionWatchPercent(100);
        }
        setProgressHydrated(true);
      })
      .catch(() => {
        const lsNotes = readJson<LsNote[]>(`${prefix}:notes`, []);
        setCompletedSections(new Set(readJson<string[]>(`${prefix}:completed-sections`, [])));
        setTaskStates(readJson<Record<string, TaskState>>(`${prefix}:tasks`, {}));
        setTaskSubmissions({});
        setCertificate(null);
        setNotes(
          lsNotes.map((n) => ({
            id: n.id,
            sectionId: n.sectionId,
            seconds: n.seconds,
            content: n.text,
            createdAt: n.createdAt,
          })),
        );
        setProgressHydrated(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  useEffect(() => {
    if (!progressHydrated || !activeSection) return;
    const resume = resumeSecondsForSection(activeSection, sections, watchProgressMap);
    setPlayerSeekSeconds(resume);
    setCurrentSeconds(resume);
    prevProgressSecondsRef.current = null;
    sectionEndHandledRef.current = false;
    if (completedSections.has(activeSection.id)) {
      setSectionWatchPercent(100);
    }
  }, [activeSection?.id, progressHydrated]);

  // Flush watch progress on unmount
  useEffect(() => {
    return () => {
      flushWatchProgress();
    };
  }, [flushWatchProgress]);

  useEffect(() => {
    if (!activeSection) return;
    setPersistentVideo({
      courseId: course.id,
      lessonUrl: pathname,
      lessonTitle: course.title,
      sectionTitle: activeSection.title,
      videoId: course.sourceYoutubeId,
      timestamp: activeSection.startSeconds,
      isPlaying: true,
    });
  }, [
    activeSection?.id,
    activeSection?.title,
    activeSection?.startSeconds,
    course.id,
    course.sourceYoutubeId,
    course.title,
    pathname,
    setPersistentVideo,
  ]);

  useEffect(() => {
    return () => setPersistentMinimized(true);
  }, [setPersistentMinimized]);

  useEffect(() => {
    sectionEndHandledRef.current = false;
  }, [activeSection?.id, effectiveEndSeconds]);

  const markSectionComplete = useCallback(
    async (section: CourseSection): Promise<boolean> => {
      const index = sectionIndexOf(sections, section.id);
      if (!canAccessLearningItem(accessPlan, index, sections.length)) return false;
      if (completedSectionsRef.current.has(section.id)) return true;

      setSectionCompleteError(null);
      const lastPos = Math.floor(currentSecondsRef.current);
      const pendingDelta = Math.min(Math.floor(watchDeltaRef.current), 3600);
      watchDeltaRef.current = 0;

      await flushWatchProgress();

      try {
        const res = await fetch("/api/v1/learning/section-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            sectionId: section.id,
            lastPositionSec: lastPos,
            watchedDeltaSec: pendingDelta,
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          error?: string;
          data?: { xpGain?: number; xpReason?: string; leveledUp?: boolean; level?: number };
        } | null;

        if (!res.ok || !json?.success) {
          setSectionCompleteError(json?.error ?? "Section дуусгахад алдаа гарлаа. Дахин оролдоно уу.");
          return false;
        }

        setCompletedSections((current) => {
          if (current.has(section.id)) return current;
          const next = new Set([...current, section.id]);
          try {
            window.localStorage.setItem(`${storagePrefix}:completed-sections`, JSON.stringify([...next]));
          } catch {
            // ignore
          }
          return next;
        });
        setTaskStates((current) => {
          const currentState = current[section.id];
          return { ...current, [section.id]: currentState === "completed" ? "completed" : "draft" };
        });

        if (json.data?.xpGain) {
          const { showXpGainOnClient } = await import("@/lib/gamification/show-xp-client");
          showXpGainOnClient(json.data);
          router.refresh();
        }
        return true;
      } catch {
        setSectionCompleteError("Сүлжээний алдаа. Progress хадгалагдаагүй байж болно.");
        return false;
      }
    },
    [accessPlan, course.id, flushWatchProgress, router, sections, storagePrefix],
  );

  const handleSectionEnded = useCallback(() => {
    if (sectionEndHandledRef.current) return;
    sectionEndHandledRef.current = true;

    const section = activeSectionRef.current;
    if (!section) return;

    void (async () => {
      const saved = await markSectionComplete(section);
      if (!saved) {
        sectionEndHandledRef.current = false;
        return;
      }

      const index = sectionIndexOf(sections, section.id);
      const next = index >= 0 && index < sections.length - 1 ? sections[index + 1]! : null;

      if (!next) {
        setTab("tasks");
        setTaskSubmitSuccess("Бүх хичээл дууслаа. Одоо section task болон Final Project-оо илгээнэ үү.");
        return;
      }

      const nextIndex = index + 1;
      if (canAccessLearningItem(accessPlan, nextIndex, sections.length)) {
        const resume = resumeSecondsForSection(next, sections, watchProgressMap);
        setActiveId(next.id);
        setPlayerSeekSeconds(resume);
        setCurrentSeconds(resume);
        updatePersistentTimestamp(resume);
        prevProgressSecondsRef.current = null;
        sectionEndHandledRef.current = false;
        setTaskSubmitSuccess(`"${section.title}" дууслаа. Дараагийн хэсэг рүү шилжлээ.`);
        return;
      }

      setUpgradeReason(lockedSectionMessage(nextIndex, sections.length));
    })();
  }, [accessPlan, markSectionComplete, sections, updatePersistentTimestamp, watchProgressMap]);

  const handlePlaybackProgress = useCallback(
    (seconds: number) => {
      setCurrentSeconds(seconds);
      updatePersistentTimestamp(seconds);

      const prev = prevProgressSecondsRef.current;
      if (prev !== null && seconds > prev && seconds - prev <= 5) {
        watchDeltaRef.current += seconds - prev;
      }
      prevProgressSecondsRef.current = seconds;

      const now = Date.now();
      if (now - lastWatchFlushRef.current >= 20_000) {
        lastWatchFlushRef.current = now;
        flushWatchProgress();
      }

      const section = activeSectionRef.current;
      if (!section || sectionEndHandledRef.current) return;

      const index = sectionIndexOf(sections, section.id);
      const durationSec = sectionDurationSeconds(section, sections, index);
      const requiredSec = Math.ceil(durationSec * WATCH_COMPLETION_RATIO);
      const watchedInSection = Math.max(0, seconds - section.startSeconds);
      const percent = Math.min(100, Math.round((watchedInSection / durationSec) * 100));
      setSectionWatchPercent(percent);

      if (watchedInSection >= requiredSec) {
        handleSectionEnded();
        return;
      }

      const endAt = getEffectiveEndSeconds(section, sections);
      if (seconds >= endAt - 0.35) {
        handleSectionEnded();
      }
    },
    [flushWatchProgress, handleSectionEnded, sections, updatePersistentTimestamp],
  );

  useEffect(() => {
    if (!activeSection) return;
    const index = sectionIndexOf(sections, activeSection.id);
    const durationSec = sectionDurationSeconds(activeSection, sections, index);
    const watched = Math.max(0, currentSeconds - activeSection.startSeconds);
    setSectionWatchPercent(Math.min(100, Math.round((watched / durationSec) * 100)));
  }, [activeSection, currentSeconds, sections]);

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

  const submitActiveTask = async () => {
    if (!activeSection || submittingTask) return;
    setTaskSubmitError(null);
    setTaskSubmitSuccess(null);

    if (!activeSectionCompleted) {
      setTaskSubmitError("Эхлээд энэ video section-ийг дуустал үзнэ үү.");
      return;
    }
    if (taskDraft.trim().length < 20) {
      setTaskSubmitError("Task submission хамгийн багадаа 20 тэмдэгттэй байх ёстой.");
      return;
    }

    const spell = await assertMongolianSpellOk(taskDraft.trim());
    if (!spell.ok) {
      setTaskSubmitError(spell.message);
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await fetch("/api/v1/learning/task-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          sectionId: activeSection.id,
          content: taskDraft.trim(),
          submissionUrl: taskUrl.trim(),
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: TaskSubmission & { assignedReviewers?: number };
      };
      if (!res.ok || !json.success || !json.data) {
        setTaskSubmitError(json.error ?? "Task илгээхэд алдаа гарлаа.");
        return;
      }
      setTaskSubmissions((current) => ({ ...current, [activeSection.id]: json.data! }));
      setTaskStates((current) => ({ ...current, [activeSection.id]: "submitted" }));
      setTaskSubmitSuccess(
        json.data.assignedReviewers && json.data.assignedReviewers > 0
          ? `${json.data.assignedReviewers} reviewer-д илгээгдлээ. Peer review дуусахад score гарна.`
          : "Task хадгалагдлаа. Reviewer олдох хүртэл peer review queue-д харагдана.",
      );
    } catch {
      setTaskSubmitError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const addTimestampNote = async () => {
    if (!noteDraft.trim()) return;
    const content = noteDraft.trim();
    const tempId = `temp-${crypto.randomUUID()}`;
    setNotes((current) => [
      {
        id: tempId,
        sectionId: activeSection.id,
        seconds: Math.floor(currentSeconds),
        content,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setNoteDraft("");

    try {
      const res = await fetch("/api/v1/learning/study-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          sectionId: activeSection.id,
          seconds: Math.floor(currentSeconds),
          content,
        }),
      });
      const json = (await res.json()) as { data?: { id: string } };
      if (json?.data?.id) {
        setNotes((current) => current.map((n) => (n.id === tempId ? { ...n, id: json.data!.id } : n)));
      }
    } catch {
      // Optimistic note stays in local state
    }
  };

  const deleteNote = (noteId: string) => {
    setNotes((current) => current.filter((n) => n.id !== noteId));
    if (!noteId.startsWith("temp-")) {
      fetch(`/api/v1/learning/study-notes/${noteId}`, { method: "DELETE" }).catch(() => {});
    }
  };

  const selectSection = (section: CourseSection, seconds?: number) => {
    const sectionIndex = sectionIndexOf(sections, section.id);
    if (!canAccessLearningItem(accessPlan, sectionIndex, sections.length)) {
      const requiredPlan = getRequiredPlanForIndex(sectionIndex, sections.length);
      setUpgradeReason(
        requiredPlan === "PRO"
          ? "Энэ хэсэг Pro багцад нээгдэнэ. 100% хандалт авахын тулд Pro руу шилжинэ үү."
          : "Үнэгүй урьдчилсан харалт дууслаа. Premium аваад курсын 50%-ийг нээнэ үү.",
      );
      return;
    }

    void flushWatchProgress();
    const resume = resumeSecondsForSection(section, sections, watchProgressMap, seconds);
    setActiveId(section.id);
    setPlayerSeekSeconds(resume);
    setCurrentSeconds(resume);
    updatePersistentTimestamp(resume);
    if (completedSections.has(section.id)) setSectionWatchPercent(100);
  };

  return (
    <div className="-m-5 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background text-foreground">
      <CourseProgressPanel
        variant="minimal"
        courseId={course.id}
        courseTitle={course.title}
        completedCount={completedSections.size}
        totalLessons={sections.length}
        watchPercent={watchedPercent}
        nextLesson={nextSection ? { id: nextSection.id, title: nextSection.title } : null}
        certificateReadiness={certificateReadiness}
        activeSectionTitle={`${activeSection.title} · ${formatSeconds(currentSeconds)}`}
        onContinueSection={() => {
          if (nextSection) {
            const nextIndex = sectionIndexOf(sections, nextSection.id);
            if (!canAccessLearningItem(accessPlan, nextIndex, sections.length)) {
              setUpgradeReason(lockedSectionMessage(nextIndex, sections.length));
              return;
            }
            selectSection(nextSection);
            return;
          }
          selectSection(activeSection, currentSeconds);
        }}
        allLessonsComplete={allSectionsComplete}
        peerReviewPending={peerReviewPending}
        finalTaskRemaining={!allSectionsComplete && activeIndex >= sections.length - 2}
        lessonsWatched={allSectionsComplete}
        tasksComplete={gradedTasks > 0 || Object.keys(taskSubmissions).length > 0}
        projectSubmitted={allSectionsComplete}
        peerReviewPassed={allSectionsComplete && !peerReviewPending}
        certificateUnlocked={Boolean(certificate)}
      />

      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border px-3 py-1">
        <span className="mr-auto truncate text-[11px] font-medium text-muted-foreground">
          {planLabel(accessPlan)} · {allowedSectionCount}/{sections.length} нээгдсэн
        </span>
        <button
          type="button"
          onClick={() => setFocusMode((value) => !value)}
          aria-pressed={focusMode}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors",
            focusMode
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          <Focus size={13} /> {focusMode ? "Focus гарах" : "Focus"}
        </button>
      </div>

      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: "minmax(0,1fr) min(320px, 30vw)",
        }}
      >
          <aside className="order-2 flex min-h-0 flex-col overflow-y-auto border-l border-border bg-muted/20">
            {/* Search */}
            <div className="shrink-0 border-b border-border px-3 py-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Хэсэг хайх…"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Chapter accordion */}
            <div className="flex flex-col divide-y divide-border">
              {filteredChapters.map((chapter) => {
                const open = query.trim().length > 0 || openChapterId === chapter.id;
                const doneInChapter = chapter.sections.filter((section) => completedSections.has(section.id)).length;

                return (
                  <div key={chapter.id} className="bg-card">
                    <button
                      type="button"
                      onClick={() => setOpenChapterId(openChapterId === chapter.id ? "" : chapter.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-foreground">{chapter.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatSeconds(chapter.start)} – {formatSeconds(chapter.end)} · {doneInChapter}/{chapter.sections.length} done
                        </p>
                      </div>
                      <ChevronDown
                        size={15}
                        className={cn("shrink-0 text-violet-400 transition-transform", open && "rotate-180")}
                      />
                    </button>

                    {open ? (
                      <div className="border-t border-border">
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
                                "group relative w-full border-b border-border px-4 py-3 text-left last:border-b-0 transition-colors",
                                selected
                                  ? "bg-primary/10"
                                  : locked
                                    ? "opacity-60 hover:bg-muted/50"
                                    : "hover:bg-muted/50",
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
                                        ? "bg-muted text-muted-foreground"
                                        : selected
                                          ? "bg-violet-600 text-white"
                                          : "bg-primary/15 text-primary",
                                  )}
                                >
                                  {done ? <CheckCircle2 size={13} /> : locked ? <Lock size={12} /> : section.order}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "line-clamp-1 text-[13px] font-bold leading-snug",
                                      selected ? "text-primary" : locked ? "text-muted-foreground" : "text-foreground",
                                    )}
                                  >
                                    {section.title}
                                  </p>
                                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{sectionRange(section)}</p>
                                </div>
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                                    locked
                                      ? "bg-muted text-muted-foreground"
                                      : done
                                        ? "bg-emerald-50 text-emerald-600"
                                        : taskState === "submitted"
                                          ? "bg-amber-50 text-amber-600"
                                          : taskState === "draft"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-muted text-muted-foreground",
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

        {/* Main panel */}
        <main
          className={cn(
            "order-1 flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto p-3 lg:p-4",
            focusMode && "gap-2",
          )}
        >
          <div className={cn("w-full", focusMode && "shrink-0")}>
            <div
              className={cn(
                "w-full overflow-hidden rounded-xl border border-border bg-black shadow-md transition-[min-height,box-shadow] duration-300 ease-out",
                focusMode
                  ? "min-h-[min(72vh,calc((100vw-360px)*9/16))] ring-2 ring-primary/25 shadow-lg shadow-primary/10"
                  : "aspect-video",
              )}
            >
              <YouTubeSectionPlayer
                key={`${activeSection.id}-${playerSeekSeconds}`}
                videoId={course.sourceYoutubeId}
                startSeconds={playerSeekSeconds}
                endSeconds={effectiveEndSeconds}
                title={activeSection.title}
                theater={focusMode}
                onEnded={handleSectionEnded}
                onProgress={handlePlaybackProgress}
                onPlayingChange={setPersistentPlaying}
              />
            </div>
            <h2 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
              {activeSection.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Хэсэг {activeSection.order} · {sectionRange(activeSection)} · {formatSeconds(currentSeconds)} /{" "}
              {formatSeconds(effectiveEndSeconds)} · Үзсэн {sectionWatchPercent}%
              {activeSectionCompleted ? " · ✓ Дууссан" : sectionWatchPercent >= 90 ? " · Бэлэн" : ""}
            </p>
            {sectionCompleteError ? (
              <p className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-700 dark:text-red-300">
                {sectionCompleteError}
              </p>
            ) : null}
          </div>

          {/* Tabs */}
          <section className="shrink-0 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 p-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-black transition-all",
                    tab === id
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <div className="p-4 pb-8">
              {tab === "overview" ? (
                <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Sections", value: `${sections.length}`, color: "from-violet-500 to-violet-600", light: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                    { label: "Completed", value: `${completedSections.size}`, color: "from-emerald-500 to-emerald-600", light: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                    { label: "Duration", value: estimatedDuration, color: "from-amber-500 to-amber-600", light: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                  ].map(({ label, value, color, light }) => (
                    <div key={label} className="overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
                      <span className={cn("inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", light)}>
                        {label}
                      </span>
                      <p className={cn("mt-2 bg-gradient-to-r bg-clip-text text-[22px] font-black text-transparent", color)}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <FinalProjectPanel
                  courseId={course.id}
                  initial={finalProject}
                  certificate={certificate ? { id: certificate.id, certificateNo: certificate.certificateNo } : null}
                  onSubmitted={() => {
                    fetch(`/api/v1/learning/progress?courseId=${course.id}`)
                      .then((r) => r.json())
                      .then((json: { data?: { finalProject?: typeof finalProject; certificate?: typeof certificate } }) => {
                        if (json.data?.finalProject) setFinalProject(json.data.finalProject);
                        if (json.data?.certificate) setCertificate(json.data.certificate);
                      })
                      .catch(() => null);
                  }}
                />
                </div>
              ) : null}

              {tab === "description" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{activeSection.title}</h3>
                    <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
                      This player turns the course video into section-based learning. Use the chapter list to jump between
                      timestamps, complete tasks, and save timestamp notes while studying.
                    </p>
                    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                      <p className="text-[13px] font-bold text-primary">Current section</p>
                      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
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
                      <div key={label} className="rounded-xl border border-border bg-muted/30 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{label}</p>
                        <p className="mt-1.5 text-[13px] font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "tasks" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Section task</p>
                        <h3 className="mt-2 text-[17px] font-bold text-foreground">{activeSection.title}</h3>
                        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                          Video дууссаны дараа энэ section-ийн даалгавраа илгээж peer review-д оруулна. Бүх section
                          task үнэлэгдсэний дараа certificate автоматаар нээгдэнэ.
                        </p>
                      </div>
                      <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold text-primary shadow-sm">
                        {activeTaskSubmission?.status ?? statusText(activeTaskState)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl border border-border bg-card p-3.5">
                      <p className="text-[12px] font-bold text-foreground">Даалгавар</p>
                      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
                        <span className="font-bold">{activeSection.title}</span> хэсгээс сурсан гол санаа, хийсэн алхам,
                        гарсан үр дүнгээ тайлбарла. Код, дизайн, файл эсвэл demo байгаа бол холбоосоо хавсарга.
                      </p>
                    </div>

                    {!activeSectionCompleted ? (
                      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] font-semibold text-amber-700 dark:text-amber-300">
                        Энэ task video section дуустал үзсэний дараа идэвхжинэ.
                      </div>
                    ) : null}

                    {activeTaskSubmission ? (
                      <div className="mt-4 rounded-xl border border-border bg-card p-3.5 text-[13px] text-muted-foreground">
                        <p className="font-bold text-foreground">Илгээсэн task</p>
                        <p className="mt-1">
                          Review: {activeTaskSubmission.completedReviewCount}/{activeTaskSubmission.reviewCount}
                          {activeTaskSubmission.score != null ? ` · Score: ${Math.round(activeTaskSubmission.score)}/100` : ""}
                        </p>
                        {activeTaskSubmission.status === "GRADED" ? (
                          <p className="mt-2 font-semibold text-emerald-600">Peer review дууссан.</p>
                        ) : (
                          <p className="mt-2 text-slate-500">Peer review дуусахыг хүлээж байна.</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <MongolianSpellTextarea
                          value={taskDraft}
                          onChange={setTaskDraft}
                          disabled={!activeSectionCompleted || submittingTask}
                          rows={6}
                          label="Section task"
                          placeholder="Юу хийсэн, хэрхэн хийсэн, ямар үр дүн гарсан талаар бичнэ үү (кирилл эсвэл латин: sain baina)..."
                          className="min-h-[150px] text-[14px]"
                        />
                        <input
                          value={taskUrl}
                          onChange={(event) => setTaskUrl(event.target.value)}
                          disabled={!activeSectionCompleted || submittingTask}
                          placeholder="Submission URL (optional)"
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => void submitActiveTask()}
                          disabled={!activeSectionCompleted || submittingTask}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-black text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={14} /> {submittingTask ? "Илгээж байна..." : "Submit for peer review"}
                        </button>
                      </div>
                    )}

                    {taskSubmitError ? (
                      <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12px] font-semibold text-red-700 dark:text-red-300">
                        {taskSubmitError}
                      </p>
                    ) : null}
                    {taskSubmitSuccess ? (
                      <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {taskSubmitSuccess}
                      </p>
                    ) : null}
                    {certificate ? (
                      <a
                        href="/student/settings#certificates"
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-black text-white hover:bg-emerald-500"
                      >
                        <Award size={14} /> Certificate авах
                      </a>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Next step</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                      {activeTaskSubmission
                        ? nextSection
                          ? `Task илгээгдсэн. Одоо Section ${nextSection.order}: ${nextSection.title} руу үргэлжлүүлж болно.`
                          : "Энэ course-ийн сүүлийн section. Peer reviews дуусахад certificate шалгана."
                        : "Video дууссаны дараа task илгээж байж дараагийн алхам бүрэн хаагдана."}
                    </p>
                    {nextSection &&
                    canAccessLearningItem(
                      accessPlan,
                      sectionIndexOf(sections, nextSection.id),
                      sections.length,
                    ) ? (
                      <button
                        type="button"
                        onClick={() => selectSection(nextSection)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-bold text-background hover:opacity-90"
                      >
                        <Play size={14} /> Next section
                      </button>
                    ) : nextSection ? (
                      <button
                        type="button"
                        onClick={() => {
                          const idx = sectionIndexOf(sections, nextSection.id);
                          const required = getRequiredPlanForIndex(idx, sections.length);
                          setUpgradeReason(
                            required === "PRO"
                              ? "Энэ хэсэг Pro багцад нээгдэнэ. 100% хандалт авахын тулд Pro руу шилжинэ үү."
                              : "Premium аваад курсын 50%-ийг үргэлжлүүлэн үзнэ үү.",
                          );
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-black text-white hover:bg-violet-500"
                      >
                        <Lock size={14} /> Upgrade to continue
                      </button>
                    ) : null}
                    <a
                      href="/student/peer-review"
                      className="mt-2 inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-[13px] font-bold text-primary hover:bg-violet-50"
                    >
                      <ClipboardCheck size={14} /> Peer review
                    </a>
                  </div>
                </div>
              ) : null}

              {tab === "notes" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div>
                    <MongolianSpellTextarea
                      value={noteDraft}
                      onChange={setNoteDraft}
                      rows={5}
                      label="Тэмдэглэл"
                      placeholder={`${formatSeconds(currentSeconds)} дээр тэмдэглэл (кирилл)...`}
                      className="min-h-[140px] bg-muted/40 text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={() => void addTimestampNote()}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-black text-white hover:bg-violet-500"
                    >
                      <Send size={14} /> Save timestamp note
                    </button>
                  </div>

                  <div className="flex max-h-[320px] flex-col gap-2.5 overflow-y-auto pr-1">
                    {notes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-[13px] text-muted-foreground">
                        No notes yet.
                      </div>
                    ) : null}
                    {notes.map((note) => {
                      const noteSection = sections.find((section) => section.id === note.sectionId);
                      return (
                        <div key={note.id} className="rounded-xl border border-border bg-card p-3.5">
                          <button
                            type="button"
                            onClick={() => noteSection && selectSection(noteSection, note.seconds)}
                            className="w-full text-left"
                          >
                            <p className="font-mono text-[11px] font-bold text-primary">
                              {noteSection ? `Section ${noteSection.order}` : "Section"} · {formatSeconds(note.seconds)}
                            </p>
                            <p className="mt-1.5 text-[13px] leading-6 text-foreground">{note.content}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className="mt-2 text-[11px] font-bold text-muted-foreground hover:text-destructive"
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

      {progressHydrated && allSectionsComplete ? (
        <LearningJourneyGuide
          totalSections={sections.length}
          completedSections={completedSections.size}
          tasksSubmitted={submittedTasks}
          tasksGraded={gradedTasks}
          finalProjectUnlocked={Boolean(finalProject?.unlocked)}
          finalProjectSubmitted={Boolean(finalProject?.submission)}
          finalProjectPassed={Boolean(finalProject?.submission?.passed)}
          reviewsGiven={finalProject?.reviewsGiven ?? 0}
          reviewsRequired={finalProject?.reviewsRequired ?? 2}
          hasCertificate={Boolean(certificate)}
          onGoTasks={() => setTab("tasks")}
          onGoOverview={() => setTab("overview")}
        />
      ) : null}

      <UpgradeModal
        open={upgradeReason != null}
        reason={upgradeReason ?? undefined}
        requiredPlan={
          upgradeReason?.includes("Pro")
            ? "PRO"
            : upgradeReason?.includes("Premium")
              ? "PREMIUM"
              : "PREMIUM"
        }
        onClose={() => setUpgradeReason(null)}
      />
    </div>
  );
}
