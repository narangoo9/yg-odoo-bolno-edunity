import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Ачаалж байна...</p>
      </div>
    </div>
  );
}
