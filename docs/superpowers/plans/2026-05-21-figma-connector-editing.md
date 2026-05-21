# Figma-Like Connector Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable in-place connector endpoint dragging so users can reconnect edges without deleting and recreating them, using a Figma-like visual feel.

**Architecture:** `@xyflow/react` v12.5.5 provides `onReconnect` / `onReconnectStart` / `onReconnectEnd` callbacks and `edgesReconnectable` prop that handle all drag mechanics internally. We add a `reconnectEdge` action to the Zustand store (keeps same edge ID, validates no self/duplicate), wire the three callbacks in `CanvasInner`, and render decorative endpoint-handle dots inside the custom `MoneyEdge` component via `EdgeLabelRenderer`.

**Tech Stack:** `@xyflow/react` v12.5.5, React 19, Zustand v5, Next.js, TypeScript, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `store/moneyMapStore.ts` | Add `reconnectEdge` to store type + implementation |
| `components/canvas/MoneyEdge.tsx` | Add endpoint handle dots when selected |
| `components/canvas/MoneyCanvas.tsx` | Wire `edgesReconnectable`, `onReconnect*` callbacks |

---

## Task 1: Add `reconnectEdge` to the Zustand store

**Files:**
- Modify: `store/moneyMapStore.ts`

- [ ] **Step 1: Add `Connection` import from `@xyflow/react`**

At the top of `store/moneyMapStore.ts`, add `Connection` to the existing import:

```typescript
import { applyEdgeChanges, applyNodeChanges, MarkerType, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
```

- [ ] **Step 2: Add `reconnectEdge` to `MoneyMapStore` type**

Inside the `type MoneyMapStore = { ... }` block (after `deleteEdge` line):

```typescript
  reconnectEdge: (edgeId: string, newConnection: Connection) => void;
```

- [ ] **Step 3: Implement `reconnectEdge` in the store**

Inside the `create()(persist((set, get) => ({ ... })))` object, after the `deleteEdge` implementation:

```typescript
      reconnectEdge: (edgeId, newConnection) => {
        const { source, target, sourceHandle, targetHandle } = newConnection;
        if (!source || !target) return;
        if (source === target) return;

        set((state) => {
          const isDuplicate = state.edges.some(
            (edge) => edge.id !== edgeId && edge.source === source && edge.target === target
          );
          if (isDuplicate) return state;

          return {
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
          };
        });
      },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `reconnectEdge` or `Connection`.

- [ ] **Step 5: Commit**

```bash
git add store/moneyMapStore.ts
git commit -m "feat: add reconnectEdge action to Zustand store"
```

---

## Task 2: Add endpoint handle dots to MoneyEdge

**Files:**
- Modify: `components/canvas/MoneyEdge.tsx`

The goal is to render two circular dots at `(sourceX, sourceY)` and `(targetX, targetY)` when the edge is selected. These are visual-only (`pointerEvents: "none"`) — React Flow's internal reconnection hit areas handle the actual drag. The delete button moves into the same `selected` block.

- [ ] **Step 1: Replace `MoneyEdge.tsx` with the updated component**

The full file:

```tsx
"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { useMoneyMapStore } from "@/store/moneyMapStore";

export function MoneyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.36
  });

  const deleteEdge = useMoneyMapStore((state) => state.deleteEdge);

  const stroke = selected ? "#8b8b91" : "#b9babd";
  const strokeWidth = selected ? 2.4 : 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          stroke,
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "none",
          transition: "stroke 160ms ease, stroke-width 160ms ease",
          ...style
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          {/* Source endpoint dot — visual only, pointerEvents none so RF drag works */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY}px)`,
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #8b5cf6",
                boxShadow: "0 0 0 3px rgba(139,92,246,0.15), 0 1px 4px rgba(0,0,0,0.10)"
              }}
            />
          </div>
          {/* Target endpoint dot */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX}px,${targetY}px)`,
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#8b5cf6",
                border: "2px solid #6d28d9",
                boxShadow: "0 0 0 3px rgba(139,92,246,0.15), 0 1px 4px rgba(0,0,0,0.10)"
              }}
            />
          </div>
          {/* Delete button at midpoint */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all"
            }}
          >
            <button
              onClick={() => deleteEdge(id)}
              className="grid size-6 place-items-center rounded-full bg-white text-[#d9344f] shadow-soft transition hover:bg-[#fef0f3] active:scale-95"
              aria-label="Delete connection"
              title="Delete this connection"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/canvas/MoneyEdge.tsx
git commit -m "feat: add endpoint handle dots to MoneyEdge when selected"
```

---

## Task 3: Wire reconnection callbacks in MoneyCanvas

**Files:**
- Modify: `components/canvas/MoneyCanvas.tsx`

`@xyflow/react` v12 provides `edgesReconnectable`, `onReconnect`, `onReconnectStart`, and `onReconnectEnd`. We use a ref to track whether the current drag ended in a successful reconnect, so failed drops (on empty canvas) leave the original edge intact.

- [ ] **Step 1: Replace `MoneyCanvas.tsx` with the updated component**

The full file:

```tsx
"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useStoreApi,
  useViewport,
  type Connection,
  type Edge
} from "@xyflow/react";
import { MoneyEdge } from "@/components/canvas/MoneyEdge";
import { MoneyNode } from "@/components/canvas/MoneyNode";
import { useMoneyMapStore } from "@/store/moneyMapStore";

const nodeTypes = {
  moneyNode: MoneyNode
};

const edgeTypes = {
  moneyEdge: MoneyEdge
};

function CanvasDots() {
  const { x, y, zoom } = useViewport();
  const scaledGap = 24 * zoom;
  const visualGap = Math.max(12, Math.min(48, scaledGap));
  const visualDotSize = Math.max(0.85, Math.min(2.2, 1.35 * zoom));
  const offsetX = ((x % visualGap) + visualGap) % visualGap;
  const offsetY = ((y % visualGap) + visualGap) % visualGap;

  return (
    <div
      className="money-map-dots pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.13) ${visualDotSize}px, transparent ${visualDotSize + 0.2}px)`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        backgroundSize: `${visualGap}px ${visualGap}px`
      }}
    />
  );
}

function CanvasInner() {
  const nodes = useMoneyMapStore((state) => state.nodes);
  const edges = useMoneyMapStore((state) => state.edges);
  const onNodesChange = useMoneyMapStore((state) => state.onNodesChange);
  const onEdgesChange = useMoneyMapStore((state) => state.onEdgesChange);
  const addEdge = useMoneyMapStore((state) => state.addEdge);
  const reconnectEdge = useMoneyMapStore((state) => state.reconnectEdge);
  const setSelectedEdgeId = useMoneyMapStore((state) => state.setSelectedEdgeId);
  const selectedEdgeId = useMoneyMapStore((state) => state.selectedEdgeId);
  const rfStore = useStoreApi();

  const defaultViewport = useMemo(() => ({ x: 260, y: 145, zoom: 0.88 }), []);
  const reconnectSuccessful = useRef(false);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const isDuplicate = edges.some(
        (edge) => edge.source === connection.source && edge.target === connection.target
      );
      if (isDuplicate) return;

      addEdge(connection.source, connection.target);
    },
    [edges, addEdge]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id === selectedEdgeId ? null : edge.id);
    },
    [selectedEdgeId, setSelectedEdgeId]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedEdgeId) {
        event.preventDefault();
        useMoneyMapStore.getState().deleteEdge(selectedEdgeId);
      }
    },
    [selectedEdgeId]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleReconnectStart = useCallback(() => {
    reconnectSuccessful.current = false;
  }, []);

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      reconnectSuccessful.current = true;
      reconnectEdge(oldEdge.id, newConnection);
      setSelectedEdgeId(null);
    },
    [reconnectEdge, setSelectedEdgeId]
  );

  const handleReconnectEnd = useCallback(() => {
    // If reconnect never succeeded, the original edge is already unchanged in
    // Zustand — nothing to do. Reset flag for next drag.
    reconnectSuccessful.current = false;
  }, []);

  const edgesWithSelection = edges.map((edge) => ({
    ...edge,
    selected: edge.id === selectedEdgeId
  }));

  return (
    <ReactFlow
      className="money-canvas"
      nodes={nodes}
      edges={edgesWithSelection}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onEdgeClick={handleEdgeClick}
      edgesReconnectable
      onReconnectStart={handleReconnectStart}
      onReconnect={handleReconnect}
      onReconnectEnd={handleReconnectEnd}
      reconnectRadius={20}
      defaultViewport={defaultViewport}
      minZoom={0.15}
      maxZoom={3.5}
      panOnDrag
      zoomOnPinch
      zoomOnScroll
      nodesDraggable
      proOptions={{ hideAttribution: true }}
      fitView={false}
      onInit={() => {
        const { setMinZoom } = rfStore.getState();
        setMinZoom(0.15);
      }}
    >
      <CanvasDots />
    </ReactFlow>
  );
}

export function MoneyCanvas() {
  return (
    <div className="absolute inset-0">
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/canvas/MoneyCanvas.tsx
git commit -m "feat: wire edgesReconnectable and onReconnect callbacks in MoneyCanvas"
```

---

## Task 4: Smoke-test checklist

Run the dev server and manually verify all acceptance criteria.

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npm run dev
```

Go to `http://localhost:3000` and run through each check:

- [ ] Click a connector → edge becomes selected, stroke darkens slightly
- [ ] Two endpoint dots appear (white with purple ring at source, solid purple at target)
- [ ] Delete button appears at midpoint
- [ ] Drag the target endpoint dot to a different node → connector reconnects, endpoint dots follow
- [ ] Drag the source endpoint dot to a different node → connector reconnects
- [ ] Reconnected edge persists after page refresh (localStorage)
- [ ] Drag endpoint and drop on empty canvas → original connector stays, nothing deleted
- [ ] Try to reconnect to the same node the edge already starts from → blocked (self-connection)
- [ ] Create a second edge between two nodes, then try to reconnect a different edge to the same pair → duplicate blocked
- [ ] Delete/Backspace on selected edge still deletes it
- [ ] Midpoint X button still deletes the edge
- [ ] Dragging a node while connected updates edge path smoothly
- [ ] Pan and zoom while edge is selected → endpoint dots stay aligned
- [ ] Draw a new connector from a node handle → still works, custom curve preserved
- [ ] No React Flow default blue handles or thick blue reconnection UI visible

- [ ] **Final commit if no issues**

```bash
git add -A
git commit -m "chore: verify figma-like connector editing implementation"
```
