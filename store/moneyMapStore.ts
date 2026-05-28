"use client";

import { applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import { createLockedAmount, createLiveAmount } from "@/lib/currency";
import { createEdge, decorateEdge } from "@/lib/edges";
import { fetchUsdToTomanRate } from "@/lib/exchangeRate";
import { createId } from "@/lib/ids";
import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import { normalizeMonth, shiftMonth } from "@/lib/months";
import { resetUserCreatedData } from "@/lib/settingsData";
import { loadLocalDocument } from "@/lib/db";
import { saveDailyRate } from "@/lib/exchangeRates/saveDailyRate";
import { applyDocument } from "@/lib/document";
import type {
  AppSettings,
  CalendarSystem,
  Currency,
  ExchangeRateState,
  GoalCategory,
  MoneyFlowEdge,
  MoneyFlowNode,
  MoneyItem,
  MoneyNodeType,
  RecurrenceType,
} from "@/types/money";

type AddPayload = {
  type: MoneyNodeType;
  amount?: number;
  currency?: Currency;
  title: string;
  date?: string;
  note?: string;
  recurrence?: RecurrenceType;
  parentNodeId?: string;
  targetAmount?: number;
  category?: GoalCategory;
  rateOverride?: number;
  rateSource?: import("@/types/money").RateSource;
  inputMode?: "fixed" | "percentage";
  percentageValue?: number;
  baseAmountSnapshot?: number;
  percentageBaseType?: "bucket_inflow";
  percentageBaseNodeId?: string;
};

export type ContextMenuTarget =
  | { type: "node"; nodeId: string }
  | { type: "item"; nodeId: string; itemId: string };

export type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  target: ContextMenuTarget | null;
};

type MoneyMapStore = {
  items: MoneyItem[];
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  settings: AppSettings;
  exchangeRate: ExchangeRateState;
  // Tracks when the USER last mutated real data. Never advanced by sync
  // operations, exchange-rate updates, or pure-UI state changes. Used as
  // metadata.updatedAt so the last-write-wins merge compares meaningful
  // timestamps instead of "last time the subscription serialised the store."
  lastModifiedAt: string;
  selectedEdgeId: string | null;
  focusedNodeId: string | null;
  pendingAddNodeId: string | null;
  contextMenu: ContextMenuState;
  addItemFromForm: (payload: AddPayload) => void;
  updateItemFromForm: (itemId: string, payload: AddPayload) => void;
  duplicateItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  renameNode: (nodeId: string, title: string) => void;
  duplicateNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  onNodesChange: (changes: NodeChange<MoneyFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MoneyFlowEdge>[]) => void;
  setSelectedMonth: (month: string) => void;
  shiftSelectedMonth: (delta: number) => void;
  setCalendarSystem: (calendarSystem: CalendarSystem) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  fetchExchangeRate: () => Promise<void>;
  resetLocalData: () => void;
  addEdge: (source: string, target: string) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  focusNode: (nodeId: string | null) => void;
  reconnectEdge: (edgeId: string, newConnection: Connection) => boolean;
  openContextMenu: (x: number, y: number, target: ContextMenuTarget) => void;
  closeContextMenu: () => void;
  setPendingAddNode: (nodeId: string | null) => void;
};

const nodeIdByType: Partial<Record<MoneyNodeType, string>> = {
  income: "node-income",
  expense: "node-expense",
  savings: "node-savings",
};

const titleByType: Record<MoneyNodeType, string> = {
  income: "Income",
  expense: "Expenses",
  savings: "Savings",
  goal: "Goals",
  bucket: "Bucket",
};

const goalOffset = { x: 910, y: 250 };
const bucketOffset = { x: 120, y: 500 };
const systemNodeIds = new Set(["node-income", "node-expense", "node-savings"]);

export const defaultAppSettings: AppSettings = {
  defaultCurrency: "TOMAN",
  calendarSystem: "shamsi",
  showCanvasDots: true,
  softAnimations: true,
};

function compactNodePosition(type: MoneyNodeType, count: number) {
  if (type === "goal") return { x: goalOffset.x + count * 24, y: goalOffset.y + count * 34 };
  return { x: bucketOffset.x + count * 24, y: bucketOffset.y + count * 34 };
}

export const useMoneyMapStore = create<MoneyMapStore>()(
  (set, get) => ({
    items: initialItems,
    nodes: initialNodes,
    edges: initialEdges,
    selectedMonth: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })(),
    calendarSystem: "shamsi",
    settings: defaultAppSettings,
    selectedEdgeId: null,
    focusedNodeId: null,
    pendingAddNodeId: null,
    contextMenu: { open: false, x: 0, y: 0, target: null },
    exchangeRate: { usdToToman: null, fetchedAt: null, isLoading: false },
    // Epoch zero → any real cloud data wins on first open for a new device
    lastModifiedAt: "1970-01-01T00:00:00.000Z",

    addItemFromForm: (payload) => {
      const now = new Date().toISOString();
      if (payload.type === "bucket") {
        set((state) => {
          const sameTypeCount = state.nodes.filter((n) => n.data.type === "bucket").length;
          const targetNodeId = createId("node-bucket");
          const nodes: MoneyFlowNode[] = [
            ...state.nodes,
            {
              id: targetNodeId,
              type: "moneyNode",
              position: compactNodePosition("bucket", sameTypeCount),
              data: { type: "bucket", title: payload.title || titleByType.bucket, itemIds: [] },
            },
          ];
          const edges =
            payload.parentNodeId &&
            !state.edges.some((e) => e.source === payload.parentNodeId && e.target === targetNodeId)
              ? [...state.edges, createEdge(payload.parentNodeId, targetNodeId)]
              : state.edges;
          return { nodes, edges, lastModifiedAt: now };
        });
        return;
      }

      const currency = payload.currency ?? get().settings.defaultCurrency;
      const isHistorical = payload.type === "income" || payload.type === "expense";
      const effectiveRate = payload.rateOverride ?? get().exchangeRate.usdToToman;
      const effectiveRateSource = payload.rateSource ?? "current_api";
      const moneyAmount =
        payload.amount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.amount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.amount, currency)
          : undefined;
      const targetAmount =
        payload.targetAmount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.targetAmount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.targetAmount, currency)
          : undefined;
      const item: MoneyItem = {
        id: createId("item"),
        title: payload.title,
        type: payload.type,
        amount: moneyAmount,
        targetAmount,
        date: payload.date,
        note: payload.note,
        recurrence: payload.recurrence ?? "none",
        parentId: payload.parentNodeId,
        category: payload.type === "goal" ? payload.category : undefined,
        inputMode: payload.inputMode,
        percentageValue: payload.percentageValue,
        baseAmountSnapshot: payload.baseAmountSnapshot,
        percentageBaseType: payload.percentageBaseType,
        percentageBaseNodeId: payload.percentageBaseNodeId,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        let nodes = state.nodes;
        let edges = state.edges;
        const existingId = nodeIdByType[payload.type];
        const targetNodeId = existingId ?? createId(`node-${payload.type}`);

        if (existingId) {
          nodes = nodes.map((n) =>
            n.id === existingId
              ? { ...n, data: { ...n.data, itemIds: [...n.data.itemIds, item.id] } }
              : n
          );
        } else {
          const sameTypeCount = nodes.filter((n) => n.data.type === payload.type).length;
          nodes = [
            ...nodes,
            {
              id: targetNodeId,
              type: "moneyNode",
              position: compactNodePosition(payload.type, sameTypeCount),
              data: {
                type: payload.type,
                title:
                  payload.type === "goal"
                    ? payload.title || titleByType[payload.type]
                    : titleByType[payload.type],
                itemIds: [item.id],
                category: payload.type === "goal" ? payload.category : undefined,
              },
            },
          ];
        }

        const source =
          payload.parentNodeId ?? (payload.type === "goal" ? "node-savings" : "node-income");
        if (
          source !== targetNodeId &&
          !edges.some((e) => e.source === source && e.target === targetNodeId)
        ) {
          edges = [...edges, createEdge(source, targetNodeId)];
        }

        return { items: [...state.items, item], nodes, edges, lastModifiedAt: now };
      });
    },

    updateItemFromForm: (itemId, payload) => {
      const currency = payload.currency ?? get().settings.defaultCurrency;
      const isHistorical = payload.type === "income" || payload.type === "expense";
      const effectiveRate = payload.rateOverride ?? get().exchangeRate.usdToToman;
      const effectiveRateSource = payload.rateSource ?? "current_api";
      const moneyAmount =
        payload.amount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.amount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.amount, currency)
          : undefined;
      const targetAmount =
        payload.targetAmount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.targetAmount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.targetAmount, currency)
          : undefined;

      set((state) => {
        const existing = state.items.find((i) => i.id === itemId);
        if (!existing) return state;
        const fallbackNodeId = nodeIdByType[payload.type];
        const currentNodeId = state.nodes.find((n) => n.data.itemIds.includes(itemId))?.id;
        const nextParentId = payload.parentNodeId || fallbackNodeId || currentNodeId;

        const mutatedAt = new Date().toISOString();
        return {
          lastModifiedAt: mutatedAt,
          items: state.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  title: payload.title,
                  type: payload.type,
                  amount: payload.type === "goal" ? undefined : moneyAmount,
                  targetAmount: payload.type === "goal" ? targetAmount : undefined,
                  date: payload.date,
                  note: payload.note,
                  recurrence: payload.type === "goal" ? "none" : payload.recurrence,
                  parentId: payload.parentNodeId || undefined,
                  category: payload.type === "goal" ? payload.category : undefined,
                  inputMode: payload.inputMode,
                  percentageValue: payload.percentageValue,
                  baseAmountSnapshot: payload.baseAmountSnapshot,
                  percentageBaseType: payload.percentageBaseType,
                  percentageBaseNodeId: payload.percentageBaseNodeId,
                  updatedAt: mutatedAt,
                }
              : i
          ),
          nodes: state.nodes.map((n) => {
            const itemIds = n.data.itemIds.filter((id) => id !== itemId);
            return n.id === nextParentId
              ? { ...n, data: { ...n.data, itemIds: [...itemIds, itemId] } }
              : { ...n, data: { ...n.data, itemIds } };
          }),
        };
      });
    },

    duplicateItem: (itemId) => {
      set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (!item) return state;
        const copyId = createId("item");
        const now = new Date().toISOString();
        const copiedItem: MoneyItem = {
          ...item,
          id: copyId,
          title: item.title ? `${item.title} copy` : item.title,
          createdAt: now,
          updatedAt: now,
        };
        const parentNodeId = item.parentId ?? nodeIdByType[item.type];
        return {
          lastModifiedAt: now,
          items: [...state.items, copiedItem],
          nodes: state.nodes.map((n) =>
            n.id === parentNodeId
              ? { ...n, data: { ...n.data, itemIds: [...n.data.itemIds, copyId] } }
              : n
          ),
        };
      });
    },

    deleteItem: (itemId) => {
      set((state) => ({
        lastModifiedAt: new Date().toISOString(),
        items: state.items.filter((i) => i.id !== itemId),
        nodes: state.nodes.map((n) => ({
          ...n,
          data: { ...n.data, itemIds: n.data.itemIds.filter((id) => id !== itemId) },
        })),
      }));
    },

    renameNode: (nodeId, title) => {
      if (systemNodeIds.has(nodeId)) return;
      const trimmed = title.trim();
      if (!trimmed) return;
      set((state) => ({
        lastModifiedAt: new Date().toISOString(),
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, title: trimmed } } : n
        ),
      }));
    },

    duplicateNode: (nodeId) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node || systemNodeIds.has(nodeId)) return state;
        const copyId = createId(`node-${node.data.type}`);
        const copy: MoneyFlowNode = {
          ...node,
          id: copyId,
          selected: false,
          dragging: false,
          position: { x: node.position.x + 34, y: node.position.y + 34 },
          data: { ...node.data, title: `${node.data.title} copy`, itemIds: [] },
        };
        return { lastModifiedAt: new Date().toISOString(), nodes: [...state.nodes, copy], selectedEdgeId: null };
      });
    },

    deleteNode: (nodeId) => {
      if (systemNodeIds.has(nodeId)) return;
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return state;
        const itemIds = new Set(node.data.itemIds);
        return {
          lastModifiedAt: new Date().toISOString(),
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          items: state.items.filter((i) => !itemIds.has(i.id)),
          selectedEdgeId: null,
          focusedNodeId: state.focusedNodeId === nodeId ? null : state.focusedNodeId,
        };
      });
    },

    toggleNodeCollapsed: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n
        ),
      }));
    },

    onNodesChange: (changes) => {
      set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as MoneyFlowNode[] }));
    },

    onEdgesChange: (changes) => {
      set((state) => ({ edges: applyEdgeChanges(changes, state.edges) as MoneyFlowEdge[] }));
    },

    setSelectedMonth: (month) => set({ selectedMonth: normalizeMonth(month) }),
    shiftSelectedMonth: (delta) =>
      set((state) => ({ selectedMonth: shiftMonth(state.selectedMonth, delta) })),
    setCalendarSystem: (calendarSystem) =>
      set((state) => ({ calendarSystem, settings: { ...state.settings, calendarSystem } })),
    updateSettings: (settings) =>
      set((state) => {
        const nextSettings = { ...state.settings, ...settings };
        return { lastModifiedAt: new Date().toISOString(), settings: nextSettings, calendarSystem: nextSettings.calendarSystem };
      }),

    setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),
    focusNode: (nodeId) => set({ focusedNodeId: nodeId }),

    resetLocalData: () => {
      set((state) => ({
        ...resetUserCreatedData({ items: state.items, nodes: state.nodes, edges: state.edges }),
        lastModifiedAt: new Date().toISOString(),
        selectedEdgeId: null,
      }));
    },

    addEdge: (source, target) => {
      set((state) => ({
        lastModifiedAt: new Date().toISOString(),
        edges: [
          ...state.edges,
          decorateEdge({ id: `edge-${source}-${target}-${Date.now()}`, source, target }),
        ],
        selectedEdgeId: null,
      }));
    },

    deleteEdge: (edgeId) => {
      set((state) => ({
        lastModifiedAt: new Date().toISOString(),
        edges: state.edges.filter((e) => e.id !== edgeId),
        selectedEdgeId: null,
      }));
    },

    reconnectEdge: (edgeId, newConnection) => {
      const { source, target, sourceHandle, targetHandle } = newConnection;
      if (!source || !target || source === target) return false;
      const state = get();
      if (state.edges.some((e) => e.id !== edgeId && e.source === source && e.target === target))
        return false;
      set((state) => ({
        lastModifiedAt: new Date().toISOString(),
        edges: state.edges.map((e) =>
          e.id === edgeId
            ? decorateEdge({
                ...e,
                source,
                target,
                sourceHandle: sourceHandle ?? undefined,
                targetHandle: targetHandle ?? undefined,
              })
            : e
        ),
      }));
      return true;
    },

    openContextMenu: (x, y, target) =>
      set({ contextMenu: { open: true, x, y, target }, selectedEdgeId: null }),
    closeContextMenu: () =>
      set((state) => ({ contextMenu: { ...state.contextMenu, open: false } })),
    setPendingAddNode: (nodeId) => set({ pendingAddNodeId: nodeId }),

    fetchExchangeRate: async () => {
      const { fetchedAt } = get().exchangeRate;
      if (fetchedAt) {
        const ageMs = Date.now() - new Date(fetchedAt).getTime();
        if (ageMs < 2 * 60 * 60 * 1000) return; // skip if fetched within 2 hours
      }
      set((state) => ({ exchangeRate: { ...state.exchangeRate, isLoading: true, error: undefined } }));
      try {
        const usdToToman = await fetchUsdToTomanRate();
        set((state) => {
          // Backfill: stamp convertedAmountAtEntry on income/expense items that are missing it.
          // Does not advance lastModifiedAt — this is not a user mutation.
          const needsBackfill = state.items.some(
            (item) =>
              (item.type === "income" || item.type === "expense") &&
              item.amount &&
              item.amount.convertedAmountAtEntry == null
          );
          const items = needsBackfill
            ? state.items.map((item) => {
                if (
                  (item.type === "income" || item.type === "expense") &&
                  item.amount &&
                  item.amount.convertedAmountAtEntry == null
                ) {
                  return {
                    ...item,
                    amount: createLockedAmount(item.amount.amount, item.amount.currency, usdToToman),
                  };
                }
                return item;
              })
            : state.items;
          return {
            exchangeRate: { usdToToman, fetchedAt: new Date().toISOString(), isLoading: false },
            items,
          };
        });
        saveDailyRate(usdToToman).catch(() => {/* non-critical */});
      } catch (error) {
        set((state) => ({
          exchangeRate: {
            ...state.exchangeRate,
            isLoading: false,
            error: error instanceof Error ? error.message : "Exchange rate fetch failed",
          },
        }));
      }
    },
  })
);

export async function initFromDB(): Promise<void> {
  const doc = await loadLocalDocument();
  if (doc) {
    // applyDocument handles the empty-doc case by restoring initialData
    useMoneyMapStore.setState(applyDocument(doc));
  }
  // No doc → store already initialized with initialData + current selectedMonth
}
