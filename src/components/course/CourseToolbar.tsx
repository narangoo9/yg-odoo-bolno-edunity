"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Bookmark, Flag } from "lucide-react";

interface Props {
  courseTitle: string;
  categoryId?: string;
  categoryName?: string;
}

export function CourseToolbar({ courseTitle, categoryId, categoryName }: Props) {
  const router = useRouter();

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-[#E9DFFF] sticky top-[57px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-4">

        {/* Left: back + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.back()}
            aria-label="Буцах"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-[#F3EEFF] hover:text-violet-700 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ArrowLeft size={14} />
            <span className="hidden xs:inline">Буцах</span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 min-w-0"
          >
            <span className="text-gray-300 select-none">|</span>
            <Link
              href="/courses"
              className="hover:text-violet-600 transition-colors shrink-0 focus:outline-none focus-visible:underline"
            >
              Курсууд
            </Link>
            {categoryName && categoryId && (
              <>
                <span className="text-gray-300 select-none">/</span>
                <Link
                  href={`/courses?categoryId=${categoryId}`}
                  className="hover:text-violet-600 transition-colors shrink-0 max-w-[100px] truncate focus:outline-none focus-visible:underline"
                >
                  {categoryName}
                </Link>
              </>
            )}
            <span className="text-gray-300 select-none">/</span>
            <span className="text-gray-700 font-medium truncate max-w-[200px]" aria-current="page">
              {courseTitle}
            </span>
          </nav>
        </div>

        {/* Right: action icon buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            aria-label="Хуваалцах"
            title="Хуваалцах"
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#F3EEFF] hover:text-violet-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Share2 size={15} />
          </button>
          <button
            aria-label="Хадгалах"
            title="Хадгалах"
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#F3EEFF] hover:text-violet-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Bookmark size={15} />
          </button>
          <button
            aria-label="Асуудал мэдэгдэх"
            title="Асуудал мэдэгдэх"
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Flag size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
