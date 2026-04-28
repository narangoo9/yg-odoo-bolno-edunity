import Image from "next/image";

interface Props {
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export function CourseInstructorCard({ name, avatarUrl, bio }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-[#E9DFFF] p-5 relative overflow-hidden">
      <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">Багшийн тухай</h3>

      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 overflow-hidden border border-violet-200">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full object-cover" alt={name} />
          ) : (
            <span className="text-2xl font-bold text-violet-600">{name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0F172A] text-sm">{name}</p>
          {bio && (
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{bio}</p>
          )}
        </div>
      </div>

      {/* Subtle mascot-book corner watermark */}
      <div className="absolute -bottom-4 -right-3 opacity-[0.09] pointer-events-none select-none" aria-hidden="true">
        <Image src="/assets/mascot/mascot-book.png" alt="" width={96} height={96} />
      </div>
    </div>
  );
}
