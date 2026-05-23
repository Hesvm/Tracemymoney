import { decorateEdge } from "@/lib/edges";
import { defaultAppSettings } from "@/store/moneyMapStore";
import { normalizeMonth } from "@/lib/months";
import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import type {
  AppSettings,
  CalendarSystem,
  ExchangeRateState,
  MoneyAmount,
  MoneyFlowEdge,
  MoneyFlowNode,
  MoneyItem,
} from "@/types/money";

export interface UserDocument {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  items: MoneyItem[];
  settings: AppSettings;
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  exchangeRate: {
    usdToToman: number | null;
    fetchedAt: string | null;
  };
  metadata: {
    updatedAt: string;
    version: number;
  };
}

export type DocumentSlice = {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  items: MoneyItem[];
  settings: AppSettings;
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  exchangeRate: ExchangeRateState;
  lastModifiedAt: string;
};

export function extractDocument(state: DocumentSlice): UserDocument {
  return {
    nodes: state.nodes,
    edges: state.edges,
    items: state.items,
    settings: state.settings,
    selectedMonth: state.selectedMonth,
    calendarSystem: state.calendarSystem,
    exchangeRate: {
      usdToToman: state.exchangeRate.usdToToman,
      fetchedAt: state.exchangeRate.fetchedAt,
    },
    metadata: {
      // Use the store's lastModifiedAt so LWW merge compares real user-action timestamps,
      // not "last time this serialization ran" which would always be "now".
      updatedAt: state.lastModifiedAt,
      version: 1,
    },
  };
}

const SYSTEM_NODE_IDS = ["node-income", "node-expense", "node-savings"] as const;

function ensureSystemNodes(nodes: MoneyFlowNode[], items: MoneyItem[]): MoneyFlowNode[] {
  if (nodes.length === 0 && items.length === 0) {
    // Completely empty doc — restore full initial layout
    return initialNodes;
  }
  // Ensure each system node exists; add back any that are missing
  const result = [...nodes];
  for (const sysNode of initialNodes.filter((n) => SYSTEM_NODE_IDS.includes(n.id as typeof SYSTEM_NODE_IDS[number]))) {
    if (!result.some((n) => n.id === sysNode.id)) {
      result.push({ ...sysNode, data: { ...sysNode.data, itemIds: [] } });
    }
  }
  return result;
}

type LegacyMoneyAmount = {
  amount?: number;
  currency?: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRateSnapshot?: number;
  convertedAmountAtEntry?: number;
  exchangeRateAtEntry?: number;
};

function migrateMoneyAmount(raw: LegacyMoneyAmount | undefined): MoneyAmount | undefined {
  if (!raw) return undefined;
  const result = { ...raw } as Record<string, unknown>;
  if ("exchangeRateSnapshot" in result && !("exchangeRateAtEntry" in result)) {
    result.exchangeRateAtEntry = result.exchangeRateSnapshot;
  }
  if ("convertedAmount" in result && !("convertedAmountAtEntry" in result)) {
    result.convertedAmountAtEntry = result.convertedAmount;
  }
  delete result.exchangeRateSnapshot;
  delete result.convertedAmount;
  return result as unknown as MoneyAmount;
}

export function applyDocument(doc: UserDocument): Partial<DocumentSlice> {
  const isEmpty = doc.nodes.length === 0 && doc.items.length === 0;
  return {
    nodes: ensureSystemNodes(doc.nodes, doc.items),
    edges: isEmpty ? initialEdges : doc.edges.map(decorateEdge),
    items: isEmpty
      ? initialItems
      : doc.items.map((item) => ({
          ...item,
          amount: migrateMoneyAmount(item.amount as unknown as LegacyMoneyAmount),
          targetAmount: migrateMoneyAmount(item.targetAmount as unknown as LegacyMoneyAmount),
        })),
    settings: { ...defaultAppSettings, ...doc.settings },
    selectedMonth: normalizeMonth(doc.selectedMonth),
    calendarSystem: doc.calendarSystem,
    exchangeRate: {
      usdToToman: doc.exchangeRate.usdToToman,
      fetchedAt: doc.exchangeRate.fetchedAt,
      isLoading: false,
    },
    // Restore the real user-action timestamp so the next extractDocument
    // still reflects when the user actually last changed data.
    lastModifiedAt: doc.metadata.updatedAt,
  };
}
