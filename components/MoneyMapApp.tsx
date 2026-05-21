"use client";

import { useEffect, useRef, useState } from "react";
import { AddTypeMenu } from "@/components/quick-add/AddTypeMenu";
import { AnalyticsModal } from "@/components/analytics/AnalyticsModal";
import { QuickAddModal } from "@/components/quick-add/QuickAddModal";
import { MoneyCanvas } from "@/components/canvas/MoneyCanvas";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TopBrandBar } from "@/components/navigation/TopBrandBar";
import { SearchPopover } from "@/components/search/SearchPopover";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useMoneyMapStore } from "@/store/moneyMapStore";
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
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const fetchExchangeRate = useMoneyMapStore((state) => state.fetchExchangeRate);

  useEffect(() => {
    void fetchExchangeRate();
  }, [fetchExchangeRate]);

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
      <QuickAddModal type={modalType} open={modalType !== null} onClose={() => setModalType(null)} />
      <AnalyticsModal open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SearchPopover open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
