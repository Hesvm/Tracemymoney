"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { configureSyncEngine } from "@/lib/sync/syncEngine";
import { useSyncStore } from "@/store/syncStore";

export function UserAvatar() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initial = (user.email ?? "?")[0].toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    configureSyncEngine(null);
    useSyncStore.getState().setStatus("local-only");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-7 place-items-center rounded-full bg-[#30333b] text-[11px] font-bold text-white transition hover:bg-[#404350]"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 min-w-[180px] rounded-2xl bg-white p-2 shadow-lg ring-1 ring-[#ebe7dd]">
            <p className="truncate px-3 py-1 text-[12px] text-[#a0a3ae]">{user.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-[#c64141] transition hover:bg-[#fff1f1]"
            >
              <LogOut className="size-3.5" strokeWidth={2.2} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
