"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EDGE_GAP = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ContextMenu({
  open,
  x,
  y,
  onClose,
  children
}: {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!open) return;
    const menu = ref.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    setPosition({
      left: clamp(x, EDGE_GAP, window.innerWidth - rect.width - EDGE_GAP),
      top: clamp(y, EDGE_GAP, window.innerHeight - rect.height - EDGE_GAP)
    });
  }, [open, x, y, children]);

  useEffect(() => {
    if (!open) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className="fixed z-[70] w-[176px] rounded-[20px] bg-[#fffdf8] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.05)]"
          style={{ left: position.left, top: position.top }}
          initial={{ opacity: 0, scale: 0.98, y: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: -2 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
