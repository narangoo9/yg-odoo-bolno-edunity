"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { addCourseToProgram } from "@/modules/programs/application/actions";
import { Button } from "@/components/ui/button";

interface Props {
  programId: string;
  availableCourses: { id: string; title: string }[];
}

export function AddCourseToProgram({ programId, availableCourses }: Props) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    const result = await addCourseToProgram({
      programId,
      courseId: selectedCourseId,
      orderIndex: 999,
      isRequired,
    });

    setLoading(false);
    if ("error" in result) {
      setError(typeof result.error === "string" ? result.error : "Алдаа гарлаа");
      return;
    }
    setSelectedCourseId("");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Курс нэмэх</p>
      <div className="flex gap-2">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">— Курс сонгох —</option>
          {availableCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="accent-slate-900"
          />
          Заавал
        </label>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!selectedCourseId || loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
