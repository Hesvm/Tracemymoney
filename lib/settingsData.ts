import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import type { AppSettings, ExchangeRateState, MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";

export type LocalDataSnapshot = {
  items: MoneyItem[];
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
};

export type SettingsExport = LocalDataSnapshot & {
  settings: AppSettings;
  exchangeRate: ExchangeRateState;
  exportedAt: string;
};

export function resetUserCreatedData(snapshot?: LocalDataSnapshot): LocalDataSnapshot {
  void snapshot;
  return {
    items: initialItems,
    nodes: initialNodes,
    edges: initialEdges
  };
}

export function buildSettingsExport({
  items,
  nodes,
  edges,
  settings,
  exchangeRate
}: Omit<SettingsExport, "exportedAt">): SettingsExport {
  return {
    items,
    nodes,
    edges,
    settings,
    exchangeRate: {
      ...exchangeRate,
      isLoading: false
    },
    exportedAt: new Date().toISOString()
  };
}
