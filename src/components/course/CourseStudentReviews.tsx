import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  student: { name: string };
}

interface Props {
  reviews: Review[];
  totalCount: number;
}

export function CourseStudentReviews({ reviews, totalCount }: Props) {
  if (!reviews.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E9DFFF] p-5">
      <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">
        Оюутнуудын сэтгэгдэл ({totalCount})
      </h3>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="pb-4 border-b border-[#F3EEFF] last:border-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600 shrink-0 select-none">
                {r.student.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A]">{r.student.name}</p>
                <div className="flex gap-0.5 my-1" aria-label={`${r.rating} одтой үнэлгээ`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < r.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200 fill-gray-200"
                      }
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-xs text-gray-500 leading-relaxed">{r.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
