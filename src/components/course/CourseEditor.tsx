"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, GripVertical, ChevronDown, Play, FileText,
  BookOpen, Globe, Archive, Loader2, X,
} from "lucide-react";
import {
  createModule, deleteModule, createLesson, publishCourse, unpublishCourse, updateCourse,
} from "@/modules/courses/application/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ImageUploadField } from "@/components/forms/ImageUploadField";

type LessonType = "VIDEO" | "TEXT" | "PDF" | "ASSIGNMENT" | "QUIZ" | "LIVE_SESSION";

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: number | null;
  isFree: boolean;
  orderIndex: number;
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
  const [coverUrl, setCoverUrl] = useState(thumbnailUrl);
  const [isPending, startTransition] = useTransition();

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  const handlePublish = () => {
    startTransition(async () => {
      const result = status === "PUBLISHED" ? await unpublishCourse(courseId) : await publishCourse(courseId);
      if ("error" in result) {
        toast({ type: "error", title: "Алдаа", description: typeof result.error === "string" ? result.error : "Дахин оролдоно уу" });
        return;
      }
      toast({
        type: "success",
        title: status === "PUBLISHED" ? "Хэвлэлээс хурдан авлаа" : "Нийтэд нээгдлээ",
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
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-border hover:bg-muted/50 group">
                        <GripVertical size={13} className="text-muted-foreground/60 cursor-grab" />
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Icon size={13} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground/80">
                            {lesson.type}
                            {lesson.duration && ` · ${Math.ceil(lesson.duration / 60)}м`}
                            {lesson.isFree && " · Үнэгүй"}
                          </p>
                        </div>
                        <button className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          Засах
                        </button>
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
    duration: 0, isFree: false,
  });
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!form.title.trim()) return;
    startTransition(async () => {
      const result = await createLesson({ moduleId, ...form });
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
