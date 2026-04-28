"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { programSchema, type ProgramInput } from "@/modules/programs/domain/schemas";
import { createProgram } from "@/modules/programs/application/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/forms/ImageUploadField";

export default function NewProgramPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProgramInput>({ resolver: zodResolver(programSchema) });

  const titleValue = watch("title", "");
  const thumbnailUrl = watch("thumbnailUrl");

  const onSubmit = async (data: ProgramInput) => {
    setError(null);
    const result = await createProgram(data);

    if ("error" in result) {
      if (typeof result.error === "string") {
        setError(result.error);
      } else {
        setError("Алдаа гарлаа. Талбаруудыг шалгана уу.");
      }
      return;
    }

    router.push(`/org/programs/${result.program.id}`);
    router.refresh();
  };

  const generateSlug = () => {
    const slug = titleValue
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 60);
    setValue("slug", slug);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Шинэ программ үүсгэх</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Программ нь олон курсаас бүрдэх бөгөөд дуусгасан суралцагчид байгууллагын сертификат авна.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card border border-border rounded-2xl p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Программын нэр</Label>
          <Input id="title" placeholder="Жишээ: Веб хөгжүүлэгч болох зам" {...register("title")} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug">URL нэр (slug)</Label>
            <button type="button" onClick={generateSlug} className="text-xs text-muted-foreground hover:text-foreground underline">
              Автоматаар үүсгэх
            </button>
          </div>
          <Input id="slug" placeholder="web-developer-path" {...register("slug")} />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Тайлбар</Label>
          <textarea
            id="description"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            placeholder="Программын дэлгэрэнгүй тайлбар..."
            {...register("description")}
          />
        </div>

        <ImageUploadField
          value={thumbnailUrl}
          folder="programs"
          label="Программын cover зураг"
          helper="Program card дээр харагдах 16:9 зураг"
          onChange={(url) => setValue("thumbnailUrl", url, { shouldDirty: true, shouldValidate: true })}
          onClear={() => setValue("thumbnailUrl", "", { shouldDirty: true, shouldValidate: true })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="certificateTitle">Сертификатын гарчиг</Label>
            <Input id="certificateTitle" placeholder="Веб хөгжүүлэгч" {...register("certificateTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="thumbnailUrl">Зураг URL</Label>
            <Input id="thumbnailUrl" type="url" placeholder="https://..." {...register("thumbnailUrl")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="certificateDescription">Сертификатын тайлбар</Label>
          <Input
            id="certificateDescription"
            placeholder="Энэхүү сертификат нь... дуусгасан болохыг гэрчилнэ"
            {...register("certificateDescription")}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isOrdered"
            {...register("isOrdered")}
            className="w-4 h-4 rounded accent-slate-900"
          />
          <Label htmlFor="isOrdered" className="font-normal">
            Курсуудыг дарааллаар дуусгахыг шаардах
          </Label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Цуцлах
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Үүсгэж байна...
              </>
            ) : (
              "Программ үүсгэх"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
