"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createCourseSchema, type CreateCourseInput } from "@/modules/courses/domain/schemas";
import { createCourse } from "@/modules/courses/application/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import { ImageUploadField } from "@/components/forms/ImageUploadField";

const LEVELS = [
  { value: "BEGINNER", label: "Эхлэгч" },
  { value: "INTERMEDIATE", label: "Дунд" },
  { value: "ADVANCED", label: "Дэвшилтэт" },
  { value: "ALL_LEVELS", label: "Бүх түвшин" },
] as const;

export function CreateCourseForm() {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [outcomeInput, setOutcomeInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { tags: [], learningOutcomes: [], prerequisites: [], price: 0, level: "ALL_LEVELS" },
  });

  const tags = watch("tags");
  const outcomes = watch("learningOutcomes");
  const thumbnailUrl = watch("thumbnailUrl");

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setValue("tags", [...tags, t]);
      setTagInput("");
    }
  };

  const addOutcome = () => {
    const t = outcomeInput.trim();
    if (t) {
      setValue("learningOutcomes", [...outcomes, t]);
      setOutcomeInput("");
    }
  };

  const onSubmit = async (data: CreateCourseInput) => {
    const result = await createCourse(data);
    if ("error" in result) {
      toast({ type: "error", title: "Алдаа гарлаа", description: "Мэдээллээ шалгана уу" });
      return;
    }
    toast({ type: "success", title: "Курс үүслээ!", description: "Хичээл нэмж эхэлнэ үү" });
    router.push(`/instructor/courses/${result.data?.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Гарчиг *</Label>
        <Input id="title" placeholder="Жишээ: Next.js-ийн иж бүрэн заавар" {...register("title")} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Дэлгэрэнгүй тайлбар *</Label>
        <Textarea id="description" rows={4} placeholder="Курсийн агуулга, зорилго, хамрах хүрээг тайлбарлана уу..." {...register("description")} />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      {/* Short description */}
      <div className="space-y-1.5">
        <Label htmlFor="shortDescription">Богино тайлбар</Label>
        <Input id="shortDescription" placeholder="Курсийн 1-2 өгүүлбэр тайлбар" {...register("shortDescription")} />
      </div>

      <input type="hidden" {...register("thumbnailUrl")} />
      <ImageUploadField
        value={thumbnailUrl}
        folder="courses"
        label="Курсийн cover зураг"
        helper="Landing page болон course card дээр харагдах 16:9 зураг"
        onChange={(url) => setValue("thumbnailUrl", url, { shouldDirty: true, shouldValidate: true })}
        onClear={() => setValue("thumbnailUrl", "", { shouldDirty: true, shouldValidate: true })}
      />

      {/* Level + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Түвшин</Label>
          <select
            {...register("level")}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Үнэ (MNT)</Label>
          <Input id="price" type="number" min={0} placeholder="0 = үнэгүй" {...register("price", { valueAsNumber: true })} />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Шошго (tag)</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Шошго оруулаад Enter дарна уу"
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag}>
            <Plus size={15} />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground text-xs rounded-full">
                {t}
                <button type="button" onClick={() => setValue("tags", tags.filter((x) => x !== t))}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Learning outcomes */}
      <div className="space-y-1.5">
        <Label>Сурах зорилт *</Label>
        <div className="flex gap-2">
          <Input
            value={outcomeInput}
            onChange={(e) => setOutcomeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOutcome(); } }}
            placeholder="Юу сурах вэ?"
          />
          <Button type="button" variant="outline" size="icon" onClick={addOutcome}>
            <Plus size={15} />
          </Button>
        </div>
        {errors.learningOutcomes && <p className="text-xs text-red-500">{errors.learningOutcomes.message}</p>}
        {outcomes.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                <span className="flex-1">{o}</span>
                <button type="button" onClick={() => setValue("learningOutcomes", outcomes.filter((_, j) => j !== i))}>
                  <X size={13} className="text-muted-foreground/80 hover:text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg" className="flex-1">
          {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Үүсгэж байна...</> : "Курс үүсгэх"}
        </Button>
      </div>
    </form>
  );
}
