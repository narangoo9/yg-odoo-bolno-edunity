import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <p className="text-[140px] font-bold text-slate-100 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Хуудас олдсонгүй</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Таны хайж байгаа хуудас байхгүй эсвэл устсан байна.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-500"
          >
            Нүүр хуудас
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted/50"
          >
            Курс харах
          </Link>
        </div>
      </div>
    </div>
  );
}
