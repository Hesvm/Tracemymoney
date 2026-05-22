import { decorateEdge } from "@/lib/edges";
import { defaultAppSettings } from "@/store/moneyMapStore";
import { normalizeMonth } from "@/lib/months";
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

export function applyDocument(doc: UserDocument): Partial<DocumentSlice> {
  return {
    nodes: doc.nodes,
    edges: doc.edges.map(decorateEdge),
    items: doc.items,
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
