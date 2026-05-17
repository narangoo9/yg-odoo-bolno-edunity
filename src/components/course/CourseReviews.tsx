"use client";

import { useState } from "react";
import { Star, MessageSquare, Edit2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/index";
import { getInitials, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  student: { id: string; name: string; avatarUrl: string | null };
}

interface Props {
  courseId: string;
  reviews: Review[];
  currentUserId: string;
  myReview?: Review | null;
  canReview?: boolean;
}

function StarRow({ rating, total, count }: { rating: number; total: number; count: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 shrink-0">
        <span className="text-[11px] text-muted-foreground w-3">{rating}</span>
        <Star size={10} className="text-amber-400 fill-amber-400" />
      </div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-5 text-right">{count}</span>
    </div>
  );
}

export function CourseReviews({ courseId, reviews, currentUserId, myReview, canReview }: Props) {
  const [showForm, setShowForm] = useState(false);

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;

  const distrib = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length,
  }));

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={16} className="text-violet-500" />
          Сэтгэгдлүүд ({reviews.length})
        </h3>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[12px] font-semibold rounded-xl hover:bg-violet-200 dark:hover:bg-violet-500/25 transition-colors"
          >
            {myReview ? <><Edit2 size={11} /> Засах</> : <><Star size={11} /> Сэтгэгдэл бичих</>}
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      {reviews.length > 0 && (
        <div className="flex gap-6 p-4 bg-card rounded-2xl border border-border">
          <div className="text-center shrink-0">
            <div className="text-4xl font-black text-foreground">{avg.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-0.5 my-1">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={12}
                  className={cn("transition-colors", avg >= n ? "text-amber-400 fill-amber-400" : avg >= n - 0.5 ? "text-amber-300 fill-amber-300" : "text-slate-200 fill-slate-200")}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{reviews.length} сэтгэгдэл</p>
          </div>
          <div className="flex-1 space-y-1">
            {distrib.map(d => (
              <StarRow key={d.rating} rating={d.rating} total={reviews.length} count={d.count} />
            ))}
          </div>
        </div>
      )}

      {/* ── REVIEW FORM ── */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <ReviewForm
            courseId={courseId}
            initial={myReview ? { rating: myReview.rating, comment: myReview.comment } : null}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {/* ── MY REVIEW PREVIEW ── */}
      {myReview && !showForm && (
        <div className="bg-violet-50 dark:bg-violet-900/15 rounded-2xl border border-violet-200 dark:border-violet-800/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300">Миний сэтгэгдэл</span>
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={11} className={cn(myReview.rating >= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
              ))}
            </div>
          </div>
          {myReview.comment && <p className="text-[12px] text-foreground/80">{myReview.comment}</p>}
        </div>
      )}

      {/* ── REVIEW LIST ── */}
      <div className="space-y-3">
        {reviews.filter(r => r.student.id !== currentUserId).map(review => (
          <div key={review.id} className="flex gap-3 p-3.5 bg-card rounded-2xl border border-border hover:border-violet-200 dark:hover:border-violet-800/40 transition-colors">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={review.student.avatarUrl ?? undefined} alt={review.student.name} />
              <AvatarFallback className="text-[10px] bg-violet-100 dark:bg-violet-800 text-violet-700 font-bold">
                {getInitials(review.student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-foreground">{review.student.name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={10} className={cn(review.rating >= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </span>
              </div>
              {review.comment && (
                <p className="text-[12px] text-foreground/80 leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        ))}

        {reviews.length === 0 && !showForm && (
          <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
            <Star size={24} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to review this course</p>
          </div>
        )}
      </div>
    </div>
  );
}
