"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { approveCourse, rejectCourse } from "@/modules/admin/application/moderation-actions";

export function CourseApprovalActions({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (action: "approve" | "reject") => {
    startTransition(async () => {
      const result = action === "approve" ? await approveCourse(courseId) : await rejectCourse(courseId);
      if ("error" in result && result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("approve")}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
        Зөвшөөрөх
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("reject")}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60"
      >
        <X size={11} />
        Татгалзах
      </button>
    </div>
  );
}
