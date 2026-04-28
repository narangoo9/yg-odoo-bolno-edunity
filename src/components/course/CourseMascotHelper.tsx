import Image from "next/image";
import { Sparkles } from "lucide-react";

export function CourseMascotHelper() {
  return (
    <div className="bg-white rounded-2xl border border-[#E9DFFF] p-5 flex items-center gap-4">
      <div className="shrink-0">
        <Image
          src="/assets/mascot/mascot-thinking.png"
          alt="AI туслах mascot"
          width={72}
          height={72}
          className="select-none"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5 mb-1">
          <Sparkles size={14} className="text-violet-500" aria-hidden="true" />
          AI туслах
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Хичээл сонгох, төлөвлөгөө гаргах, ойлгоогүй зүйлээ асуухад тусална.
        </p>
        <button
          type="button"
          className="px-3.5 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1"
        >
          AI-аас асуух
        </button>
      </div>
    </div>
  );
}
