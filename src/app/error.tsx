"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Алдаа гарлаа</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Систем дээр алдаа гарлаа. Та дахин оролдох эсвэл админ руу хандана уу.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono bg-muted inline-block px-3 py-1 rounded mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-500"
          >
            <RotateCcw size={14} /> Дахин оролдох
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted/50"
          >
            Нүүр хуудас
          </Link>
        </div>
      </div>
    </div>
  );
}
