"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { submitReview } from "@/modules/reviews/application/actions";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface Props {
  courseId: string;
  initial?: { rating: number; comment: string | null } | null;
  onClose?: () => void;
}

export function ReviewForm({ courseId, initial, onClose }: Props) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ type: "warning", title: "Үнэлгээ өгнө үү" });
      return;
    }
    startTransition(async () => {
      const result = await submitReview({ courseId, rating, comment: comment || undefined });
      if ("error" in result) {
        toast({ type: "error", title: "Алдаа" });
        return;
      }
      toast({ type: "success", title: initial ? "Сэтгэгдэл шинэчлэгдлээ" : "Сэтгэгдэл бүртгэгдлээ" });
      onClose?.();
    });
  };

  return (
    <div className="space-y-4">
      {/* Star rating */}
      <div className="space-y-2">
        <Label>Үнэлгээ</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoveredRating(n)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={cn(
                  "transition-colors",
                  (hoveredRating || rating) >= n
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200 fill-slate-200"
                )}
              />
            </button>
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {rating > 0 ? `${rating} / 5` : "Одоор үнэлнэ үү"}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <Label htmlFor="comment">Сэтгэгдэл (сонголт)</Label>
        <Textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Танд курс хэрхэн таалагдсан бэ?"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground/80 text-right">{comment.length} / 1000</p>
      </div>

      <div className="flex items-center gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Болих
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isPending || rating === 0} className="flex-1">
          {isPending ? (
            <><Loader2 size={14} className="animate-spin mr-2" /> Илгээж байна...</>
          ) : (
            initial ? "Шинэчлэх" : "Илгээх"
          )}
        </Button>
      </div>
    </div>
  );
}
