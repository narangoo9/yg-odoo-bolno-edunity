"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const auraRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const cometRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const aura = auraRef.current;
    const bloom = bloomRef.current;
    const comet = cometRef.current;
    const cursor = cursorRef.current;

    if (!aura || !bloom || !comet || !cursor) return;

    let rafId = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let softX = x;
    let softY = y;
    let targetX = x;
    let targetY = y;
    let isPressed = false;
    let isHoveringAction = false;
    let isHidden = false;

    document.documentElement.classList.add("cursor-orb-mode");

    const syncHoverState = (clientX: number, clientY: number) => {
      const target = document.elementFromPoint(clientX, clientY);
      const interactive = target?.closest(
        "a, button, input, textarea, select, summary, [role='button'], [data-cursor='interactive']",
      );
      isHoveringAction = Boolean(interactive);
    };

    const handleMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      isHidden = false;
      syncHoverState(event.clientX, event.clientY);
    };

    const handleDown = () => {
      isPressed = true;
    };

    const handleUp = () => {
      isPressed = false;
    };

    const handleLeave = () => {
      isHidden = true;
    };

    const handleEnter = () => {
      isHidden = false;
    };

    const tick = () => {
      x += (targetX - x) * 0.32;
      y += (targetY - y) * 0.32;
      softX += (targetX - softX) * 0.12;
      softY += (targetY - softY) * 0.12;

      const dx = targetX - softX;
      const dy = targetY - softY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const distance = Math.hypot(dx, dy);

      const baseScale = isHoveringAction ? 1.38 : 1;
      const pressedScale = isPressed ? 0.84 : 1;
      const cursorScale = baseScale * pressedScale;
      const auraScale = isHoveringAction ? 1.18 : 1;
      const cometScale = Math.min(1.45, 0.82 + distance / 85);
      const opacity = isHidden ? 0 : 1;

      cursor.style.opacity = `${opacity}`;
      aura.style.opacity = `${opacity}`;
      bloom.style.opacity = `${opacity}`;
      comet.style.opacity = `${opacity}`;

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${cursorScale})`;
      aura.style.transform = `translate3d(${softX}px, ${softY}px, 0) translate(-50%, -50%) scale(${auraScale})`;
      bloom.style.transform = `translate3d(${softX}px, ${softY}px, 0) translate(-50%, -50%) scale(${isHoveringAction ? 1.12 : 1})`;
      comet.style.transform = `translate3d(${softX}px, ${softY}px, 0) translate(-50%, -50%) rotate(${angle}deg) scaleX(${cometScale})`;

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", handleDown, { passive: true });
    window.addEventListener("mouseup", handleUp, { passive: true });
    window.addEventListener("mouseleave", handleLeave, { passive: true });
    window.addEventListener("mouseenter", handleEnter, { passive: true });

    rafId = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("cursor-orb-mode");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("mouseenter", handleEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        html.cursor-orb-mode,
        html.cursor-orb-mode * {
          cursor: none !important;
        }
      `}</style>

      <div
        ref={auraRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9996] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200"
        style={{
          background:
            "radial-gradient(circle, rgba(129,140,248,0.18) 0%, rgba(139,92,246,0.14) 22%, rgba(34,211,238,0.08) 42%, rgba(255,255,255,0) 72%)",
          filter: "blur(36px)",
          mixBlendMode: "screen",
          willChange: "transform, opacity",
        }}
      />

      <div
        ref={bloomRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9997] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(125,211,252,0.32) 20%, rgba(129,140,248,0.12) 42%, rgba(255,255,255,0) 74%)",
          filter: "blur(12px)",
          mixBlendMode: "screen",
          willChange: "transform, opacity",
        }}
      />

      <div
        ref={cometRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-14 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(125,211,252,0.08) 22%, rgba(99,102,241,0.42) 50%, rgba(168,85,247,0.16) 72%, rgba(255,255,255,0) 100%)",
          filter: "blur(10px)",
          mixBlendMode: "screen",
          willChange: "transform, opacity",
        }}
      />

      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-8 w-8 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="absolute inset-0 rounded-full border border-white/55 bg-white/[0.06] shadow-[0_0_20px_rgba(129,140,248,0.45)] backdrop-blur-[3px]" />
        <div className="absolute inset-[5px] rounded-full border border-cyan-200/35" />
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(125,211,252,1)]" />
        <div className="absolute left-1/2 top-1/2 h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] rounded-full border border-transparent border-t-white/35 border-r-violet-200/35" />
      </div>
    </>
  );
}
