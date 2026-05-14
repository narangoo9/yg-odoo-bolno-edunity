import Link from "next/link";
import { BookOpen, Star, Users, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/index";

interface CompanyCardProps {
  company: {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    marketplace: {
      category: string;
      coverUrl?: string;
      rating: number;
      studentCount: number;
      courseCount: number;
      hasFreePreview: boolean;
    };
  };
}

export function CompanyCard({ company }: CompanyCardProps) {
  const cover = company.marketplace.coverUrl;

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100"
    >
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-600">
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/40 bg-white text-lg font-black text-violet-700 shadow-lg">
            {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" /> : company.name.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-black text-white">{company.name}</p>
            <p className="text-xs font-semibold text-violet-100">{company.marketplace.category}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="line-clamp-2 min-h-10 text-sm text-slate-600">
          {company.description ?? "Company learning catalog with structured courses, tasks, AI support, and certificates."}
        </p>

        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpen size={13} /> {company.marketplace.courseCount}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} /> {company.marketplace.studentCount}
          </span>
          <span className="flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400" /> {company.marketplace.rating.toFixed(1)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-violet-50 pt-3">
          <Badge variant="info">{company.marketplace.category}</Badge>
          {company.marketplace.hasFreePreview ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-violet-700">
              <PlayCircle size={13} /> Free preview
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

