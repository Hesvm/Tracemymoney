import { create } from "zustand";

export type SyncStatus = "offline" | "local-only" | "syncing" | "synced" | "error";

type SyncStore = {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
};

export const useSyncStore = create<SyncStore>()((set) => ({
  status: "local-only",
  setStatus: (status) => set({ status }),
}));
