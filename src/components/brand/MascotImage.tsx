import Image from "next/image";
import { cn } from "@/lib/utils";

export type MascotVariant =
  | "wave"
  | "book"
  | "laptop"
  | "certificate"
  | "fire"
  | "thinking"
  | "celebrate"
  | "base";

interface MascotImageProps {
  variant: MascotVariant;
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: number;
}

const MASCOT_SRCS: Record<MascotVariant, string> = {
  wave: "/assets/mascot/mascot-wave.png",
  book: "/assets/mascot/mascot-book.png",
  laptop: "/assets/mascot/mascot-laptop.png",
  certificate: "/assets/mascot/mascot-certificate.png",
  fire: "/assets/mascot/mascot-fire.png",
  thinking: "/assets/mascot/mascot-thinking.png",
  celebrate: "/assets/mascot/mascot-celebrate.png",
  base: "/assets/mascot/mascot-base.png",
};

export function MascotImage({
  variant,
  alt = "",
  className,
  imageClassName,
  priority = false,
  size = 72,
}: MascotImageProps) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden={alt.length === 0 ? "true" : undefined}
    >
      <Image
        src={MASCOT_SRCS[variant]}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={`${size}px`}
        className={cn("object-contain", imageClassName)}
      />
    </div>
  );
}
