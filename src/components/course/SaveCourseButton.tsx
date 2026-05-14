"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toggleSavedCourse } from "@/modules/courses/application/actions";
import { toast } from "@/components/ui/toaster";

interface SaveCourseButtonProps {
  courseId: string;
  initialSaved?: boolean;
  size?: number;
  className?: string;
}

export function SaveCourseButton({
  courseId,
  initialSaved = false,
  size = 14,
  className = "",
}: SaveCourseButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        const result = await toggleSavedCourse(courseId);
        setSaved(result.saved);
        toast({
          type: "success",
          title: result.saved ? "Хадгаллаа" : "Хадгалсанаас хасав",
        });
        // Refresh so server components (saved page, catalog) reflect the new state
        router.refresh();
      } catch {
        toast({ type: "error", title: "Алдаа гарлаа" });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={saved ? "Хадгалсанаас хасах" : "Хадгалах"}
      aria-label={saved ? "Хадгалсанаас хасах" : "Хадгалах"}
      className={`flex items-center justify-center rounded-lg transition-all disabled:opacity-50 ${
        saved
          ? "bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-400"
          : "bg-white/80 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:bg-slate-800/80 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
      } ${className}`}
    >
      <Bookmark
        size={size}
        className={saved ? "fill-violet-600 dark:fill-violet-400" : ""}
      />
    </button>
  );
}
