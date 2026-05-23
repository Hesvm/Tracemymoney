import { saveLocalDocument, loadLocalDocument } from "@/lib/db";
import { extractDocument, applyDocument } from "@/lib/document";
import { uploadDocument } from "@/lib/sync/uploadDocument";
import { downloadDocument } from "@/lib/sync/downloadDocument";
import { mergeDocuments } from "@/lib/sync/mergeDocument";
import { useSyncStore } from "@/store/syncStore";
import { useMoneyMapStore } from "@/store/moneyMapStore";

let dirtyTimer: ReturnType<typeof setTimeout> | null = null;
let activeUserId: string | null = null;
// Becomes true once initFromDB + optional syncOnLogin finish. Prevents the
// store subscription from flushing stale initial-state writes before we've
// had a chance to load the real document.
let syncReady = false;

export function markSyncReady(): void {
  syncReady = true;
}

export function isSyncReady(): boolean {
  return syncReady;
}

export function configureSyncEngine(userId: string | null): void {
  activeUserId = userId;
}

export function markDirty(): void {
  if (!activeUserId || !syncReady) return;
  if (dirtyTimer) clearTimeout(dirtyTimer);
  dirtyTimer = setTimeout(() => void triggerUpload(), 3000);
}

async function triggerUpload(): Promise<void> {
  if (!activeUserId) return;
  const { setStatus } = useSyncStore.getState();
  setStatus("syncing");
  try {
    const doc = extractDocument(useMoneyMapStore.getState());
    await saveLocalDocument(doc);
    await uploadDocument(activeUserId, doc);
    setStatus("synced");
  } catch {
    setStatus("error");
  }
}

export async function syncOnLogin(userId: string): Promise<void> {
  configureSyncEngine(userId);
  const { setStatus } = useSyncStore.getState();
  setStatus("syncing");
  try {
    const [cloudDoc, localDoc] = await Promise.all([
      downloadDocument(userId),
      loadLocalDocument(),
    ]);

    if (cloudDoc && localDoc) {
      const merged = mergeDocuments(localDoc, cloudDoc);
      useMoneyMapStore.setState(applyDocument(merged));
      await saveLocalDocument(merged);
    } else if (cloudDoc) {
      useMoneyMapStore.setState(applyDocument(cloudDoc));
      await saveLocalDocument(cloudDoc);
    }

    const finalDoc = extractDocument(useMoneyMapStore.getState());
    await uploadDocument(userId, finalDoc);
    setStatus("synced");
  } catch {
    setStatus("error");
  }
}

export function registerOnlineListener(): () => void {
  const handleOnline = () => void triggerUpload();
  const handleFocus = () => void triggerUpload();
  window.addEventListener("online", handleOnline);
  window.addEventListener("focus", handleFocus);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("focus", handleFocus);
  };
}
