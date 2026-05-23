"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "@/components/auth/AuthModal";

const SESSION_KEY = "signin_nudge_dismissed";

export function SignInNudge() {
  const user = useAuthStore((state) => state.user);
  const isLoaded = useAuthStore((state) => state.isLoaded);
  const [visible, setVisible] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || user) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [isLoaded, user]);

  // Hide immediately if user signs in
  useEffect(() => {
    if (user) setVisible(false);
  }, [user]);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  if (!isLoaded || user) return null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed top-20 left-1/2 z-30 -translate-x-1/2 pointer-events-auto"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2.5 rounded-full bg-white px-3 py-2.5 shadow-dock whitespace-nowrap">
              <span className="size-1.5 shrink-0 rounded-full bg-[#3d7fbf]" />
              <span className="text-[13px] font-medium text-[#30333b]">Sign in to sync across devices</span>
              <button
                type="button"
                onClick={() => { dismiss(); setAuthOpen(true); }}
                className="flex h-7 items-center rounded-full bg-[#30333b] px-3 text-[12px] font-semibold text-white transition hover:bg-[#404350] active:scale-95"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="grid size-5 place-items-center rounded-full text-[#a0a3ae] transition hover:text-[#626677]"
                aria-label="Dismiss"
              >
                <X className="size-3" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
