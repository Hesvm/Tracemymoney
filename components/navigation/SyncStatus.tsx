"use client";

import { useSyncStore } from "@/store/syncStore";
import { useAuthStore } from "@/store/authStore";

const labels: Record<string, string> = {
  offline: "Offline",
  "local-only": "Local",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync failed",
};

const dotClass: Record<string, string> = {
  offline: "bg-[#c8c9cc]",
  "local-only": "bg-[#c8c9cc]",
  syncing: "bg-[#f5a623] animate-pulse",
  synced: "bg-[#4caf7d]",
  error: "bg-[#c64141]",
};

export function SyncStatus() {
  const status = useSyncStore((state) => state.status);
  const isLoaded = useAuthStore((state) => state.isLoaded);

  const user = useAuthStore((state) => state.user);

  // Only show when signed in or on meaningful non-local states
  if (!isLoaded || (!user && (status === "local-only" || status === "offline"))) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#a0a3ae]">
      <span className={`size-1.5 rounded-full ${dotClass[status]}`} />
      {labels[status]}
    </div>
  );
}
