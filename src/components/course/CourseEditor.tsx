"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, GripVertical, ChevronDown, Play, FileText,
  BookOpen, Globe, Archive, Loader2, X,
} from "lucide-react";
import {
  createModule, deleteModule, createLesson, updateLesson, deleteLesson,
  fixZeroTimeSegments, publishCourse, unpublishCourse, updateCourse, createLessonSection,
} from "@/modules/courses/application/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { getYouTubeVideoId, isValidYouTubeUrl } from "@/lib/youtube";

type LessonType = "VIDEO" | "TEXT" | "PDF" | "ASSIGNMENT" | "QUIZ" | "LIVE_SESSION";
type LessonVideoType = "NONE" | "YOUTUBE" | "UPLOAD";
type LessonVideoProvider = "YOUTUBE" | "CUSTOM" | null;

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  type: LessonType;
  duration: number | null;
  contentUrl?: string | null;
  videoType?: LessonVideoType | null;
  videoUrl?: string | null;
  videoProvider?: LessonVideoProvider;
  sectionId?: string | null;
  startTimeSeconds?: number | null;
  endTimeSeconds?: number | null;
  sourceCreditName?: string | null;
  sourceCreditUrl?: string | null;
  isFree: boolean;
  orderIndex: number;
  sections?: Array<{
    id: string;
    title: string;
    order: number;
    youtubeId: string;
    startSeconds: number;
    endSeconds: number;
  }>;
}

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Props {
  courseId: string;
  status: string;
  thumbnailUrl: string | null;
  modules: Module[];
}

const lessonTypeIcons: Record<string, React.ElementType> = {
  VIDEO: Play, TEXT: FileText, PDF: FileText,
  ASSIGNMENT: BookOpen, QUIZ: BookOpen, LIVE_SESSION: Globe,
};

export function CourseEditor({ courseId, status, thumbnailUrl, modules }: Props) {
  const router = useRouter();
  const [openModule, setOpenModule] = useState<string | null>(modules[0]?.id ?? null);
  const [showNewModule, setShowNewModule] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [coverUrl, setCoverUrl] = useState(thumbnailUrl);
  const [isPending, startTransition] = useTransition();

  const handleFixZeroTimes = () => {
    startTransition(async () => {
      const result = await fixZeroTimeSegments(courseId);
      if ("error" in result) {
        toast({ type: "error", title: result.error as string });
        return;
      }
      const { fixed } = result as { fixed: number };
      toast({
        type: "success",
        title: fixed > 0 ? `${fixed} хичээлийн буруу цагийг заслаа ✅` : "Засах шаардлагатай хичээл олдсонгүй",
      });
      if (fixed > 0) router.refresh();
    });
  };

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  const handlePublish = () => {
    startTransition(async () => {
      const result = status === "PUBLISHED" ? await unpublishCourse(courseId) : await publishCourse(courseId);
      if ("error" in result) {
        toast({ type: "error", title: "Алдаа", description: typeof result.error === "string" ? result.error : "Дахин оролдоно уу" });
        return;
      }
      const pendingReview = "pendingReview" in result && result.pendingReview;
      toast({
        type: "success",
        title: status === "PUBLISHED"
          ? "Хэвлэлээс хурдан авлаа"
          : pendingReview
            ? "Админы зөвшөөрөл хүлээгдэж байна"
            : "Нийтэд нээгдлээ",
        description: pendingReview
          ? "Курс админ шалгаад зөвшөөрсний дараа нийтэд харагдана."
          : undefined,
      });
      router.refresh();
    });
  };

  const handleDeleteModule = (id: string) => {
    if (!confirm("Энэ модулийг устгах уу? Доторх хичээлүүд ч устах болно.")) return;
    startTransition(async () => {
      const result = await deleteModule(id);
      if ("error" in result) {
        toast({ type: "error", title: result.error as string });
        return;
      }
      toast({ type: "success", title: "Устгагдлаа" });
      router.refresh();
    });
  };

  const saveCover = (url: string) => {
    setCoverUrl(url);
    startTransition(async () => {
      const result = await updateCourse(courseId, { thumbnailUrl: url });
      if ("error" in result) {
        toast({ type: "error", title: "Cover зураг хадгалж чадсангүй" });
        return;
      }
      toast({ type: "success", title: "Cover зураг хадгалагдлаа" });
      router.refresh();
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* ─── MAIN: Module list ─────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Хичээлийн бүтэц <span className="text-muted-foreground/80 font-normal">· {modules.length} модуль · {totalLessons} хичээл</span>
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowNewModule(true)}>
            <Plus size={14} /> Модуль нэмэх
          </Button>
        </div>

        {/* New module form */}
        {showNewModule && (
          <NewModuleForm
            courseId={courseId}
            onClose={() => setShowNewModule(false)}
            onCreated={() => { setShowNewModule(false); router.refresh(); }}
          />
        )}

        {/* Empty state */}
        {modules.length === 0 && !showNewModule && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
            <BookOpen size={32} className="mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-muted-foreground text-sm mb-3">Модуль нэмж эхэл</p>
            <Button size="sm" onClick={() => setShowNewModule(true)}>
              <Plus size={14} /> Эхний модулийг нэмэх
            </Button>
          </div>
        )}

        {/* Modules */}
        {modules.map((mod) => {
          const open = openModule === mod.id;
          return (
            <div key={mod.id} className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <GripVertical size={15} className="text-muted-foreground/60 cursor-grab" />
                <button
                  onClick={() => setOpenModule(open ? null : mod.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <ChevronDown size={14} className={cn("text-muted-foreground/80 transition-transform", open && "rotate-180")} />
                  <span className="text-sm font-semibold text-foreground">{mod.title}</span>
                  <span className="text-xs text-muted-foreground/80">· {mod.lessons.length} хичээл</span>
                </button>
                <button
                  onClick={() => handleDeleteModule(mod.id)}
                  className="text-muted-foreground/80 hover:text-red-500 p-1"
                  title="Устгах"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Lessons */}
              {open && (
                <div>
                  {mod.lessons.length === 0 && showNewLesson !== mod.id && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Хичээл алга
                    </div>
                  )}

                  {mod.lessons.map((lesson) => {
                    const Icon = lessonTypeIcons[lesson.type] ?? FileText;
                    const isEditing = editingLesson?.id === lesson.id;
                    const hasTimeIssue =
                      lesson.startTimeSeconds === 0 || lesson.endTimeSeconds === 0;
                    return (
                      <div key={lesson.id} className="border-t border-border">
                        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 group">
                          <GripVertical size={13} className="text-muted-foreground/60 cursor-grab" />
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Icon size={13} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground/80">
                              {lesson.type}
                              {lesson.duration ? ` · ${Math.ceil(lesson.duration / 60)}м` : ""}
                              {lesson.isFree ? " · Үнэгүй" : ""}
                              {hasTimeIssue && (
                                <span className="ml-1 text-red-500 font-medium">⚠ цаг=0</span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => setEditingLesson(isEditing ? null : lesson)}
                            className={cn(
                              "text-xs font-medium px-2 py-1 rounded-lg transition-colors",
                              isEditing
                                ? "bg-violet-100 text-violet-700"
                                : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100",
                            )}
                          >
                            {isEditing ? "Хаах" : "Засах"}
                          </button>
                        </div>
                        {isEditing && (
                          <EditLessonForm
                            lesson={lesson}
                            onClose={() => setEditingLesson(null)}
                            onSaved={() => { setEditingLesson(null); router.refresh(); }}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Add lesson */}
                  {showNewLesson === mod.id ? (
                    <NewLessonForm
                      moduleId={mod.id}
                      onClose={() => setShowNewLesson(null)}
                      onCreated={() => { setShowNewLesson(null); router.refresh(); }}
                    />
                  ) : (
                    <button
                      onClick={() => setShowNewLesson(mod.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t border-border transition-colors"
                    >
                      <Plus size={13} /> Хичээл нэмэх
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── SIDEBAR: Actions ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <ImageUploadField
            value={coverUrl}
            folder="courses"
            label="Курсийн cover зураг"
            helper="Course card, landing page дээр харагдах зураг"
            onChange={saveCover}
            onClear={() => saveCover("")}
          />
        </div>

        {/* Publish card */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {status === "PUBLISHED" ? "Нээлттэй" : "Ноорог"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {status === "PUBLISHED"
              ? "Курс олон нийтэд нээлттэй байна"
              : "Курс одоогоор зөвхөн таны дэргэд харагдана"}
          </p>
          <Button
            onClick={handlePublish}
            disabled={isPending || totalLessons === 0}
            variant={status === "PUBLISHED" ? "outline" : "success"}
            className="w-full"
          >
            {isPending ? (
              <><Loader2 size={14} className="animate-spin mr-2" /> Хадгалж байна...</>
            ) : status === "PUBLISHED" ? (
              <><Archive size={14} /> Ноорог болгох</>
            ) : (
              <><Globe size={14} /> Нийтлэх</>
            )}
          </Button>
          {totalLessons === 0 && (
            <p className="text-xs text-amber-600 mt-2">Нийтлэхийн өмнө ядаж 1 хичээл нэмнэ үү</p>
          )}
        </div>

        {/* DB Fix card */}
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Видео цагийн засвар</h3>
          <p className="text-xs text-muted-foreground mb-3">
            YouTube хичээлийн <code className="bg-muted px-1 rounded">endTimeSeconds=0</code> болон{" "}
            <code className="bg-muted px-1 rounded">startTimeSeconds=0</code> утгуудыг{" "}
            <code className="bg-muted px-1 rounded">null</code> болгон засна.
            Ингэснээр &quot;Video unavailable&quot; алдаа арилна.
          </p>
          <Button
            onClick={handleFixZeroTimes}
            disabled={isPending}
            variant="outline"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {isPending ? (
              <><Loader2 size={14} className="animate-spin mr-2" /> Засаж байна...</>
            ) : (
              "⚠ Буруу цагуудыг засах"
            )}
          </Button>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Шалгах жагсаалт</h3>
          <div className="space-y-2">
            {[
              { label: "Модуль үүсгэсэн", done: modules.length > 0 },
              { label: "Ядаж 1 хичээл байгаа", done: totalLessons > 0 },
              { label: "Үнэ тохируулсан", done: true },
              { label: "Thumbnail зураг", done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  item.done ? "border-emerald-500 bg-emerald-500" : "border-border"
                )}>
                  {item.done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={cn("text-xs", item.done ? "text-muted-foreground" : "text-muted-foreground/80")}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUB-FORMS ──────────────────────────────────────────────────────────────

function NewModuleForm({ courseId, onClose, onCreated }: { courseId: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createModule({ courseId, title });
      if ("error" in result) {
        toast({ type: "error", title: "Алдаа" });
        return;
      }
      toast({ type: "success", title: "Модуль үүслээ" });
      onCreated();
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-violet-600 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Шинэ модуль</p>
        <button onClick={onClose}><X size={14} className="text-muted-foreground/80" /></button>
      </div>
      <Input
        placeholder="Жишээ: 1-р хэсэг: Танилцуулга"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending || !title.trim()} className="flex-1">
          {isPending ? <><Loader2 size={13} className="animate-spin mr-1" /> Үүсгэж байна...</> : "Үүсгэх"}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Болих</Button>
      </div>
    </div>
  );
}

function NewLessonForm({ moduleId, onClose, onCreated }: { moduleId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "", type: "VIDEO" as LessonType, contentUrl: "", contentBody: "",
    duration: 0,
    videoType: "NONE" as LessonVideoType,
    videoUrl: "",
    videoProvider: null as LessonVideoProvider,
    sectionId: "",
    startTimeSeconds: undefined as number | undefined,
    endTimeSeconds: undefined as number | undefined,
    videoSegments: [] as Array<{ title: string; topic: string; startTimeSeconds?: number; summary: string }> ,
    videoTasks: [] as string[],
    sourceCreditName: "",
    sourceCreditUrl: "",
    isFree: false,
  });
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!form.title.trim()) return;
    if (form.videoType === "YOUTUBE" && !isValidYouTubeUrl(form.videoUrl)) {
      setVideoError("YouTube холбоос буруу байна.");
      return;
    }
    if (
      form.videoType === "YOUTUBE" &&
      form.startTimeSeconds !== undefined &&
      form.endTimeSeconds !== undefined &&
      form.startTimeSeconds > form.endTimeSeconds
    ) {
      setVideoError("Сегментийн эхлэх хугацаа дуусах хугацаанаас бага байх ёстой.");
      return;
    }
    setVideoError(null);
    startTransition(async () => {
      const result = await createLesson({
        moduleId,
        ...form,
        videoProvider:
          form.videoType === "YOUTUBE"
            ? "YOUTUBE"
            : form.videoType === "UPLOAD"
              ? "CUSTOM"
              : null,
      });
      if ("error" in result) {
        toast({ type: "error", title: "Алдаа" });
        return;
      }
      toast({ type: "success", title: "Хичээл үүслээ" });
      onCreated();
    });
  };

  return (
    <div className="border-t-2 border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Шинэ хичээл</p>
        <button onClick={onClose}><X size={14} className="text-muted-foreground/80" /></button>
      </div>

      <div className="space-y-1.5">
        <Label>Гарчиг</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Хичээлийн гарчиг" autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Төрөл</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as LessonType })}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="VIDEO">Видео</option>
            <option value="TEXT">Текст</option>
            <option value="PDF">PDF</option>
            <option value="QUIZ">Шалгалт</option>
            <option value="ASSIGNMENT">Даалгавар</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Хугацаа (сек)</Label>
          <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
        </div>
      </div>

      {(form.type === "VIDEO" || form.type === "PDF") && (
        <div className="space-y-1.5">
          <Label>Контентын URL</Label>
          <Input value={form.contentUrl} onChange={(e) => setForm({ ...form, contentUrl: e.target.value })} placeholder="https://youtube.com/..." />
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-violet-100 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Video source</Label>
            <select
              value={form.videoType}
              onChange={(e) => {
                const videoType = e.target.value as LessonVideoType;
                setVideoError(null);
                setForm({
                  ...form,
                  videoType,
                  videoProvider:
                    videoType === "YOUTUBE" ? "YOUTUBE" : videoType === "UPLOAD" ? "CUSTOM" : null,
                });
              }}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="NONE">None</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="UPLOAD">Upload / Custom URL</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Duration (сек)</Label>
            <Input
              type="number"
              min={0}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            />
          </div>
        </div>

        {form.videoType !== "NONE" ? (
          <div className="space-y-1.5">
            <Label>{form.videoType === "YOUTUBE" ? "YouTube URL" : "Video URL"}</Label>
            <Input
              value={form.videoUrl}
              onChange={(e) => {
                setVideoError(null);
                setForm({ ...form, videoUrl: e.target.value });
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {videoError ? <p className="text-xs font-medium text-red-500">{videoError}</p> : null}
          </div>
        ) : null}

        {form.videoType === "YOUTUBE" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Section ID</Label>
                <Input
                  value={form.sectionId}
                  onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                  placeholder="Хиеэлийн хэсгийн нэр"
                />
                <p className="text-xs text-slate-500">Олон хичээл нэг видеоноос хуваахдаа энэ хэсгийг ашиглана.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Эхлэх секунд</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.startTimeSeconds ?? ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setForm({ ...form, startTimeSeconds: e.target.value && v > 0 ? v : undefined });
                  }}
                  placeholder="жишээ: 30"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Дуусах секунд</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.endTimeSeconds ?? ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setForm({ ...form, endTimeSeconds: e.target.value && v > 0 ? v : undefined });
                  }}
                  placeholder="жишээ: 120"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm font-semibold">Видео секцүүд</p>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      videoSegments: [
                        ...form.videoSegments,
                        { title: "", topic: "", summary: "", startTimeSeconds: undefined },
                      ],
                    })
                  }
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  + Секц нэмэх
                </button>
              </div>
              {form.videoSegments.map((segment, index) => (
                <div key={index} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      value={segment.title}
                      onChange={(e) => {
                        const next = [...form.videoSegments];
                        next[index].title = e.target.value;
                        setForm({ ...form, videoSegments: next });
                      }}
                      placeholder="Секцийн нэр"
                    />
                    <Input
                      value={segment.topic}
                      onChange={(e) => {
                        const next = [...form.videoSegments];
                        next[index].topic = e.target.value;
                        setForm({ ...form, videoSegments: next });
                      }}
                      placeholder="Товч агуулга"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={segment.startTimeSeconds ?? ""}
                      onChange={(e) => {
                        const next = [...form.videoSegments];
                        next[index].startTimeSeconds = e.target.value ? Number(e.target.value) : undefined;
                        setForm({ ...form, videoSegments: next });
                      }}
                      placeholder="Эхлэх секунд"
                    />
                  </div>
                  <Textarea
                    rows={2}
                    value={segment.summary}
                    onChange={(e) => {
                      const next = [...form.videoSegments];
                      next[index].summary = e.target.value;
                      setForm({ ...form, videoSegments: next });
                    }}
                    placeholder="Секцийн тайлбар"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...form.videoSegments];
                      next.splice(index, 1);
                      setForm({ ...form, videoSegments: next });
                    }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                  >
                    Секц устгах
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm font-semibold">Үйлдлийн даалгавар</p>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, videoTasks: [...form.videoTasks, ""] })}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  + Даалгавар нэмэх
                </button>
              </div>
              <div className="space-y-2">
                {form.videoTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={task}
                      onChange={(e) => {
                        const next = [...form.videoTasks];
                        next[index] = e.target.value;
                        setForm({ ...form, videoTasks: next });
                      }}
                      placeholder="Даалгаврын текст"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...form.videoTasks];
                        next.splice(index, 1);
                        setForm({ ...form, videoTasks: next });
                      }}
                      className="text-sm font-semibold text-red-500 hover:text-red-600"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Source credit name</Label>
            <Input
              value={form.sourceCreditName}
              onChange={(e) => setForm({ ...form, sourceCreditName: e.target.value })}
              placeholder="YouTube channel / creator"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Source credit URL</Label>
            <Input
              value={form.sourceCreditUrl}
              onChange={(e) => setForm({ ...form, sourceCreditUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {form.type === "TEXT" && (
        <div className="space-y-1.5">
          <Label>Контент</Label>
          <Textarea rows={4} value={form.contentBody} onChange={(e) => setForm({ ...form, contentBody: e.target.value })} placeholder="HTML эсвэл Markdown..." />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={form.isFree}
          onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
          className="accent-slate-900"
        />
        Үнэгүй preview (нэвтрээгүй ч үзэх боломжтой)
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending || !form.title.trim()} className="flex-1">
          {isPending ? <><Loader2 size={13} className="animate-spin mr-1" /> Үүсгэж байна...</> : "Үүсгэх"}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Болих</Button>
      </div>
    </div>
  );
}

export function LessonSectionCreateForm({
  lessonId,
  existingCount,
  onCreated,
}: {
  lessonId: string;
  existingCount: number;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    startSeconds: 0,
    endSeconds: 120,
    taskTitle: "",
    taskDescription: "",
    pdfUrl: "/resources/youtube-section-workbook.pdf",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const youtubeId = getYouTubeVideoId(form.youtubeUrl) ?? form.youtubeUrl.trim();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      setError("YouTube URL эсвэл video ID буруу байна.");
      return;
    }
    if (form.startSeconds < 0 || form.endSeconds <= form.startSeconds) {
      setError("Эхлэх секунд 0-с их/тэнцүү, дуусах секунд эхлэхээс их байх ёстой.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createLessonSection({
        lessonId,
        title: form.title,
        description: form.description,
        youtubeId,
        startSeconds: form.startSeconds,
        endSeconds: form.endSeconds,
        order: existingCount,
        taskTitle: form.taskTitle,
        taskDescription: form.taskDescription,
        pdfUrl: form.pdfUrl,
        resourceUrl: form.pdfUrl,
      });
      if ("error" in result) {
        toast({ type: "error", title: "Section хадгалж чадсангүй" });
        return;
      }
      toast({ type: "success", title: "Section нэмэгдлээ" });
      setForm({
        title: "",
        description: "",
        youtubeUrl: form.youtubeUrl,
        startSeconds: form.endSeconds,
        endSeconds: form.endSeconds + 120,
        taskTitle: "",
        taskDescription: "",
        pdfUrl: "/resources/youtube-section-workbook.pdf",
      });
      onCreated();
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
      <div>
        <p className="text-sm font-semibold text-emerald-900">YouTube section нэмэх</p>
        <p className="text-xs text-emerald-700">
          Нэг YouTube video ID-г timestamp range-ээр олон section болгон хадгална.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Section title" />
        <Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="YouTube URL or video ID" />
      </div>
      <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Section description" />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input type="number" min={0} value={form.startSeconds} onChange={(e) => setForm({ ...form, startSeconds: Number(e.target.value) })} placeholder="Start seconds" />
        <Input type="number" min={1} value={form.endSeconds} onChange={(e) => setForm({ ...form, endSeconds: Number(e.target.value) })} placeholder="End seconds" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={form.taskTitle} onChange={(e) => setForm({ ...form, taskTitle: e.target.value })} placeholder="Task title" />
        <Input value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="/resources/..." />
      </div>
      <Textarea rows={2} value={form.taskDescription} onChange={(e) => setForm({ ...form, taskDescription: e.target.value })} placeholder="Task description" />
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
      <Button size="sm" onClick={submit} disabled={isPending || !form.title.trim()}>
        {isPending ? <><Loader2 size={13} className="animate-spin mr-1" /> Хадгалж байна...</> : "Section хадгалах"}
      </Button>
    </div>
  );
}

// ─── EDIT LESSON FORM ────────────────────────────────────────────────────────

function EditLessonForm({
  lesson,
  onClose,
  onSaved,
}: {
  lesson: Lesson;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: lesson.title,
    type: lesson.type,
    contentUrl: lesson.contentUrl ?? "",
    duration: lesson.duration ?? 0,
    videoType: (lesson.videoType ?? "NONE") as LessonVideoType,
    videoUrl: lesson.videoUrl ?? "",
    videoProvider: (lesson.videoProvider ?? null) as LessonVideoProvider,
    sectionId: lesson.sectionId ?? "",
    // Treat 0 as undefined so inputs display empty
    startTimeSeconds: (lesson.startTimeSeconds ?? 0) > 0 ? lesson.startTimeSeconds! : undefined as number | undefined,
    endTimeSeconds: (lesson.endTimeSeconds ?? 0) > 0 ? lesson.endTimeSeconds! : undefined as number | undefined,
    sourceCreditName: lesson.sourceCreditName ?? "",
    sourceCreditUrl: lesson.sourceCreditUrl ?? "",
    isFree: lesson.isFree,
  });
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!form.title.trim()) return;
    if (form.videoType === "YOUTUBE" && form.videoUrl && !isValidYouTubeUrl(form.videoUrl)) {
      setVideoError("YouTube холбоос буруу байна.");
      return;
    }
    if (
      form.videoType === "YOUTUBE" &&
      form.startTimeSeconds !== undefined &&
      form.endTimeSeconds !== undefined &&
      form.startTimeSeconds >= form.endTimeSeconds
    ) {
      setVideoError("Эхлэх хугацаа дуусах хугацаанаас бага байх ёстой.");
      return;
    }
    setVideoError(null);
    startTransition(async () => {
      const result = await updateLesson(lesson.id, {
        ...form,
        videoProvider:
          form.videoType === "YOUTUBE" ? "YOUTUBE" : form.videoType === "UPLOAD" ? "CUSTOM" : null,
        duration: form.duration || undefined,
        contentUrl: form.contentUrl || undefined,
        videoUrl: form.videoUrl || undefined,
        sectionId: form.sectionId || undefined,
        sourceCreditName: form.sourceCreditName || undefined,
        sourceCreditUrl: form.sourceCreditUrl || undefined,
      });
      if ("error" in result) {
        toast({ type: "error", title: "Алдаа гарлаа" });
        return;
      }
      toast({ type: "success", title: "Хичээл шинэчлэгдлээ ✅" });
      onSaved();
    });
  };

  const handleDelete = () => {
    if (!confirm(`"${lesson.title}" хичээлийг устгах уу?`)) return;
    startTransition(async () => {
      const result = await deleteLesson(lesson.id);
      if ("error" in result) {
        toast({ type: "error", title: result.error as string });
        return;
      }
      toast({ type: "success", title: "Хичээл устгагдлаа" });
      onSaved();
    });
  };

  return (
    <div className="border-t-2 border-violet-400 bg-violet-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-violet-800">Хичээл засах</p>
        <button onClick={onClose}><X size={14} className="text-muted-foreground/80" /></button>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label>Гарчиг</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Хичээлийн гарчиг"
          autoFocus
        />
      </div>

      {/* Type + Duration */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Төрөл</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as LessonType })}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="VIDEO">Видео</option>
            <option value="TEXT">Текст</option>
            <option value="PDF">PDF</option>
            <option value="QUIZ">Шалгалт</option>
            <option value="ASSIGNMENT">Даалгавар</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Хугацаа (сек)</Label>
          <Input
            type="number"
            min={0}
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Legacy contentUrl for PDF */}
      {(form.type === "PDF") && (
        <div className="space-y-1.5">
          <Label>PDF URL</Label>
          <Input
            value={form.contentUrl}
            onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}

      {/* Video section */}
      <div className="space-y-3 rounded-xl border border-violet-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Video source</Label>
            <select
              value={form.videoType}
              onChange={(e) => {
                const videoType = e.target.value as LessonVideoType;
                setVideoError(null);
                setForm({
                  ...form,
                  videoType,
                  videoProvider:
                    videoType === "YOUTUBE" ? "YOUTUBE" : videoType === "UPLOAD" ? "CUSTOM" : null,
                });
              }}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="NONE">None</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="UPLOAD">Upload / Custom URL</option>
            </select>
          </div>
        </div>

        {form.videoType !== "NONE" && (
          <div className="space-y-1.5">
            <Label>{form.videoType === "YOUTUBE" ? "YouTube URL" : "Video URL"}</Label>
            <Input
              value={form.videoUrl}
              onChange={(e) => { setVideoError(null); setForm({ ...form, videoUrl: e.target.value }); }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {videoError && <p className="text-xs font-medium text-red-500">{videoError}</p>}
          </div>
        )}

        {form.videoType === "YOUTUBE" && (
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Section ID</Label>
              <Input
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                placeholder="Хэсгийн нэр"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Эхлэх секунд</Label>
              <Input
                type="number"
                min={1}
                value={form.startTimeSeconds ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm({ ...form, startTimeSeconds: e.target.value && v > 0 ? v : undefined });
                }}
                placeholder="жишээ: 30"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Дуусах секунд</Label>
              <Input
                type="number"
                min={1}
                value={form.endTimeSeconds ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm({ ...form, endTimeSeconds: e.target.value && v > 0 ? v : undefined });
                }}
                placeholder="жишээ: 120"
              />
            </div>
          </div>
        )}

        {(form.videoType === "YOUTUBE") && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Source credit</Label>
              <Input
                value={form.sourceCreditName}
                onChange={(e) => setForm({ ...form, sourceCreditName: e.target.value })}
                placeholder="Channel нэр"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source URL</Label>
              <Input
                value={form.sourceCreditUrl}
                onChange={(e) => setForm({ ...form, sourceCreditUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Free toggle */}
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={form.isFree}
          onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
          className="accent-violet-600"
        />
        Үнэгүй preview
      </label>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending || !form.title.trim()} className="flex-1">
          {isPending ? <><Loader2 size={13} className="animate-spin mr-1" /> Хадгалж байна...</> : "Хадгалах"}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Болих</Button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={12} /> Устгах
        </button>
      </div>
    </div>
  );
}
