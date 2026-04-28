import type { CSSProperties } from "react";

export function HeroGridBg() {
  return (
    <div
      aria-hidden="true"
      className="hero-grid-bg absolute inset-0"
      style={
        {
          "--hx": "50%",
          "--hy": "-10%",
        } as CSSProperties
      }
    >
      <div className="hero-grid-spotlight absolute inset-0" />
    </div>
  );
}
