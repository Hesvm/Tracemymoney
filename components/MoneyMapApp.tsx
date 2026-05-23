"use client";

import { useEffect, useRef, useState } from "react";
import { AddTypeMenu } from "@/components/quick-add/AddTypeMenu";
import { AnalyticsModal } from "@/components/analytics/AnalyticsModal";
import { ItemContextMenu } from "@/components/context-menu/ItemContextMenu";
import { NodeContextMenu } from "@/components/context-menu/NodeContextMenu";
import { QuickAddModal } from "@/components/quick-add/QuickAddModal";
import { MoneyCanvas } from "@/components/canvas/MoneyCanvas";
import { AppToast } from "@/components/toast/AppToast";
import { SignInNudge } from "@/components/toast/SignInNudge";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TopBrandBar } from "@/components/navigation/TopBrandBar";
import { SearchPopover } from "@/components/search/SearchPopover";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useMoneyMapStore, initFromDB } from "@/store/moneyMapStore";
import { useAuthStore } from "@/store/authStore";
import { useSyncStore } from "@/store/syncStore";
import { useToastStore } from "@/store/toastStore";
import { supabase } from "@/lib/supabaseClient";
import { saveLocalDocument } from "@/lib/db";
import { extractDocument } from "@/lib/document";
import {
  markDirty,
  markSyncReady,
  isSyncReady,
  syncOnLogin,
  configureSyncEngine,
  registerOnlineListener,
} from "@/lib/sync/syncEngine";
import type { MoneyNodeType } from "@/types/money";

const MENU_WIDTH = 255;
const GAP = 8;

function getMenuPos(btn: HTMLButtonElement) {
  const rect = btn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  return {
    bottom: window.innerHeight - rect.top + GAP,
    left: Math.min(Math.max(centerX - MENU_WIDTH / 2, 8), window.innerWidth - MENU_WIDTH - 8),
  };
}

export function MoneyMapApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const [modalType, setModalType] = useState<MoneyNodeType | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dbLoadedRef = useRef(false);
  const pendingSyncUserIdRef = useRef<string | null>(null);

  const fetchExchangeRate = useMoneyMapStore((state) => state.fetchExchangeRate);
  const nodes = useMoneyMapStore((state) => state.nodes);
  const contextMenu = useMoneyMapStore((state) => state.contextMenu);
  const closeContextMenu = useMoneyMapStore((state) => state.closeContextMenu);
  const pendingAddNodeId = useMoneyMapStore((state) => state.pendingAddNodeId);
  const setPendingAddNode = useMoneyMapStore((state) => state.setPendingAddNode);
  const { setUser, setLoaded } = useAuthStore();
  const setStatus = useSyncStore((state) => state.setStatus);
  const showToast = useToastStore((state) => state.showToast);

  // 1. Load from IndexedDB immediately — app works offline from the first frame
  useEffect(() => {
    void initFromDB().then(async () => {
      dbLoadedRef.current = true;
      setStatus(navigator.onLine ? "local-only" : "offline");
      // If auth resolved before DB was ready, sync now and wait before marking ready
      if (pendingSyncUserIdRef.current) {
        await syncOnLogin(pendingSyncUserIdRef.current);
        pendingSyncUserIdRef.current = null;
      }
      // All initialization done — allow subscription to flush dirty writes
      markSyncReady();
    });
  }, [setStatus]);

  // 2. Subscribe store → save to IndexedDB on every change + mark dirty for cloud sync.
  // isSyncReady() gate prevents the subscription from flushing the initial placeholder
  // state (or a partially-loaded state) as a cloud write before initFromDB completes.
  useEffect(() => {
    const unsubscribe = useMoneyMapStore.subscribe(async (state) => {
      if (!isSyncReady()) return;
      const doc = extractDocument(state);
      await saveLocalDocument(doc);
      markDirty();
    });
    return unsubscribe;
  }, []);

  // 3. Register online/focus listeners for background sync
  useEffect(() => {
    return registerOnlineListener();
  }, []);

  // Show toast on sync error
  useEffect(() => {
    return useSyncStore.subscribe((state) => {
      if (state.status === "error") {
        showToast("Sync failed — changes are saved locally");
      }
    });
  }, [showToast]);

  // 4. Reflect network offline status
  useEffect(() => {
    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      if (!useAuthStore.getState().user) setStatus("local-only");
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [setStatus]);

  // 5. Supabase auth — restore session silently, sync on sign-in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoaded();
      if (session?.user) {
        if (dbLoadedRef.current) {
          void syncOnLogin(session.user.id).then(() => markSyncReady());
        } else {
          pendingSyncUserIdRef.current = session.user.id;
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session?.user) {
        showToast("Signed in — syncing your data", "success");
        if (dbLoadedRef.current) {
          void syncOnLogin(session.user.id).then(() => markSyncReady());
        } else {
          pendingSyncUserIdRef.current = session.user.id;
        }
      }
      if (event === "SIGNED_OUT") {
        configureSyncEngine(null);
        setStatus("local-only");
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoaded, setStatus, showToast]);

  useEffect(() => {
    void fetchExchangeRate();
  }, [fetchExchangeRate]);

  // Open QuickAddModal when + button clicked on a node
  useEffect(() => {
    if (!pendingAddNodeId) return;
    const node = nodes.find((n) => n.id === pendingAddNodeId);
    if (node) {
      setEditItemId(null);
      setModalType(node.data.type);
    }
    setPendingAddNode(null);
  }, [pendingAddNodeId, nodes, setPendingAddNode]);

  function handleAddClick() {
    if (!menuOpen && addButtonRef.current) {
      setMenuPos(getMenuPos(addButtonRef.current));
    }
    setMenuOpen((open) => !open);
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-canvas text-ink">
      <MoneyCanvas />
      <TopBrandBar />
      <AddTypeMenu
        open={menuOpen}
        menuPos={menuPos}
        onClose={() => setMenuOpen(false)}
        onSelect={(type) => {
          setMenuOpen(false);
          setEditItemId(null);
          setModalType(type);
        }}
      />
      <BottomNav
        addButtonRef={addButtonRef}
        onAddClick={handleAddClick}
        onAnalyticsClick={() => setAnalyticsOpen((open) => !open)}
        onSettingsClick={() => setSettingsOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        analyticsOpen={analyticsOpen}
      />
      {contextMenu.target?.type === "node" && (
        <NodeContextMenu
          open={contextMenu.open}
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.target.nodeId}
          onClose={closeContextMenu}
          onAddItem={(nodeId) => {
            const node = nodes.find((candidate) => candidate.id === nodeId);
            if (!node) return;
            setEditItemId(null);
            setModalType(node.data.type);
          }}
        />
      )}
      {contextMenu.target?.type === "item" && (
        <ItemContextMenu
          open={contextMenu.open}
          x={contextMenu.x}
          y={contextMenu.y}
          itemId={contextMenu.target.itemId}
          onClose={closeContextMenu}
          onEdit={(itemId) => {
            setModalType(null);
            setEditItemId(itemId);
          }}
        />
      )}
      <QuickAddModal
        type={modalType}
        editItemId={editItemId}
        open={modalType !== null || editItemId !== null}
        onClose={() => {
          setModalType(null);
          setEditItemId(null);
        }}
      />
      <AnalyticsModal open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SearchPopover open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SignInNudge />
      <AppToast />
    </main>
  );
}
