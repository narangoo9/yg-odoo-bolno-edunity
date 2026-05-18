"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Award, CheckCircle2, FileText, Send, Star, Users } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  assignSectionTaskReview,
  submitSectionTaskReview,
} from "@/modules/learning/application/task-actions";
import { toast } from "@/components/ui/toaster";
import {
  assertMongolianSpellOk,
  MongolianSpellTextarea,
} from "@/components/mongolian/MongolianSpellTextarea";

const rubric = [
  { key: "understanding", label: "Understanding" },
  { key: "execution", label: "Execution" },
  { key: "clarity", label: "Clarity" },
  { key: "completeness", label: "Completeness" },
];

interface SectionTaskSubmission {
  id: string;
  title: string;
  content: string;
  submissionUrl: string | null;
  status: string;
  score: number | null;
  submittedAt: Date | string;
  course: { title: string };
  section: { title: string; order: number };
  student?: { name: string; avatarUrl: string | null };
  reviews: { id: string; isCompleted: boolean; score: number | null }[];
}

interface AssignedTaskReview {
  id: string;
  submission: SectionTaskSubmission & {
    student: { name: string; avatarUrl: string | null };
  };
}

interface Props {
  myTasks: SectionTaskSubmission[];
  assignedReviews: AssignedTaskReview[];
  pendingTasks: Array<SectionTaskSubmission & { student: { name: string; avatarUrl: string | null } }>;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "GRADED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
      : status === "UNDER_REVIEW"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";

  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", className)}>{status}</span>;
}

function ReviewModal({ submission, onClose }: { submission: AssignedTaskReview["submission"]; onClose: () => void }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({
    understanding: 75,
    execution: 75,
    clarity: 75,
    completeness: 75,
  });
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const avg = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / rubric.length);

  const submit = () => {
    if (feedback.trim().length < 10) {
      toast({ type: "warning", title: "Feedback хамгийн багадаа 10 тэмдэгт байх ёстой" });
      return;
    }

    startTransition(async () => {
      const spell = await assertMongolianSpellOk(feedback.trim());
      if (!spell.ok) {
        toast({ type: "warning", title: spell.message });
        return;
      }
      const result = await submitSectionTaskReview({
        submissionId: submission.id,
        score: avg,
        feedback,
        rubricScores: scores,
      });
      if ("error" in result) {
        toast({ type: "error", title: "Review хадгалахад алдаа гарлаа" });
        return;
      }
      toast({ type: "success", title: result.certificate ? "Review дууслаа. Certificate нээгдлээ!" : "Review дууслаа" });
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
        <div className="border-b border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-violet-600">
                {submission.course.title} · Section {submission.section.order}
              </p>
              <h2 className="mt-1 text-base font-black text-foreground">{submission.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Submitted by {submission.student.name}</p>
            </div>
            <div className="rounded-xl bg-violet-100 px-3 py-1 text-sm font-black text-violet-700">{avg}/100</div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-muted p-3 text-sm leading-6 text-foreground/80">{submission.content}</div>
          {submission.submissionUrl ? (
            <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:underline">
              <FileText size={14} /> View submission link
            </a>
          ) : null}

          {rubric.map((item) => (
            <label key={item.key} className="block">
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-foreground">
                <span>{item.label}</span>
                <span>{scores[item.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scores[item.key]}
                onChange={(event) => setScores((current) => ({ ...current, [item.key]: Number(event.target.value) }))}
                className="w-full accent-violet-600"
              />
            </label>
          ))}

          <MongolianSpellTextarea
            value={feedback}
            onChange={setFeedback}
            rows={4}
            label="Feedback"
            placeholder="Сайжруулах санал болон үнэлгээний тайлбар (кирилл)..."
          />

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="button" disabled={isPending} onClick={submit} className="flex-1 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50">
              {isPending ? "Saving..." : "Submit review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionTaskPeerReviewClient({ myTasks, assignedReviews, pendingTasks }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<AssignedTaskReview["submission"] | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const claimReview = async (submission: Props["pendingTasks"][number]) => {
    setAssigningId(submission.id);
    const result = await assignSectionTaskReview(submission.id);
    setAssigningId(null);
    if ("error" in result) {
      toast({ type: "error", title: "Review авах боломжгүй байна" });
      return;
    }
    setActive({ ...submission, student: submission.student });
    router.refresh();
  };

  return (
    <section className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <Users size={18} className="text-violet-500" />
            YouTube task peer review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Video section бүрийн task-ийг бусад суралцагч review хийж, бүх task үнэлэгдсэний дараа certificate нээгдэнэ.
          </p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
          {assignedReviews.length} review
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-black text-muted-foreground">My tasks</p>
          <p className="mt-1 text-2xl font-black text-foreground">{myTasks.length}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-black text-muted-foreground">To review</p>
          <p className="mt-1 text-2xl font-black text-foreground">{assignedReviews.length}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-black text-muted-foreground">Open queue</p>
          <p className="mt-1 text-2xl font-black text-foreground">{pendingTasks.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {assignedReviews.map((review) => (
          <article key={review.id} className="rounded-xl border border-violet-100 bg-violet-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-foreground">{review.submission.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {review.submission.course.title} · {review.submission.student.name}
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-violet-700">+20 XP</span>
            </div>
            <button onClick={() => setActive(review.submission)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500">
              <Star size={14} /> Review хийх
            </button>
          </article>
        ))}
      </div>

      {pendingTasks.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Review queue</p>
          {pendingTasks.map((submission) => (
            <article key={submission.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">{submission.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {submission.course.title} · {submission.student.name} · {formatDate(new Date(submission.submittedAt))}
                  </p>
                </div>
                <StatusBadge status={submission.status} />
              </div>
              <button
                onClick={() => void claimReview(submission)}
                disabled={assigningId === submission.id}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                <Send size={14} /> {assigningId === submission.id ? "Assigning..." : "Review авах"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {myTasks.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">My submitted YouTube tasks</p>
          {myTasks.slice(0, 5).map((task) => {
            const done = task.reviews.filter((review) => review.isCompleted).length;
            return (
              <article key={task.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.course.title} · Section {task.section.order}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> {done}/{task.reviews.length} reviews</span>
                  {task.score != null ? <span className="inline-flex items-center gap-1"><Award size={12} /> {Math.round(task.score)}/100</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {active ? <ReviewModal submission={active} onClose={() => setActive(null)} /> : null}
    </section>
  );
}
