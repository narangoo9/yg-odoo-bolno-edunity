"use client";

import { useState } from "react";
import { Loader2, BookOpen, PlayCircle } from "lucide-react";
import { enrollCourse } from "@/modules/courses/application/actions";
import { toast } from "@/components/ui/toaster";

interface EnrollButtonProps {
  courseId: string;
  hasCourseAccess: boolean;
}

export function EnrollButton({ courseId, hasCourseAccess }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const result = await enrollCourse({ courseId });

      if (result && "error" in result) {
        toast({ type: "error", title: "Алдаа", description: result.error as string });
      }
    } catch {
      toast({ type: "error", title: "Алдаа гарлаа", description: "Дахин оролдоно уу" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[.99] disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Бүртгэж байна...
        </>
      ) : hasCourseAccess ? (
        <>
          <BookOpen size={16} /> Курс эхлүүлэх
        </>
      ) : (
        <>
          <PlayCircle size={16} /> Free preview эхлүүлэх
        </>
      )}
    </button>
  );
}

