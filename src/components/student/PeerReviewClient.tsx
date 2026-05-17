"use client";

import { useState, useTransition } from "react";
import { Star, FileText, Award, Clock, CheckCircle2, Send, Users, BookOpen, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { getInitials, cn } from "@/lib/utils";
import { submitPeerReview } from "@/modules/capstones/application/actions";
import { toast } from "@/components/ui/toaster";

const RUBRIC = [
  { key: "content",      label: "Content Quality",       desc: "Depth and accuracy of the subject matter" },
  { key: "structure",    label: "Structure & Clarity",    desc: "Organization, flow, and readability" },
  { key: "originality",  label: "Originality",            desc: "Creative thinking and unique approach" },
  { key: "completeness", label: "Completeness",           desc: "All requirements addressed" },
];

interface Capstone {
  id: string; title: string; description: string | null;
  submissionUrl: string | null; status: string; score: number | null;
  submittedAt: Date | string | null;
  course: { id: string; title: string; thumbnailUrl: string | null } | null;
  reviews: { id: string; reviewerId: string; score: number | null; feedback: string | null; isCompleted: boolean }[];
}
interface AssignedReview {
  id: string;
  capstone: Omit<Capstone, "reviews"> & { student: { name: string; avatarUrl: string | null } };
}
interface PendingCapstone extends Omit<Capstone, "course"> {
  student: { name: string; avatarUrl: string | null };
  course: { id: string; title: string } | null;
}

interface Props {
  currentUserId: string;
  myCapstones: Capstone[];
  assignedReviews: AssignedReview[];
  pendingCapstones: PendingCapstone[];
}

type Tab = "mine" | "review" | "pending";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    DRAFT:        { label: "Draft",        className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
    SUBMITTED:    { label: "Submitted",    className: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" },
    UNDER_REVIEW: { label: "Under Review", className: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
    GRADED:       { label: "Graded ✓",    className: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
    REJECTED:     { label: "Rejected",     className: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400" },
  };
  const s = map[status] ?? map.DRAFT;
  return <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", s.className)}>{s.label}</span>;
}

function RubricSlider({ label, desc, value, onChange }: {
  label: string; desc: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
        <span className={cn(
          "text-[14px] font-black tabular-nums w-8 text-right",
          value >= 80 ? "text-emerald-500" : value >= 60 ? "text-amber-500" : "text-red-500"
        )}>
          {value}
        </span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-muted rounded-full accent-violet-600 cursor-pointer"
      />
    </div>
  );
}

function ReviewModal({ capstone, onClose }: {
  capstone: AssignedReview["capstone"]; onClose: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({
    content: 70, structure: 70, originality: 70, completeness: 70,
  });
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / RUBRIC.length);

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast({ type: "warning", title: "Please provide written feedback" });
      return;
    }
    startTransition(async () => {
      const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / RUBRIC.length);
      const result = await submitPeerReview({ capstoneId: capstone.id, score: avgScore, feedback, rubricScores: scores });
      if ("error" in result) {
        toast({ type: "error", title: "Error submitting review" });
        return;
      }
      toast({ type: "success", title: "Review submitted! +30 XP earned" });
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#13102a] rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-black text-foreground">{capstone.title}</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{capstone.course?.title}</p>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-violet-100 dark:bg-violet-500/15 rounded-xl">
              <Star size={11} className="text-violet-500" />
              <span className="text-[12px] font-black text-violet-700 dark:text-violet-300">{avgScore}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          {capstone.submissionUrl && (
            <a href={capstone.submissionUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-violet-600 dark:text-violet-400 font-semibold hover:underline">
              <FileText size={11} /> View Submission
            </a>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Rubric sliders */}
          <div className="space-y-4">
            {RUBRIC.map(r => (
              <RubricSlider
                key={r.key}
                label={r.label}
                desc={r.desc}
                value={scores[r.key] ?? 70}
                onChange={v => setScores(prev => ({ ...prev, [r.key]: v }))}
              />
            ))}
          </div>

          {/* Overall score display */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black",
              avgScore >= 80 ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600" :
              avgScore >= 60 ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600" :
              "bg-red-100 dark:bg-red-900/20 text-red-600"
            )}>
              {avgScore}
            </div>
            <div>
              <p className="text-[12px] font-bold text-foreground">Average Score</p>
              <p className="text-[10px] text-muted-foreground">
                {avgScore >= 80 ? "Excellent work!" : avgScore >= 60 ? "Good effort" : "Needs improvement"}
              </p>
            </div>
          </div>

          {/* Written feedback */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-foreground">Written Feedback *</label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
              placeholder="Provide constructive feedback on the submission. Be specific and helpful..."
              className="w-full px-3 py-2.5 text-[12px] bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 resize-none text-foreground placeholder:text-muted-foreground"
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground text-right">{feedback.length}/1000</p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending || !feedback.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending ? "Submitting..." : <><Send size={13} /> Submit Review</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PeerReviewClient({ myCapstones, assignedReviews, pendingCapstones }: Props) {
  const [tab, setTab] = useState<Tab>("mine");
  const [activeReview, setActiveReview] = useState<AssignedReview | null>(null);

  const pendingMyReviews = assignedReviews.length;

  return (
    <div className="max-w-3xl space-y-5 animate-fade-up">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-xl font-black text-foreground flex items-center gap-2">
          <Users size={20} className="text-violet-500" />
          Peer Grading
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete peer reviews to unlock your certificate and earn XP
        </p>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: FileText, label: "Submit Final Task", desc: "Complete the last lesson task", color: "bg-violet-100 dark:bg-violet-500/15 text-violet-600" },
          { icon: Users,    label: "Peer Reviews",      desc: "3 classmates grade your work", color: "bg-amber-100 dark:bg-amber-500/15 text-amber-600" },
          { icon: Award,    label: "Get Certificate",   desc: "Earn your completion cert", color: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-3.5 text-center">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2", s.color)}>
              <s.icon size={14} />
            </div>
            <p className="text-[12px] font-bold text-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {([
          { key: "mine",    label: "My Submissions", count: myCapstones.length },
          { key: "review",  label: "To Review",      count: pendingMyReviews },
          { key: "pending", label: "Awaiting Peers",  count: pendingCapstones.length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all",
              tab === t.key
                ? "bg-white dark:bg-[#0d0b1f] shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                t.key === "review" ? "bg-violet-600 text-white" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MY CAPSTONES ── */}
      {tab === "mine" && (
        <div className="space-y-3">
          {myCapstones.map(cap => {
            const reviewsDone = cap.reviews.filter(r => r.isCompleted).length;
            const avgScore = cap.reviews.filter(r => r.score != null).length > 0
              ? Math.round(cap.reviews.filter(r => r.score != null).reduce((s, r) => s + (r.score ?? 0), 0) / cap.reviews.filter(r => r.score != null).length)
              : null;

            return (
              <div key={cap.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground">{cap.title}</p>
                    {cap.course && <p className="text-[11px] text-muted-foreground">{cap.course.title}</p>}
                  </div>
                  <StatusBadge status={cap.status} />
                </div>

                {cap.description && (
                  <p className="text-[12px] text-foreground/70 mb-3 line-clamp-2">{cap.description}</p>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{reviewsDone}/3 reviews</span>
                  </div>
                  {avgScore !== null && (
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-500 fill-amber-400" />
                      <span className="text-[11px] font-bold text-foreground">{avgScore}/100</span>
                    </div>
                  )}
                  {cap.status === "GRADED" && (
                    <div className="flex items-center gap-1.5">
                      <Award size={12} className="text-emerald-500" />
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Certificate unlocked!</span>
                    </div>
                  )}
                </div>

                {/* Reviews progress */}
                {cap.status === "UNDER_REVIEW" && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[9px]",
                          i < reviewsDone
                            ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {i < reviewsDone ? <CheckCircle2 size={12} className="text-emerald-500" /> : i + 1}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Waiting for peer reviews</span>
                  </div>
                )}
              </div>
            );
          })}
          {myCapstones.length === 0 && (
            <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
              <FileText size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-foreground">No submissions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete your course final tasks to submit here</p>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEWS TO DO ── */}
      {tab === "review" && (
        <div className="space-y-3">
          {assignedReviews.map(review => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-4 hover:border-violet-200 dark:hover:border-violet-800/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={review.capstone.student.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-violet-100 dark:bg-violet-800 text-violet-700">
                      {getInitials(review.capstone.student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{review.capstone.title}</p>
                    <p className="text-[10px] text-muted-foreground">{review.capstone.course?.title}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock size={11} />
                  <span>Review due soon</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                  <Star size={11} />
                  <span>+30 XP reward</span>
                </div>
              </div>
              <button
                onClick={() => setActiveReview(review)}
                className="mt-3 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-bold rounded-xl transition-colors"
              >
                Start Review
              </button>
            </div>
          ))}
          {assignedReviews.length === 0 && (
            <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
              <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No pending reviews assigned to you</p>
            </div>
          )}
        </div>
      )}

      {/* ── PENDING CAPSTONES (queue) ── */}
      {tab === "pending" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              These submissions need reviewers. You earn XP for each completed review. Reviews are anonymous to submitters.
            </p>
          </div>
          {pendingCapstones.map(cap => (
            <div key={cap.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <FileText size={14} className="text-violet-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground">{cap.title}</p>
                  <p className="text-[10px] text-muted-foreground">{cap.course?.title}</p>
                </div>
                <span className="ml-auto text-[10px] text-muted-foreground">{cap.reviews.length}/3 reviews</span>
              </div>
            </div>
          ))}
          {pendingCapstones.length === 0 && (
            <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
              <BookOpen size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-foreground">No submissions to review</p>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {activeReview && (
        <ReviewModal
          capstone={activeReview.capstone}
          onClose={() => setActiveReview(null)}
        />
      )}
    </div>
  );
}
