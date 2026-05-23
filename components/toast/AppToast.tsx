"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useToastStore } from "@/store/toastStore";

export function AppToast() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-28 left-1/2 z-[150] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-dock whitespace-nowrap"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-[#c64141]" />
            <span className="text-[13px] font-medium text-[#30333b]">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="ml-0.5 grid size-5 place-items-center rounded-full text-[#a0a3ae] transition hover:text-[#626677]"
              aria-label="Dismiss"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
