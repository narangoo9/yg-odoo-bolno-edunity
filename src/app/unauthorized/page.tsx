import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Эрх хүрэлцэхгүй байна</h1>
        <p className="text-slate-500 text-sm mb-6">
          Энэ хуудсыг үзэх эрх танд байхгүй байна.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
