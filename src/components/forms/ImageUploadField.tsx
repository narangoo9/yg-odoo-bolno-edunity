"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  category?: "IMAGE" | "AVATAR";
  folder: string;
  label?: string;
  helper?: string;
  shape?: "circle" | "cover";
  className?: string;
}

interface UploadResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

export function ImageUploadField({
  value,
  onChange,
  onClear,
  category = "IMAGE",
  folder,
  label = "Зураг",
  helper = "JPG, PNG, WEBP зураг upload хийж болно",
  shape = "cover",
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ type: "error", title: "Зөвхөн зураг сонгоно уу" });
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("folder", folder);

      const response = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as UploadResponse;

      if (!response.ok || !result.success || !result.data?.url) {
        toast({
          type: "error",
          title: "Зураг оруулахад алдаа гарлаа",
          description: result.error ?? "Дахин оролдоно уу.",
        });
        return;
      }

      onChange(result.data.url);
      toast({ type: "success", title: "Зураг upload хийгдлээ" });
    } catch {
      toast({
        type: "error",
        title: "Сүлжээний алдаа",
        description: "Зураг upload хийж чадсангүй.",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Зураг арилгах"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "group relative flex items-center justify-center overflow-hidden border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-violet-300 hover:bg-violet-50/60 disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-violet-900/10",
          shape === "circle" ? "h-24 w-24 rounded-full" : "aspect-[16/9] w-full rounded-xl",
        )}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs font-medium">
            {shape === "circle" ? <Camera size={18} /> : <ImagePlus size={22} />}
            Зураг сонгох
          </span>
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-xs font-semibold text-white group-hover:flex">
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : "Солих"}
        </span>
      </button>
    </div>
  );
}
