"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
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
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setErrorMsg(error.message);
      setStep("error");
    } else {
      setStep("sent");
    }
  }

  return createPortal(
    <div
      className="fixed top-0 left-0 z-[200] flex h-screen w-screen items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm overflow-y-auto rounded-3xl bg-white shadow-2xl" style={{ maxHeight: "90dvh" }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f5ef] hover:text-[#626677]"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>

        {/* Illustration */}
        <div className="flex justify-center pt-8 pb-2">
          <Image
            src={step === "sent" ? "/envelope-sent.webp" : "/envelope-idle.webp"}
            alt=""
            width={120}
            height={120}
            className="size-[120px] object-contain"
            aria-hidden="true"
          />
        </div>

        <div className="px-8 pb-8">
          <div className="mb-6 text-center">
            {step === "sent" ? (
              <>
                <p className="text-[15px] font-semibold text-[#30333b]">Check your email</p>
                <p className="mt-1 text-[13px] text-[#a0a3ae]">
                  We sent a sign-in link to{" "}
                  <span className="font-medium text-[#626677]">{email}</span>.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-[#30333b]">Sync across devices</p>
                <p className="mt-1 text-[13px] text-[#a0a3ae]">Sign in to back up your money map.</p>
              </>
            )}
          </div>

          {step !== "sent" && (
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
                  {errorMsg || "Something went wrong. Please try again."}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
