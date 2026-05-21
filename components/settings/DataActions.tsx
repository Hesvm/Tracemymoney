"use client";

import { Download, RotateCcw } from "lucide-react";
import { buildSettingsExport } from "@/lib/settingsData";
import { useMoneyMapStore } from "@/store/moneyMapStore";

const resetCopy = "This will delete all local nodes, transactions, goals, and buckets. Your settings will be kept. This cannot be undone.";

function exportJson() {
  const state = useMoneyMapStore.getState();
  const data = buildSettingsExport({
    items: state.items,
    nodes: state.nodes,
    edges: state.edges,
    settings: state.settings,
    exchangeRate: state.exchangeRate
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `trace-my-money-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DataActions() {
  const resetLocalData = useMoneyMapStore((state) => state.resetLocalData);

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-[14px] font-semibold text-[#30333b] shadow-[inset_0_0_0_1px_#ebe7dd] transition hover:bg-[#fbfaf7] active:scale-[0.98]"
        onClick={exportJson}
      >
        <Download className="size-4" strokeWidth={2.1} />
        Export JSON
      </button>
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#fff1f1] px-3 text-[14px] font-semibold text-[#c64141] transition hover:bg-[#ffe8e8] active:scale-[0.98]"
        onClick={() => {
          if (window.confirm(resetCopy)) resetLocalData();
        }}
      >
        <RotateCcw className="size-4" strokeWidth={2.1} />
        Reset data
      </button>
    </div>
  );
}
