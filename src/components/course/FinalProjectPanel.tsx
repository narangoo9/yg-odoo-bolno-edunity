"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Award, Lock, Send, Star, CheckCircle2 } from "lucide-react";
import {
  assertMongolianSpellOk,
  MongolianSpellTextarea,
} from "@/components/mongolian/MongolianSpellTextarea";

interface FinalProjectState {
  unlocked: boolean;
  lessonsComplete: boolean;
  reviewsGiven: number;
  reviewsRequired: number;
  submission: {
    id: string;
    title: string;
    description: string;
    demoUrl: string | null;
    githubUrl: string | null;
    status: string;
    reviewCount: number;
    passed: boolean;
    reviews: Array<{
      starRating: number;
      decision: string;
      feedback: string;
    }>;
  } | null;
}

interface Props {
  courseId: string;
  initial: FinalProjectState | null;
  certificate: { id: string; certificateNo: string } | null;
  onSubmitted?: () => void;
}

export function FinalProjectPanel({ courseId, initial, certificate, onSubmitted }: Props) {
  const [state, setState] = useState<FinalProjectState | null>(initial);
  const [title, setTitle] = useState(initial?.submission?.title ?? "");
  const [description, setDescription] = useState(initial?.submission?.description ?? "");
  const [demoUrl, setDemoUrl] = useState(initial?.submission?.demoUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(initial?.submission?.githubUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unlocked = state?.unlocked ?? false;
  const submission = state?.submission ?? null;
  const canEdit = !submission || (submission.reviewCount === 0 && submission.status !== "PASSED");

  const refresh = async () => {
    const res = await fetch(`/api/v1/learning/project-status?courseId=${courseId}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { data: FinalProjectState };
    setState(json.data);
  };

  const submit = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const spell = await assertMongolianSpellOk(description.trim());
      if (!spell.ok) {
        setError(spell.message);
        return;
      }
      const res = await fetch("/api/v1/learning/project-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: title.trim(),
          description: description.trim(),
          demoUrl: demoUrl.trim(),
          githubUrl: githubUrl.trim(),
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? "Илгээхэд алдаа гарлаа");
        return;
      }
      setSuccess("Final Project амжилттай илгээгдлээ. Peer review хүлээнэ үү.");
      await refresh();
      onSubmitted?.();
    });
  };

  if (certificate) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">Certificate нээгдсэн</p>
            <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">{certificate.certificateNo}</p>
            <Link
              href={`/student/certificates/${certificate.id}`}
              className="mt-3 inline-flex text-xs font-bold text-emerald-700 underline dark:text-emerald-300"
            >
              Certificate харах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-5 dark:border-violet-900/30 dark:bg-violet-950/20">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 text-violet-500" />
          <div>
            <p className="text-sm font-black text-foreground">Final Project түгжээтэй</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Бүх хичээлийг дор хаяж 90%-ийг үзэж дуусгасны дараа нээгдэнэ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50/60 p-5 dark:border-violet-900/30 dark:from-violet-950/30 dark:to-fuchsia-950/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-foreground">Final Project</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Төслөө илгээж, 3 peer review + 2 review өгсний дараа certificate нээгдэнэ.
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
          {state?.reviewsGiven ?? 0}/{state?.reviewsRequired ?? 2} reviews given
        </span>
      </div>

      {submission ? (
        <div className="mb-4 space-y-2 rounded-xl border border-white/60 bg-white/70 p-4 dark:border-violet-900/20 dark:bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-foreground">{submission.title}</p>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
              {submission.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{submission.description}</p>
          <p className="text-xs text-muted-foreground">
            {submission.reviewCount} peer review · {submission.passed ? "Passed" : "In progress"}
          </p>
          {submission.reviews.length > 0 && (
            <div className="space-y-2 pt-2">
              {submission.reviews.map((review, index) => (
                <div key={index} className="rounded-lg bg-muted/50 p-2 text-xs">
                  <div className="flex items-center gap-1 font-bold">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {review.starRating}/5 · {review.decision}
                  </div>
                  <p className="mt-1 text-muted-foreground">{review.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {canEdit ? (
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Төслийн гарчиг"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <MongolianSpellTextarea
            value={description}
            onChange={setDescription}
            rows={4}
            label="Тайлбар"
            placeholder="Тайлбар (20+ тэмдэгт, монгол кирилл)"
          />
          <input
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="Demo / project link"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="GitHub link (optional)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
          {success ? <p className="text-xs font-semibold text-emerald-600">{success}</p> : null}
          <button
            type="button"
            disabled={isPending}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Send size={14} />
            {isPending ? "Илгээж байна..." : submission ? "Шинэчлэх" : "Төсөл илгээх"}
          </button>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 size={14} className="text-emerald-500" />
          Review эхэлсэн тул засварлах боломжгүй.
        </p>
      )}

      <Link
        href="/student/peer-review"
        className="mt-4 inline-flex text-xs font-bold text-violet-700 hover:underline dark:text-violet-300"
      >
        Peer review queue руу очих →
      </Link>
    </section>
  );
}
