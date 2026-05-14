"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Props {
  open: boolean;
  onClick: () => void;
}

export function AiAgentButton({ open, onClick }: Props) {
  const shouldReduce = useReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const saved = window.localStorage.getItem("edunity-ai-button-position");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { x?: number; y?: number };
      const next = { x: parsed.x ?? 0, y: parsed.y ?? 0 };
      positionRef.current = next;
      setPosition(next);
    } catch {
      positionRef.current = { x: 0, y: 0 };
      setPosition({ x: 0, y: 0 });
    }
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: position.x,
      y: position.y,
    };
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;

    const dx = event.clientX - dragStartRef.current.pointerX;
    const dy = event.clientY - dragStartRef.current.pointerY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }

    const next = {
      x: dragStartRef.current.x + dx,
      y: dragStartRef.current.y + dy,
    };
    positionRef.current = next;
    setPosition(next);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const next = positionRef.current;
    dragStartRef.current = null;
    window.localStorage.setItem("edunity-ai-button-position", JSON.stringify(next));

    if (!hasDraggedRef.current) {
      onClick();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragStartRef.current = null;
        window.localStorage.setItem("edunity-ai-button-position", JSON.stringify(positionRef.current));
      }}
      onKeyDown={handleKeyDown}
      animate={{ x: position.x, y: position.y }}
      transition={{ duration: 0 }}
      whileHover={shouldReduce ? {} : { scale: 1.1 }}
      whileTap={shouldReduce ? {} : { scale: 0.92 }}
      aria-label={open ? "AI Mentor хаах" : "AI Mentor нээх"}
      aria-expanded={open}
      title="AI Mentor"
      className="fixed bottom-5 right-5 z-[9999] flex h-16 w-16 cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
    >
      {/* Outer glow */}
      <span
        className="absolute -inset-2 rounded-full opacity-95 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(192,132,252,1) 0%, rgba(168,85,247,0.88) 34%, rgba(124,58,237,0.72) 58%, transparent 82%)",
        }}
        aria-hidden="true"
      />
      {/* Inner glow */}
      <span
        className="absolute inset-0 rounded-full opacity-80 blur-md"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.85) 0%, rgba(109,40,217,0.55) 55%, transparent 78%)",
        }}
        aria-hidden="true"
      />
      {/* Robot image */}
      <Image
        src="/brand/ai_agent_icon.png"
        alt="Robo Mentor"
        width={64}
        height={64}
        className="relative z-10 object-contain"
        style={{
          filter:
            "drop-shadow(0 0 16px rgba(192,132,252,1)) drop-shadow(0 0 30px rgba(139,92,246,0.85)) drop-shadow(0 8px 28px rgba(76,29,149,0.72))",
        }}
        priority
      />
      {/* Notification dot */}
      <AnimatePresence>
        {!open && (
          <motion.span
            key="dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute right-1 top-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-red-500 dark:border-[#09090b]"
            aria-label="Шинэ санал байна"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
