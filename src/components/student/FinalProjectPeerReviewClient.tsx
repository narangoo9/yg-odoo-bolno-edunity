"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Star, Users } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import {
  assertMongolianSpellOk,
  MongolianSpellTextarea,
} from "@/components/mongolian/MongolianSpellTextarea";
import { cn } from "@/lib/utils";

const rubric = [
  { key: "rubricUnderstanding", label: "Understanding" },
  { key: "rubricEffort", label: "Effort" },
  { key: "rubricFunctionality", label: "Functionality" },
  { key: "rubricDesign", label: "Design/Presentation" },
] as const;

type RubricKey = (typeof rubric)[number]["key"];

interface QueueItem {
  id: string;
  title: string;
  description: string;
  demoUrl: string | null;
  githubUrl: string | null;
  status: string;
  reviewCount: number;
  student: { name: string; avatarUrl: string | null };
  course: { id: string; title: string };
}

export function FinalProjectPeerReviewClient({ initialQueue }: { initialQueue: QueueItem[] }) {
  const router = useRouter();
  const [active, setActive] = useState<QueueItem | null>(null);
  const [starRating, setStarRating] = useState(4);
  const [scores, setScores] = useState<Record<RubricKey, number>>({
    rubricUnderstanding: 75,
    rubricEffort: 75,
    rubricFunctionality: 75,
    rubricDesign: 75,
  });
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState<"PASS" | "NEEDS_IMPROVEMENT">("PASS");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!active) return;
    if (feedback.trim().length < 10) {
      toast({ type: "warning", title: "Feedback хамгийн багадаа 10 тэмдэгт" });
      return;
    }

    startTransition(async () => {
      const spell = await assertMongolianSpellOk(feedback.trim());
      if (!spell.ok) {
        toast({ type: "warning", title: spell.message });
        return;
      }

      const res = await fetch("/api/v1/peer-review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: active.id,
          starRating,
          ...scores,
          feedback: feedback.trim(),
          decision,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string; certificate?: unknown };
      if (!res.ok || !json.success) {
        toast({ type: "error", title: json.error ?? "Review хадгалахад алдаа" });
        return;
      }
      toast({
        type: "success",
        title: json.certificate ? "Review хадгалагдлаа. Certificate нээгдлээ!" : "Review хадгалагдлаа",
      });
      setActive(null);
      router.refresh();
    });
  };

  return (
    <section className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <Users size={18} className="text-violet-500" />
            Final Project peer review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Курсын төслүүдийг үнэлнэ. Өөрийн төслийг review хийх боломжгүй.
          </p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
          {initialQueue.length} queue
        </span>
      </div>

      <div className="space-y-2">
        {initialQueue.length === 0 ? (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Одоогоор review хийх төсөл алга.</p>
        ) : (
          initialQueue.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-left hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.course.title} · {item.student.name} · {item.reviewCount} reviews
                </p>
              </div>
              <span className="shrink-0 text-xs font-black text-violet-600">Review →</span>
            </button>
          ))
        )}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-black">{active.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{active.course.title} · {active.student.name}</p>
            <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-6">{active.description}</p>
            {active.demoUrl ? (
              <a href={active.demoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-violet-600">
                <FileText size={14} /> Demo link
              </a>
            ) : null}

            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase text-muted-foreground">Star rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setStarRating(star)} className="p-1">
                    <Star size={20} className={cn(star <= starRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            </div>

            {rubric.map((item) => (
              <label key={item.key} className="mt-3 block">
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>{item.label}</span>
                  <span>{scores[item.key]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scores[item.key]}
                  onChange={(e) => setScores((c) => ({ ...c, [item.key]: Number(e.target.value) }))}
                  className="w-full accent-violet-600"
                />
              </label>
            ))}

            <div className="mt-4 flex gap-2">
              {(["PASS", "NEEDS_IMPROVEMENT"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDecision(value)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-black",
                    decision === value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-border",
                  )}
                >
                  {value === "PASS" ? "Pass" : "Needs improvement"}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <MongolianSpellTextarea
                value={feedback}
                onChange={setFeedback}
                rows={4}
                label="Feedback (монгол кирилл)"
                placeholder="Үнэлгээний тайлбар..."
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setActive(null)} className="flex-1 rounded-xl border border-border py-2 text-sm font-bold">
                Cancel
              </button>
              <button type="button" disabled={isPending} onClick={submit} className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-bold text-white disabled:opacity-50">
                {isPending ? "Saving..." : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
