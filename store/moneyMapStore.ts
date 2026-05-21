"use client";

import { applyEdgeChanges, applyNodeChanges, MarkerType, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createMoneyAmount } from "@/lib/currency";
import { fetchUsdToTomanRate } from "@/lib/exchangeRate";
import { createId } from "@/lib/ids";
import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import { normalizeMonth, shiftMonth } from "@/lib/months";
import { resetUserCreatedData } from "@/lib/settingsData";
import type { AppSettings, CalendarSystem, Currency, ExchangeRateState, GoalCategory, MoneyFlowEdge, MoneyFlowNode, MoneyItem, MoneyNodeType, RecurrenceType } from "@/types/money";

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
};

type MoneyMapStore = {
  items: MoneyItem[];
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  settings: AppSettings;
  exchangeRate: ExchangeRateState;
  selectedEdgeId: string | null;
  focusedNodeId: string | null;
  addItemFromForm: (payload: AddPayload) => void;
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
};

const nodeIdByType: Partial<Record<MoneyNodeType, string>> = {
  income: "node-income",
  expense: "node-expense",
  savings: "node-savings"
};

const titleByType: Record<MoneyNodeType, string> = {
  income: "Income",
  expense: "Expenses",
  savings: "Savings",
  goal: "Goals",
  bucket: "Bucket"
};

const goalOffset = { x: 910, y: 250 };
const bucketOffset = { x: 120, y: 500 };

export const defaultAppSettings: AppSettings = {
  defaultCurrency: "TOMAN",
  calendarSystem: "shamsi",
  showCanvasDots: true,
  softAnimations: true
};

function createEdge(source: string, target: string): MoneyFlowEdge {
  return decorateEdge({
    id: `edge-${source}-${target}`,
    source,
    target,
  });
}

function decorateEdge(edge: MoneyFlowEdge): MoneyFlowEdge {
  return {
    ...edge,
    type: "moneyEdge",
    animated: false,
    style: { ...edge.style, stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  };
}

function compactNodePosition(type: MoneyNodeType, count: number) {
  if (type === "goal") return { x: goalOffset.x + count * 24, y: goalOffset.y + count * 34 };
  return { x: bucketOffset.x + count * 24, y: bucketOffset.y + count * 34 };
}

export const useMoneyMapStore = create<MoneyMapStore>()(
  persist(
    (set, get) => ({
      items: initialItems,
      nodes: initialNodes,
      edges: initialEdges,
      selectedMonth: "2026-05",
      calendarSystem: "shamsi",
      settings: defaultAppSettings,
      selectedEdgeId: null,
      focusedNodeId: null,
      exchangeRate: {
        usdToToman: null,
        fetchedAt: null,
        isLoading: false
      },
      addItemFromForm: (payload) => {
        const now = new Date().toISOString();
        if (payload.type === "bucket") {
          set((state) => {
            const sameTypeCount = state.nodes.filter((node) => node.data.type === "bucket").length;
            const targetNodeId = createId("node-bucket");
            const nodes: MoneyFlowNode[] = [
              ...state.nodes,
              {
                id: targetNodeId,
                type: "moneyNode",
                position: compactNodePosition("bucket", sameTypeCount),
                data: {
                  type: "bucket",
                  title: payload.title || titleByType.bucket,
                  itemIds: []
                }
              }
            ];
            const shouldConnect = Boolean(payload.parentNodeId);
            const edges =
              shouldConnect && payload.parentNodeId && !state.edges.some((edge) => edge.source === payload.parentNodeId && edge.target === targetNodeId)
                ? [...state.edges, createEdge(payload.parentNodeId, targetNodeId)]
                : state.edges;

            return { nodes, edges };
          });
          return;
        }

        const currency = payload.currency ?? get().settings.defaultCurrency;
        const moneyAmount =
          payload.amount !== undefined ? createMoneyAmount(payload.amount, currency, get().exchangeRate.usdToToman) : undefined;
        const targetAmount =
          payload.targetAmount !== undefined ? createMoneyAmount(payload.targetAmount, currency, get().exchangeRate.usdToToman) : undefined;
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
          createdAt: now,
          updatedAt: now
        };

        set((state) => {
          let nodes = state.nodes;
          let edges = state.edges;
          const existingId = nodeIdByType[payload.type];
          const targetNodeId = existingId ?? createId(`node-${payload.type}`);

          if (existingId) {
            nodes = nodes.map((node) =>
              node.id === existingId
                ? { ...node, data: { ...node.data, itemIds: [...node.data.itemIds, item.id] } }
                : node
            );
          } else {
            const sameTypeCount = nodes.filter((node) => node.data.type === payload.type).length;
            nodes = [
              ...nodes,
              {
                id: targetNodeId,
                type: "moneyNode",
                position: compactNodePosition(payload.type, sameTypeCount),
                data: {
                  type: payload.type,
                  title: payload.type === "goal" ? payload.title || titleByType[payload.type] : titleByType[payload.type],
                  itemIds: [item.id],
                  category: payload.type === "goal" ? payload.category : undefined
                }
              }
            ];
          }

          const source = payload.parentNodeId ?? (payload.type === "goal" ? "node-savings" : "node-income");
          if (source !== targetNodeId && !edges.some((edge) => edge.source === source && edge.target === targetNodeId)) {
            edges = [...edges, createEdge(source, targetNodeId)];
          }

          return {
            items: [...state.items, item],
            nodes,
            edges
          };
        });
      },
      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as MoneyFlowNode[]
        }));
      },
      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges) as MoneyFlowEdge[]
        }));
      },
      setSelectedMonth: (month) => set({ selectedMonth: normalizeMonth(month) }),
      shiftSelectedMonth: (delta) => set((state) => ({ selectedMonth: shiftMonth(state.selectedMonth, delta) })),
      setCalendarSystem: (calendarSystem) => set((state) => ({ calendarSystem, settings: { ...state.settings, calendarSystem } })),
      updateSettings: (settings) => set((state) => {
        const nextSettings = { ...state.settings, ...settings };
        return {
          settings: nextSettings,
          calendarSystem: nextSettings.calendarSystem
        };
      }),
      setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),
      focusNode: (nodeId) => set({ focusedNodeId: nodeId }),
      resetLocalData: () => {
        set((state) => ({
          ...resetUserCreatedData({
            items: state.items,
            nodes: state.nodes,
            edges: state.edges
          }),
          selectedEdgeId: null
        }));
      },
      addEdge: (source, target) => {
        set((state) => ({
          edges: [...state.edges, decorateEdge({
            id: `edge-${source}-${target}-${Date.now()}`,
            source,
            target
          })],
          selectedEdgeId: null
        }));
      },
      deleteEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
          selectedEdgeId: null
        }));
      },
      reconnectEdge: (edgeId, newConnection) => {
        const { source, target, sourceHandle, targetHandle } = newConnection;
        if (!source || !target) return false;
        if (source === target) return false;

        const state = get();
        const isDuplicate = state.edges.some(
          (edge) => edge.id !== edgeId && edge.source === source && edge.target === target
        );
        if (isDuplicate) return false;

        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId
              ? decorateEdge({
                  ...edge,
                  source,
                  target,
                  sourceHandle: sourceHandle ?? undefined,
                  targetHandle: targetHandle ?? undefined
                })
              : edge
          )
        }));
        return true;
      },
      fetchExchangeRate: async () => {
        set((state) => ({ exchangeRate: { ...state.exchangeRate, isLoading: true, error: undefined } }));
        try {
          const usdToToman = await fetchUsdToTomanRate();
          set({
            exchangeRate: {
              usdToToman,
              fetchedAt: new Date().toISOString(),
              isLoading: false
            }
          });
        } catch (error) {
          set((state) => ({
            exchangeRate: {
              ...state.exchangeRate,
              isLoading: false,
              error: error instanceof Error ? error.message : "Exchange rate fetch failed"
            }
          }));
        }
      }
    }),
    {
      name: "trace-my-money-map",
      partialize: (state) => ({
        items: state.items,
        nodes: state.nodes,
        edges: state.edges,
        selectedMonth: state.selectedMonth,
        calendarSystem: state.calendarSystem,
        settings: state.settings,
        exchangeRate: {
          usdToToman: state.exchangeRate.usdToToman,
          fetchedAt: state.exchangeRate.fetchedAt,
          isLoading: false,
          error: state.exchangeRate.error
        },
        selectedEdgeId: null
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<MoneyMapStore> | undefined;
        const selectedMonth = normalizeMonth(persistedState?.selectedMonth ?? current.selectedMonth);
        return {
          ...current,
          ...persistedState,
          selectedMonth,
          settings: {
            ...defaultAppSettings,
            ...persistedState?.settings,
            calendarSystem: persistedState?.settings?.calendarSystem ?? persistedState?.calendarSystem ?? current.calendarSystem
          },
          calendarSystem: persistedState?.settings?.calendarSystem ?? persistedState?.calendarSystem ?? current.calendarSystem,
          edges: (persistedState?.edges ?? current.edges).map(decorateEdge)
        };
      }
    }
  )
);
