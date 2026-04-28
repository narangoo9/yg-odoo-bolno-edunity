import { ChevronDown, Lock, Play } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: number | null;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Props {
  modules: Module[];
  isUnlocked: boolean;
  totalLessons: number;
}

export function CourseCurriculumPanel({ modules, isUnlocked, totalLessons }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-[#0F172A]">Хичээлийн агуулга</h2>
        <span className="text-xs font-semibold text-violet-700 bg-[#EDE9FE] px-3 py-1.5 rounded-full">
          {totalLessons} хичээл
        </span>
      </div>

      <div className="border border-[#E9DFFF] rounded-2xl overflow-hidden">
        {modules.map((mod) => (
          <details key={mod.id} className="group border-b border-[#E9DFFF] last:border-0" open>
            <summary className="flex items-center justify-between px-5 py-4 min-h-[52px] cursor-pointer bg-[#F8F7FF] hover:bg-[#EDE9FE] transition-colors select-none list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400">
              <div className="flex items-center gap-3">
                <ChevronDown
                  size={16}
                  className="text-violet-500 shrink-0 transition-transform duration-200 group-open:rotate-180"
                />
                <span className="font-semibold text-[#0F172A] text-sm">{mod.title}</span>
              </div>
              <span className="text-[11px] font-semibold text-violet-600 bg-white border border-violet-200 px-2.5 py-1 rounded-full shrink-0">
                {mod.lessons.length} хичээл
              </span>
            </summary>

            <div className="bg-white">
              {mod.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 px-5 py-3 min-h-[44px] border-b border-[#F3EEFF] last:border-0 hover:bg-[#F8F7FF] transition-colors duration-150 cursor-default"
                >
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    {!isUnlocked ? (
                      <Lock size={11} className="text-violet-400" />
                    ) : (
                      <Play size={11} className="text-violet-500 ml-0.5" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{lesson.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isUnlocked && (
                      <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                        Locked
                      </span>
                    )}
                    {lesson.duration && (
                      <span className="text-xs text-gray-400 tabular-nums">
                        {Math.ceil(lesson.duration / 60)}м
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
