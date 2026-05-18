import { cn } from "@/lib/utils";

export function PublicProse({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-violet max-w-none dark:prose-invert",
        "prose-headings:font-black prose-headings:tracking-tight",
        "prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-[#4B5563] dark:prose-p:text-[#A1A1AA]",
        "prose-li:text-[15px] prose-li:text-[#4B5563] dark:prose-li:text-[#A1A1AA]",
        "prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-violet-400",
        className,
      )}
    >
      {children}
    </div>
  );
}
