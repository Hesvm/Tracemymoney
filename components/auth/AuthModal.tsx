"use client";

import { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "idle" | "loading" | "sent" | "error";

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");

  if (!open) return null;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setStep(error ? "error" : "sent");
  }

return (
    <div
      className="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center px-4 bg-black/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl" style={{ maxHeight: "90dvh" }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f5ef] hover:text-[#626677]"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>

        <div className="mb-6 text-center">
          <p className="text-[15px] font-semibold text-[#30333b]">Sync across devices</p>
          <p className="mt-1 text-[13px] text-[#a0a3ae]">Sign in to back up your money map.</p>
        </div>

        {step === "sent" ? (
          <div className="text-center">
            <p className="text-[14px] font-medium text-[#4caf7d]">Check your email</p>
            <p className="mt-2 text-[13px] text-[#a0a3ae]">
              A sign-in link has been sent to <span className="font-medium text-[#626677]">{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#ebe7dd] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#30333b] outline-none placeholder:text-[#c0c2cb] focus:border-[#b0b2bb]"
                required
              />
              <button
                type="submit"
                disabled={step === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#30333b] py-3 text-[14px] font-semibold text-white transition hover:bg-[#404350] disabled:opacity-60"
              >
                {step === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" strokeWidth={2} />
                )}
                Continue with Email
              </button>
            </form>

{step === "error" && (
              <p className="mt-3 text-center text-[13px] text-[#c64141]">
                Something went wrong. Please try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
