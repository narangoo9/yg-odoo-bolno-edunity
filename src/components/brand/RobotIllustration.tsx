import { cn } from "@/lib/utils";

interface RobotIllustrationProps {
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: number;
}

export function RobotIllustration({
  alt = "Robo AI assistant",
  className,
  imageClassName,
  priority = false,
  size = 72,
}: RobotIllustrationProps) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden={alt.length === 0 ? "true" : undefined}
    >
      <img
        src="/brand/robot-removebg-preview.png"
        alt={alt}
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={cn("absolute inset-0 h-full w-full object-contain", imageClassName)}
      />
    </div>
  );
}
