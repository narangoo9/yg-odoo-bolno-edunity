import Image from "next/image";
import { Layers, GitBranch, Database, Rocket, Code2, Shield, Zap, BookOpen } from "lucide-react";

const FEATURE_ICONS = [Layers, GitBranch, Database, Rocket, Code2, Shield, Zap, BookOpen];

interface Props {
  outcomes: string[];
}

export function CourseLearningFeatures({ outcomes }: Props) {
  if (!outcomes.length) return null;

  const cards = outcomes.slice(0, 4);
  const rest = outcomes.slice(4);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 -mt-5 z-10 pb-2">
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.10)] border border-[#E9DFFF] p-6 sm:p-8">
        <div className="flex items-start gap-5">

          {/* Mascot sticker — desktop only */}
          <div className="hidden md:block shrink-0 self-end pb-1">
            <div className="animate-float">
              <Image
                src="/assets/mascot/mascot-wave.png"
                alt="EduNity mascot"
                width={88}
                height={88}
                className="drop-shadow-md select-none"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#0F172A] mb-5">Юу сурах вэ?</h2>

            {/* Feature icon cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {cards.map((outcome, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                return (
                  <div
                    key={i}
                    className="glow-card group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[#F8F7FF] border border-[#EDE9FE] text-center cursor-default"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors duration-200">
                      <Icon size={22} className="text-violet-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 leading-snug">{outcome}</span>
                  </div>
                );
              })}
            </div>

            {/* Remaining outcomes as checklist */}
            {rest.length > 0 && (
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                {rest.map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 block" />
                    </span>
                    {o}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
