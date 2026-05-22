"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserAvatar } from "@/components/auth/UserAvatar";

export function AuthButton() {
  const { user, isLoaded } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  if (!isLoaded) return null;

  if (user) return <UserAvatar />;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-[#a0a3ae] transition hover:bg-[#f7f5ef] hover:text-[#626677]"
        title="Sign in to sync across devices"
      >
        <Cloud className="size-3.5" strokeWidth={2.1} />
        Sync
      </button>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
