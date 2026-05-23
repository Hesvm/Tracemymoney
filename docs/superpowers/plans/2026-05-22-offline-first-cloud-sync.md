# Offline-First Cloud Sync — Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth, IndexedDB local persistence, and cloud sync to Trace My Money — no Clerk, no Clerk remnants, full offline support.

**Architecture:** IndexedDB (Dexie.js) is the primary local store. Zustand is live app state. A background sync engine debounces uploads to Supabase. Supabase Auth handles sessions natively. The UI never waits on network.

**Tech Stack:** `@supabase/supabase-js` v2, `dexie`, Next.js 15 App Router, Zustand 5

---

## Credential Reference

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://pqdybprsihhyyhvjrfdb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZHlicHJzaWhoeXlodmpyZmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTAwMTAsImV4cCI6MjA5NDkyNjAxMH0.0NM9BAy2UoqvYGJ235Ru51Pc4arGJyb6LSRcVlCmkmM
# sb_publishable_nFfT84YTTxdTSMkZzlpeIA_Qg2vZjs2 — keep for reference, newer Supabase SDK format
```

---

## Pre-flight Checklist (manual steps BEFORE executing tasks)

1. **Magic link** — Supabase Dashboard → Authentication → Email → confirm "Enable Email" is on and "Confirm email" is set appropriately for magic links (OTP).
2. **Google OAuth** (optional) — Dashboard → Authentication → Providers → Google → enable and add Client ID/Secret.
3. **Site URL** — Dashboard → Authentication → URL Configuration → set Site URL to `http://localhost:3000` for dev; add production URL when deploying.
4. **Redirect URLs** — add `http://localhost:3000/**` to allowed redirect URLs.

---

## File Map

### New files
| File | Responsibility |
|------|----------------|
| `lib/edges.ts` | `decorateEdge` + `createEdge` helpers (extracted from store) |
| `lib/document.ts` | `UserDocument` type + `extractDocument` / `applyDocument` |
| `lib/db.ts` | Dexie.js database — single `documents` table |
| `lib/supabaseClient.ts` | Singleton Supabase client (handles auth/session internally) |
| `lib/sync/uploadDocument.ts` | Upload document to Supabase |
| `lib/sync/downloadDocument.ts` | Download document from Supabase |
| `lib/sync/mergeDocument.ts` | Latest-wins merge |
| `lib/sync/syncEngine.ts` | Dirty tracking, debounced upload, online/focus triggers |
| `store/syncStore.ts` | Zustand store for sync status |
| `store/authStore.ts` | Zustand store for Supabase session (userId, isLoaded) |
| `components/auth/AuthModal.tsx` | Magic link + Google login modal |
| `components/auth/AuthButton.tsx` | Sign-in trigger / signed-in state toggle |
| `components/auth/UserAvatar.tsx` | Signed-in user avatar + sign-out |
| `components/navigation/SyncStatus.tsx` | Subtle sync status pill |

### Modified files
| File | Change |
|------|--------|
| `store/moneyMapStore.ts` | Remove `persist`; import from `lib/edges.ts`; export `initFromDB` |
| `app/layout.tsx` | Remove ClerkProvider (if previously added); plain layout |
| `components/MoneyMapApp.tsx` | Wire IndexedDB init, store subscription, auth state, sync |
| `components/navigation/TopBrandBar.tsx` | Add `AuthButton` + `SyncStatus` |

### Deleted files (if previously created for Clerk)
- `middleware.ts` — delete entirely
- `app/sign-in/` — delete directory
- `app/sign-up/` — delete directory

---

## Task 1: Clean Up Clerk and Install Dependencies

**Files:** `package.json`, `middleware.ts` (delete), `app/sign-in/` (delete), `app/sign-up/` (delete), `app/layout.tsx`

- [ ] **Step 1: Remove Clerk package if installed**

```bash
npm uninstall @clerk/nextjs 2>/dev/null; echo "done"
```

- [ ] **Step 2: Install required packages**

```bash
npm install @supabase/supabase-js dexie
```

- [ ] **Step 3: Delete Clerk artifacts if they exist**

```bash
rm -f middleware.ts
rm -rf app/sign-in app/sign-up
```

- [ ] **Step 4: Ensure `app/layout.tsx` has no Clerk imports**

Replace the entire file with the clean version (no ClerkProvider):

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trace My Money",
  description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
  openGraph: {
    title: "Trace My Money",
    description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace My Money",
    description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://pqdybprsihhyyhvjrfdb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZHlicHJzaWhoeXlodmpyZmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTAwMTAsImV4cCI6MjA5NDkyNjAxMH0.0NM9BAy2UoqvYGJ235Ru51Pc4arGJyb6LSRcVlCmkmM
EOF
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/layout.tsx .env.local
git rm -f middleware.ts 2>/dev/null; git rm -rf app/sign-in app/sign-up 2>/dev/null; true
git commit -m "chore: remove Clerk, install supabase-js and dexie"
```

---

## Task 2: Extract Edge Helpers to `lib/edges.ts`

`decorateEdge` and `createEdge` live in the store today. They're needed by `lib/document.ts` too — extract them first.

**Files:**
- Create: `lib/edges.ts`
- Modify: `store/moneyMapStore.ts` (import only, no logic change)

- [ ] **Step 1: Create `lib/edges.ts`**

```typescript
import { MarkerType } from "@xyflow/react";
import type { MoneyFlowEdge } from "@/types/money";

export function decorateEdge(edge: MoneyFlowEdge): MoneyFlowEdge {
  return {
    ...edge,
    type: "moneyEdge",
    animated: false,
    style: { ...edge.style, stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  };
}

export function createEdge(source: string, target: string): MoneyFlowEdge {
  return decorateEdge({
    id: `edge-${source}-${target}`,
    source,
    target,
  });
}
```

- [ ] **Step 2: Update imports in `store/moneyMapStore.ts`**

In `store/moneyMapStore.ts`, delete the two function definitions for `createEdge` (lines ~99–105) and `decorateEdge` (lines ~107–115), and add this import after the existing imports:

```typescript
import { createEdge, decorateEdge } from "@/lib/edges";
```

All existing uses of `createEdge` and `decorateEdge` inside the store continue to work unchanged.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/edges.ts store/moneyMapStore.ts
git commit -m "refactor: extract edge helpers to lib/edges.ts"
```

---

## Task 3: Define `UserDocument` Type and Helpers

**Files:**
- Create: `lib/document.ts`

- [ ] **Step 1: Create `lib/document.ts`**

```typescript
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/document.ts
git commit -m "feat: add UserDocument type and extract/apply helpers"
```

---

## Task 4: Set Up Dexie IndexedDB

**Files:**
- Create: `lib/db.ts`

- [ ] **Step 1: Create `lib/db.ts`**

```typescript
import Dexie, { type Table } from "dexie";
import type { UserDocument } from "@/lib/document";

interface LocalRecord {
  id: string;
  data: UserDocument;
  updatedAt: string;
}

class MoneyMapDB extends Dexie {
  documents!: Table<LocalRecord, string>;

  constructor() {
    super("trace-my-money");
    this.version(1).stores({
      documents: "id",
    });
  }
}

export const db = new MoneyMapDB();

export async function loadLocalDocument(id = "local"): Promise<UserDocument | null> {
  const record = await db.documents.get(id);
  return record?.data ?? null;
}

export async function saveLocalDocument(doc: UserDocument, id = "local"): Promise<void> {
  await db.documents.put({ id, data: doc, updatedAt: new Date().toISOString() });
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: add Dexie IndexedDB database"
```

---

## Task 5: Replace `zustand/persist` with IndexedDB Persistence

The store currently uses `persist` middleware (localStorage). Replace it with direct Zustand state — IndexedDB persistence is handled by a subscription in `MoneyMapApp.tsx`.

**Files:**
- Modify: `store/moneyMapStore.ts`

- [ ] **Step 1: Rewrite `store/moneyMapStore.ts`**

Replace the entire file with the following. All action logic is identical to today — only the `persist()` wrapper is removed, initial state starts empty (IndexedDB will hydrate it), and `initFromDB` is exported.

```typescript
"use client";

import { applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import { createMoneyAmount } from "@/lib/currency";
import { createEdge, decorateEdge } from "@/lib/edges";
import { fetchUsdToTomanRate } from "@/lib/exchangeRate";
import { createId } from "@/lib/ids";
import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import { normalizeMonth, shiftMonth } from "@/lib/months";
import { resetUserCreatedData } from "@/lib/settingsData";
import { loadLocalDocument } from "@/lib/db";
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
  selectedEdgeId: string | null;
  focusedNodeId: string | null;
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
    items: [],
    nodes: [],
    edges: [],
    selectedMonth: "2026-05",
    calendarSystem: "shamsi",
    settings: defaultAppSettings,
    selectedEdgeId: null,
    focusedNodeId: null,
    contextMenu: { open: false, x: 0, y: 0, target: null },
    exchangeRate: { usdToToman: null, fetchedAt: null, isLoading: false },

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
          return { nodes, edges };
        });
        return;
      }

      const currency = payload.currency ?? get().settings.defaultCurrency;
      const moneyAmount =
        payload.amount !== undefined
          ? createMoneyAmount(payload.amount, currency, get().exchangeRate.usdToToman)
          : undefined;
      const targetAmount =
        payload.targetAmount !== undefined
          ? createMoneyAmount(payload.targetAmount, currency, get().exchangeRate.usdToToman)
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
                title: payload.type === "goal" ? payload.title || titleByType[payload.type] : titleByType[payload.type],
                itemIds: [item.id],
                category: payload.type === "goal" ? payload.category : undefined,
              },
            },
          ];
        }

        const source = payload.parentNodeId ?? (payload.type === "goal" ? "node-savings" : "node-income");
        if (source !== targetNodeId && !edges.some((e) => e.source === source && e.target === targetNodeId)) {
          edges = [...edges, createEdge(source, targetNodeId)];
        }

        return { items: [...state.items, item], nodes, edges };
      });
    },

    updateItemFromForm: (itemId, payload) => {
      const currency = payload.currency ?? get().settings.defaultCurrency;
      const moneyAmount =
        payload.amount !== undefined
          ? createMoneyAmount(payload.amount, currency, get().exchangeRate.usdToToman)
          : undefined;
      const targetAmount =
        payload.targetAmount !== undefined
          ? createMoneyAmount(payload.targetAmount, currency, get().exchangeRate.usdToToman)
          : undefined;

      set((state) => {
        const existing = state.items.find((i) => i.id === itemId);
        if (!existing) return state;
        const fallbackNodeId = nodeIdByType[payload.type];
        const currentNodeId = state.nodes.find((n) => n.data.itemIds.includes(itemId))?.id;
        const nextParentId = payload.parentNodeId || fallbackNodeId || currentNodeId;

        return {
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
                  updatedAt: new Date().toISOString(),
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
        return { nodes: [...state.nodes, copy], selectedEdgeId: null };
      });
    },

    deleteNode: (nodeId) => {
      if (systemNodeIds.has(nodeId)) return;
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (!node) return state;
        const itemIds = new Set(node.data.itemIds);
        return {
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
        return { settings: nextSettings, calendarSystem: nextSettings.calendarSystem };
      }),

    setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),
    focusNode: (nodeId) => set({ focusedNodeId: nodeId }),

    resetLocalData: () => {
      set((state) => ({
        ...resetUserCreatedData({ items: state.items, nodes: state.nodes, edges: state.edges }),
        selectedEdgeId: null,
      }));
    },

    addEdge: (source, target) => {
      set((state) => ({
        edges: [
          ...state.edges,
          decorateEdge({ id: `edge-${source}-${target}-${Date.now()}`, source, target }),
        ],
        selectedEdgeId: null,
      }));
    },

    deleteEdge: (edgeId) => {
      set((state) => ({
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
        edges: state.edges.map((e) =>
          e.id === edgeId
            ? decorateEdge({ ...e, source, target, sourceHandle: sourceHandle ?? undefined, targetHandle: targetHandle ?? undefined })
            : e
        ),
      }));
      return true;
    },

    openContextMenu: (x, y, target) =>
      set({ contextMenu: { open: true, x, y, target }, selectedEdgeId: null }),
    closeContextMenu: () =>
      set((state) => ({ contextMenu: { ...state.contextMenu, open: false } })),

    fetchExchangeRate: async () => {
      set((state) => ({ exchangeRate: { ...state.exchangeRate, isLoading: true, error: undefined } }));
      try {
        const usdToToman = await fetchUsdToTomanRate();
        set({ exchangeRate: { usdToToman, fetchedAt: new Date().toISOString(), isLoading: false } });
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
    useMoneyMapStore.setState(applyDocument(doc));
  } else {
    useMoneyMapStore.setState({
      items: initialItems,
      nodes: initialNodes,
      edges: initialEdges,
    });
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add store/moneyMapStore.ts
git commit -m "feat: replace zustand/persist with IndexedDB, add initFromDB"
```

---

## Task 6: Supabase Client Singleton

No token injection — Supabase Auth handles sessions internally via cookies/localStorage.

**Files:**
- Create: `lib/supabaseClient.ts`

- [ ] **Step 1: Create `lib/supabaseClient.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabaseClient.ts
git commit -m "feat: add Supabase client singleton"
```

---

## Task 7: Supabase Table and RLS

**Files:** (Supabase schema only)

- [ ] **Step 1: Apply migration via Supabase MCP**

Use `mcp__supabase__apply_migration` with name `create_user_documents` and SQL:

```sql
create table if not exists user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  data_json jsonb not null,
  version bigint default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_documents enable row level security;

create policy "select_own" on user_documents
  for select using (auth.uid() = user_id);

create policy "insert_own" on user_documents
  for insert with check (auth.uid() = user_id);

create policy "update_own" on user_documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on user_documents
  for each row execute function update_updated_at();
```

- [ ] **Step 2: Verify table exists**

Run `mcp__supabase__list_tables` — confirm `user_documents` appears.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "chore: supabase user_documents table with RLS created"
```

---

## Task 8: Auth Store

Small Zustand store that tracks the Supabase session reactively.

**Files:**
- Create: `store/authStore.ts`

- [ ] **Step 1: Create `store/authStore.ts`**

```typescript
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

type AuthStore = {
  user: User | null;
  isLoaded: boolean;
  setUser: (user: User | null) => void;
  setLoaded: () => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoaded: false,
  setUser: (user) => set({ user }),
  setLoaded: () => set({ isLoaded: true }),
}));
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add store/authStore.ts
git commit -m "feat: add auth store for Supabase session"
```

---

## Task 9: Sync Status Store

**Files:**
- Create: `store/syncStore.ts`

- [ ] **Step 1: Create `store/syncStore.ts`**

```typescript
import { create } from "zustand";

export type SyncStatus = "offline" | "local-only" | "syncing" | "synced" | "error";

type SyncStore = {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
};

export const useSyncStore = create<SyncStore>()((set) => ({
  status: "local-only",
  setStatus: (status) => set({ status }),
}));
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add store/syncStore.ts
git commit -m "feat: add sync status store"
```

---

## Task 10: Sync Engine

**Files:**
- Create: `lib/sync/uploadDocument.ts`
- Create: `lib/sync/downloadDocument.ts`
- Create: `lib/sync/mergeDocument.ts`
- Create: `lib/sync/syncEngine.ts`

- [ ] **Step 1: Create `lib/sync/uploadDocument.ts`**

```typescript
import { supabase } from "@/lib/supabaseClient";
import type { UserDocument } from "@/lib/document";

export async function uploadDocument(userId: string, doc: UserDocument): Promise<void> {
  const { error } = await supabase
    .from("user_documents")
    .upsert(
      {
        user_id: userId,
        data_json: doc,
        version: doc.metadata.version,
        updated_at: doc.metadata.updatedAt,
      },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(`Upload failed: ${error.message}`);
}
```

- [ ] **Step 2: Create `lib/sync/downloadDocument.ts`**

```typescript
import { supabase } from "@/lib/supabaseClient";
import type { UserDocument } from "@/lib/document";

export async function downloadDocument(userId: string): Promise<UserDocument | null> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("data_json")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows — first login
    throw new Error(`Download failed: ${error.message}`);
  }

  return data.data_json as UserDocument;
}
```

- [ ] **Step 3: Create `lib/sync/mergeDocument.ts`**

```typescript
import type { UserDocument } from "@/lib/document";

export function mergeDocuments(local: UserDocument, cloud: UserDocument): UserDocument {
  const localTime = new Date(local.metadata.updatedAt).getTime();
  const cloudTime = new Date(cloud.metadata.updatedAt).getTime();
  return cloudTime > localTime ? cloud : local;
}
```

- [ ] **Step 4: Create `lib/sync/syncEngine.ts`**

```typescript
import { saveLocalDocument, loadLocalDocument } from "@/lib/db";
import { extractDocument, applyDocument } from "@/lib/document";
import { uploadDocument } from "@/lib/sync/uploadDocument";
import { downloadDocument } from "@/lib/sync/downloadDocument";
import { mergeDocuments } from "@/lib/sync/mergeDocument";
import { useSyncStore } from "@/store/syncStore";
import { useMoneyMapStore } from "@/store/moneyMapStore";

let dirtyTimer: ReturnType<typeof setTimeout> | null = null;
let activeUserId: string | null = null;

export function configureSyncEngine(userId: string | null): void {
  activeUserId = userId;
}

export function markDirty(): void {
  if (!activeUserId) return;
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
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/sync/
git commit -m "feat: sync engine — upload, download, merge, dirty tracking"
```

---

## Task 11: Auth Components

**Files:**
- Create: `components/auth/AuthModal.tsx`
- Create: `components/auth/AuthButton.tsx`
- Create: `components/auth/UserAvatar.tsx`

- [ ] **Step 1: Create `components/auth/AuthModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "idle" | "loading" | "sent" | "error";

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");

  if (!open) return null;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setStep(error ? "error" : "sent");
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f5ef] hover:text-[#626677]"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>

        <div className="mb-6 text-center">
          <p className="text-[15px] font-semibold text-[#30333b]">Sync across devices</p>
          <p className="mt-1 text-[13px] text-[#a0a3ae]">Sign in to back up your money map.</p>
        </div>

        {step === "sent" ? (
          <div className="text-center">
            <p className="text-[14px] font-medium text-[#4caf7d]">Check your email</p>
            <p className="mt-1 text-[13px] text-[#a0a3ae]">A sign-in link has been sent to {email}.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#ebe7dd] bg-[#fbfaf7] px-4 py-3 text-[14px] text-[#30333b] outline-none placeholder:text-[#c0c2cb] focus:border-[#b0b2bb]"
                required
              />
              <button
                type="submit"
                disabled={step === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#30333b] py-3 text-[14px] font-semibold text-white transition hover:bg-[#404350] disabled:opacity-60"
              >
                {step === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Continue with Email
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ebe7dd]" />
              <span className="text-[12px] text-[#c0c2cb]">or</span>
              <div className="h-px flex-1 bg-[#ebe7dd]" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ebe7dd] bg-white py-3 text-[14px] font-semibold text-[#30333b] transition hover:bg-[#fbfaf7]"
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {step === "error" && (
              <p className="mt-3 text-center text-[13px] text-[#c64141]">
                Something went wrong. Try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/auth/UserAvatar.tsx`**

```tsx
"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { configureSyncEngine } from "@/lib/sync/syncEngine";
import { useSyncStore } from "@/store/syncStore";

export function UserAvatar() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initial = (user.email ?? "?")[0].toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    configureSyncEngine(null);
    useSyncStore.getState().setStatus("local-only");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-full bg-[#30333b] text-[12px] font-bold text-white transition hover:bg-[#404350]"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 min-w-[180px] rounded-2xl bg-white p-2 shadow-lg ring-1 ring-[#ebe7dd]">
            <p className="truncate px-3 py-1 text-[12px] text-[#a0a3ae]">{user.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-[#c64141] transition hover:bg-[#fff1f1]"
            >
              <LogOut className="size-3.5" strokeWidth={2.2} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/auth/AuthButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserAvatar } from "@/components/auth/UserAvatar";

export function AuthButton() {
  const { user, isLoaded } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  if (!isLoaded) return null;

  if (user) return <UserAvatar />;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-[#a0a3ae] transition hover:bg-[#f7f5ef] hover:text-[#626677]"
        title="Sign in to sync across devices"
      >
        <Cloud className="size-3.5" strokeWidth={2.1} />
        Sync
      </button>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/auth/
git commit -m "feat: auth components — AuthModal, AuthButton, UserAvatar"
```

---

## Task 12: Sync Status Indicator

**Files:**
- Create: `components/navigation/SyncStatus.tsx`

- [ ] **Step 1: Create `components/navigation/SyncStatus.tsx`**

```tsx
"use client";

import { useSyncStore } from "@/store/syncStore";

const labels: Record<string, string> = {
  offline: "Offline",
  "local-only": "Local only",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync failed",
};

const dotClass: Record<string, string> = {
  offline: "bg-[#c8c9cc]",
  "local-only": "bg-[#c8c9cc]",
  syncing: "bg-[#f5a623] animate-pulse",
  synced: "bg-[#4caf7d]",
  error: "bg-[#c64141]",
};

export function SyncStatus() {
  const status = useSyncStore((state) => state.status);

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#a0a3ae]">
      <span className={`size-1.5 rounded-full ${dotClass[status]}`} />
      {labels[status]}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/navigation/SyncStatus.tsx
git commit -m "feat: SyncStatus indicator component"
```

---

## Task 13: Wire TopBrandBar

**Files:**
- Modify: `components/navigation/TopBrandBar.tsx`

- [ ] **Step 1: Replace `TopBrandBar.tsx`**

```tsx
"use client";

import Image from "next/image";
import { AuthButton } from "@/components/auth/AuthButton";
import { SyncStatus } from "@/components/navigation/SyncStatus";

export function TopBrandBar() {
  return (
    <div className="fixed left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-4 py-2 shadow-dock">
      <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#f7f5ef]">
        <Image src="/logo.svg" alt="" width={22} height={22} className="size-[22px]" aria-hidden="true" />
      </span>
      <span className="text-[17px] font-bold leading-none tracking-[0] text-[#30333b]">Trace my money</span>
      <SyncStatus />
      <AuthButton />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/navigation/TopBrandBar.tsx
git commit -m "feat: add AuthButton and SyncStatus to TopBrandBar"
```

---

## Task 14: Wire Everything in `MoneyMapApp.tsx`

This is the central orchestration: IndexedDB init, subscribe → save, Supabase auth listener, sync triggers.

**Files:**
- Modify: `components/MoneyMapApp.tsx`

- [ ] **Step 1: Read the current full `MoneyMapApp.tsx` to get the exact JSX**

Before replacing, read the file and note the exact props passed to `AddTypeMenu`, `QuickAddModal`, `NodeContextMenu`, `ItemContextMenu`. The replacement below must match those prop signatures exactly.

- [ ] **Step 2: Replace `MoneyMapApp.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AddTypeMenu } from "@/components/quick-add/AddTypeMenu";
import { AnalyticsModal } from "@/components/analytics/AnalyticsModal";
import { ItemContextMenu } from "@/components/context-menu/ItemContextMenu";
import { NodeContextMenu } from "@/components/context-menu/NodeContextMenu";
import { QuickAddModal } from "@/components/quick-add/QuickAddModal";
import { MoneyCanvas } from "@/components/canvas/MoneyCanvas";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TopBrandBar } from "@/components/navigation/TopBrandBar";
import { SearchPopover } from "@/components/search/SearchPopover";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useMoneyMapStore, initFromDB } from "@/store/moneyMapStore";
import { useAuthStore } from "@/store/authStore";
import { useSyncStore } from "@/store/syncStore";
import { supabase } from "@/lib/supabaseClient";
import { saveLocalDocument } from "@/lib/db";
import { extractDocument } from "@/lib/document";
import { markDirty, syncOnLogin, configureSyncEngine, registerOnlineListener } from "@/lib/sync/syncEngine";
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

  const fetchExchangeRate = useMoneyMapStore((state) => state.fetchExchangeRate);
  const nodes = useMoneyMapStore((state) => state.nodes);
  const contextMenu = useMoneyMapStore((state) => state.contextMenu);
  const closeContextMenu = useMoneyMapStore((state) => state.closeContextMenu);
  const { setUser, setLoaded } = useAuthStore();
  const setStatus = useSyncStore((state) => state.setStatus);

  // 1. Load from IndexedDB immediately on mount
  useEffect(() => {
    void initFromDB().then(() => {
      setStatus(navigator.onLine ? "local-only" : "offline");
    });
  }, [setStatus]);

  // 2. Subscribe store changes → save to IndexedDB + mark dirty
  useEffect(() => {
    const unsubscribe = useMoneyMapStore.subscribe(async (state) => {
      const doc = extractDocument(state);
      await saveLocalDocument(doc);
      markDirty();
    });
    return unsubscribe;
  }, []);

  // 3. Register online/focus listeners
  useEffect(() => {
    return registerOnlineListener();
  }, []);

  // 4. Reflect network offline status
  useEffect(() => {
    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      if (useAuthStore.getState().user) return; // sync engine handles it
      setStatus("local-only");
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [setStatus]);

  // 5. Supabase auth listener — handles session restore + login events
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoaded();
      if (session?.user) {
        void syncOnLogin(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session?.user) {
        void syncOnLogin(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        configureSyncEngine(null);
        setStatus("local-only");
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoaded, setStatus]);

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
        onSelect={(type) => {
          setModalType(type);
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
      />
      {modalType && (
        <QuickAddModal
          type={modalType}
          editItemId={editItemId}
          nodes={nodes}
          onClose={() => {
            setModalType(null);
            setEditItemId(null);
          }}
          onEdit={(itemId, type) => {
            setEditItemId(itemId);
            setModalType(type);
          }}
        />
      )}
      <AnalyticsModal open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SearchPopover
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onEdit={(itemId, type) => {
          setSearchOpen(false);
          setEditItemId(itemId);
          setModalType(type);
        }}
      />
      {contextMenu.open && contextMenu.target?.type === "node" && (
        <NodeContextMenu
          nodeId={contextMenu.target.nodeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
      {contextMenu.open && contextMenu.target?.type === "item" && (
        <ItemContextMenu
          nodeId={contextMenu.target.nodeId}
          itemId={contextMenu.target.itemId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onEdit={(itemId, type) => {
            closeContextMenu();
            setEditItemId(itemId);
            setModalType(type);
          }}
        />
      )}
      <BottomNav
        onAddClick={handleAddClick}
        onAnalyticsClick={() => setAnalyticsOpen((o) => !o)}
        onSettingsClick={() => setSettingsOpen((o) => !o)}
        onSearchClick={() => setSearchOpen((o) => !o)}
        analyticsOpen={analyticsOpen}
        addButtonRef={addButtonRef}
      />
    </main>
  );
}
```

> **Critical:** The `NodeContextMenu`, `ItemContextMenu`, `AddTypeMenu`, `QuickAddModal`, `SearchPopover` props above must match what those component files actually accept. Read each file before committing. If a component doesn't accept an `onEdit` prop, remove it here (don't modify the child component).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Fix any prop mismatches by checking the actual component signatures. Do not change the child component APIs — only adjust the JSX in `MoneyMapApp.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/MoneyMapApp.tsx
git commit -m "feat: wire IndexedDB, Supabase auth, sync engine in MoneyMapApp"
```

---

## Task 15: Smoke Test — Full Flow Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify offline-first**
  - Open `http://localhost:3000`
  - Add a node — canvas updates instantly
  - Hard reload — data persists (from IndexedDB)
  - TopBrandBar shows "Local only" dot and "Sync" button

- [ ] **Step 3: Verify magic link auth**
  - Click "Sync" button → AuthModal opens
  - Enter a real email → "Check your email" confirmation appears
  - Click the link in the email → redirected to app, session restores
  - UserAvatar (initial letter) appears in TopBrandBar
  - SyncStatus updates to "Synced"

- [ ] **Step 4: Verify Supabase row**
  - In Supabase Dashboard → Table Editor → `user_documents`
  - Confirm a row exists for your user_id

- [ ] **Step 5: Verify session persistence**
  - Close and reopen the tab
  - User stays signed in (no re-auth required)
  - SyncStatus updates to "Synced" after session restore

- [ ] **Step 6: Verify offline behavior**
  - DevTools → Network → Offline
  - Add a node — works, SyncStatus shows "Offline"
  - Reconnect → SyncStatus changes to "Syncing…" → "Synced"

- [ ] **Step 7: Verify cross-device restore**
  - Open in a different browser (or incognito), sign in with the same email
  - After magic link: canvas state matches what was synced

- [ ] **Step 8: Final build**

```bash
npm run typecheck && npm run build
```

Expected: no type errors, build succeeds.

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: complete offline-first Supabase Auth sync architecture"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|-------------|------|
| Clerk fully removed | Task 1 |
| Supabase Auth — magic link | Task 11 (AuthModal) |
| Supabase Auth — Google | Task 11 (AuthModal) |
| Session persists after refresh | Task 6 (`persistSession: true`) + Task 14 (`getSession`) |
| App works fully offline | Task 14 (initFromDB first, no network block) |
| IndexedDB restores instantly | Task 4, 5, 14 |
| No blocking on Supabase writes | Task 14 (async subscribe, never awaited in render) |
| `user_documents` table, `user_id uuid` | Task 7 |
| RLS with `auth.uid()` | Task 7 |
| Debounced upload 3s | Task 10 (`markDirty` + `setTimeout 3000`) |
| Upload on online/focus | Task 10 (`registerOnlineListener`) |
| Upload on sign-in | Task 10 (`syncOnLogin`) |
| Download + merge on login | Task 10 (`syncOnLogin` downloads + merges) |
| Latest-wins conflict resolution | Task 10 (`mergeDocuments`) |
| Sync status indicator | Tasks 9, 12, 13 |
| Auth modal (not full page) | Task 11 |
| Unauthenticated local usage | Task 14 (initFromDB runs regardless of auth) |
| Existing UI unchanged | All tasks preserve component APIs |

### Placeholder scan

None. All code blocks are complete.

### Type consistency

- `UserDocument` defined in Task 3 — used in Tasks 4, 5, 10, 14
- `DocumentSlice` matches the Zustand store fields in Task 5 (items, nodes, edges, settings, selectedMonth, calendarSystem, exchangeRate)
- `applyDocument` returns `Partial<DocumentSlice>` — compatible with `setState` in Task 5
- `decorateEdge` from `lib/edges.ts` — used in store (Task 5) and `applyDocument` (Task 3)
- `defaultAppSettings` exported from store (Task 5), imported in `lib/document.ts` (Task 3)
- `configureSyncEngine(null)` called on sign-out — matches signature `(userId: string | null)`
- `useAuthStore` shape: `{ user, isLoaded, setUser, setLoaded }` — used consistently in Tasks 8, 11, 14
