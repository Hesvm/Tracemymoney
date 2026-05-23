import { decorateEdge } from "@/lib/edges";
import { defaultAppSettings } from "@/store/moneyMapStore";
import { normalizeMonth } from "@/lib/months";
import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import type {
  AppSettings,
  CalendarSystem,
  ExchangeRateState,
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
      updatedAt: new Date().toISOString(),
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

export function applyDocument(doc: UserDocument): Partial<DocumentSlice> {
  const isEmpty = doc.nodes.length === 0 && doc.items.length === 0;
  return {
    nodes: ensureSystemNodes(doc.nodes, doc.items),
    edges: isEmpty ? initialEdges : doc.edges.map(decorateEdge),
    items: isEmpty ? initialItems : doc.items,
    settings: { ...defaultAppSettings, ...doc.settings },
    selectedMonth: normalizeMonth(doc.selectedMonth),
    calendarSystem: doc.calendarSystem,
    exchangeRate: {
      usdToToman: doc.exchangeRate.usdToToman,
      fetchedAt: doc.exchangeRate.fetchedAt,
      isLoading: false,
    },
  };
}
