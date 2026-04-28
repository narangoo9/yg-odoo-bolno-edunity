"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Lock } from "lucide-react";
import { enrollCourse } from "@/modules/courses/application/actions";
import { toast } from "@/components/ui/toaster";

interface EnrollButtonProps {
  courseId: string;
  hasCourseAccess: boolean;
}

export function EnrollButton({ courseId, hasCourseAccess }: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const result = await enrollCourse({ courseId });

      if (result && "error" in result) {
        toast({ type: "error", title: "ÐÐ»Ð´Ð°Ð°", description: result.error as string });
        return;
      }

      if (result && "requiresUpgrade" in result) {
        toast({
          type: "info",
          title: "Upgrade ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ñ‚Ð°Ð¹",
          description: "Ð­Ð½Ñ Ñ…Ð¸Ñ‡ÑÑÐ»Ð¸Ð¹Ð³ Ò¯Ð·ÑÑ…Ð¸Ð¹Ð½ Ñ‚ÑƒÐ»Ð´ Premium ÑÑÐ²ÑÐ» Pro plan Ð°Ð²Ð½Ð°.",
        });
        router.push("/student/upgrade");
        return;
      }
    } catch {
      toast({ type: "error", title: "ÐÐ»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°", description: "Ð”Ð°Ñ…Ð¸Ð½ Ð¾Ñ€Ð¾Ð»Ð´Ð¾Ð½Ð¾ ÑƒÑƒ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 active:scale-[.99] transition-all disabled:opacity-60"
    >
      {loading ? (
        <><Loader2 size={16} className="animate-spin" /> Ð‘Ò¯Ñ€Ñ‚Ð³ÑÐ¶ Ð±Ð°Ð¹Ð½Ð°...</>
      ) : hasCourseAccess ? (
        <><BookOpen size={16} /> Unlock Course</>
      ) : (
        <><Lock size={16} /> Upgrade to Unlock</>
      )}
    </button>
  );
}
