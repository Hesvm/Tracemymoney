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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative mx-4 w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl" style={{ maxHeight: "90dvh" }}>
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

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ebe7dd]" />
              <span className="text-[12px] text-[#c0c2cb]">or</span>
              <div className="h-px flex-1 bg-[#ebe7dd]" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ebe7dd] bg-white py-3 text-[14px] font-semibold text-[#30333b] transition hover:bg-[#fbfaf7]"
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

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
