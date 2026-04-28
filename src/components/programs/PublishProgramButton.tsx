"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { publishProgram } from "@/modules/programs/application/actions";
import { Button } from "@/components/ui/button";

interface Props {
  programId: string;
  hasCourses: boolean;
}

export function PublishProgramButton({ programId, hasCourses }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    const result = await publishProgram(programId);
    setLoading(false);

    if ("error" in result) {
      setError(typeof result.error === "string" ? result.error : "Алдаа гарлаа");
      return;
    }
    router.refresh();
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-sm text-amber-800 font-medium mb-1">Программ нийтлэхэд бэлэн үү?</p>
      <p className="text-xs text-amber-700 mb-3">
        Нийтэлсний дараа суралцагчид бүртгүүлж эхэлнэ.
      </p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <Button
        size="sm"
        onClick={handlePublish}
        disabled={loading || !hasCourses}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        {loading ? (
          <Loader2 size={14} className="mr-1.5 animate-spin" />
        ) : (
          <Globe size={14} className="mr-1.5" />
        )}
        Нийтлэх
      </Button>
    </div>
  );
}
