import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
}

export function ScrollReveal({ children, className = "", delay = 0, direction = "up" }: Props) {
  const style: CSSProperties = {
    animationDelay: `${delay}ms`,
    animationDuration: "0.65s",
    animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
    animationFillMode: "both",
    animationName: direction === "fade" ? "fade-in" : "fade-up",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
