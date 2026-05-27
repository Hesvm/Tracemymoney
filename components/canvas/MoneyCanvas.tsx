"use client";

import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
  useViewport,
  type Connection,
  type Edge,
  type Node
} from "@xyflow/react";
import { MoneyEdge } from "@/components/canvas/MoneyEdge";
import { MoneyNode } from "@/components/canvas/MoneyNode";
import { decorateEdge } from "@/lib/edges";
import { useMoneyMapStore } from "@/store/moneyMapStore";
import { useMobile } from "@/hooks/useMobile";

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
  const setSelectedEdgeId = useMoneyMapStore((state) => state.setSelectedEdgeId);
  const selectedEdgeId = useMoneyMapStore((state) => state.selectedEdgeId);
  const showCanvasDots = useMoneyMapStore((state) => state.settings.showCanvasDots);
  const focusedNodeId = useMoneyMapStore((state) => state.focusedNodeId);
  const focusNode = useMoneyMapStore((state) => state.focusNode);
  const openContextMenu = useMoneyMapStore((state) => state.openContextMenu);
  const rfStore = useStoreApi();
  const reactFlow = useReactFlow();
  const isMobile = useMobile();
  const didFitMobile = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const defaultViewport = useMemo(() => ({ x: 260, y: 145, zoom: 0.88 }), []);
  const reconnectSuccessful = useRef(false);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return; // prevent self-connections

      // check for duplicate edges
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
      if (!newConnection.source || !newConnection.target) return;
      if (newConnection.source === newConnection.target) return;

      // ReactFlow fires onEdgesChange(remove) when the drag starts, so by the
      // time onReconnect fires the edge may already be gone from the store.
      // We handle both: update in-place if still present, or re-add if missing.
      useMoneyMapStore.setState((state) => {
        const hasDuplicate = state.edges.some(
          (e) =>
            e.id !== oldEdge.id &&
            e.source === newConnection.source &&
            e.target === newConnection.target
        );
        if (hasDuplicate) return state;

        const reconnected = decorateEdge({
          ...oldEdge,
          source: newConnection.source!,
          target: newConnection.target!,
          sourceHandle: newConnection.sourceHandle ?? undefined,
          targetHandle: newConnection.targetHandle ?? undefined,
        });

        const edgeIndex = state.edges.findIndex((e) => e.id === oldEdge.id);
        const edges =
          edgeIndex >= 0
            ? state.edges.map((e) => (e.id === oldEdge.id ? reconnected : e))
            : [...state.edges, reconnected];

        return { lastModifiedAt: new Date().toISOString(), edges };
      });

      setSelectedEdgeId(null);
    },
    [setSelectedEdgeId]
  );

  const handleReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, oldEdge: Edge) => {
      if (!reconnectSuccessful.current) {
        // Reconnect was cancelled — restore the original edge that ReactFlow
        // removed via onEdgesChange when the drag started.
        useMoneyMapStore.setState((state) => {
          if (state.edges.some((e) => e.id === oldEdge.id)) return state;
          return { edges: [...state.edges, decorateEdge(oldEdge)] };
        });
      }
      reconnectSuccessful.current = false;
    },
    []
  );

  const handleConnectStart = useCallback(() => {
    setIsConnecting(true);
  }, []);

  const handleConnectEnd = useCallback(() => {
    setIsConnecting(false);
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (isMobile) return; // handled by useLongPress in MoneyNode
      openContextMenu(event.clientX, event.clientY, { type: "node", nodeId: node.id });
    },
    [openContextMenu, isMobile]
  );

  const handlePaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
  }, []);

  const edgesWithSelection = edges.map((edge) => ({
    ...edge,
    selected: edge.id === selectedEdgeId
  }));

  useEffect(() => {
    if (isMobile && !didFitMobile.current) {
      didFitMobile.current = true;
      const timer = setTimeout(() => {
        // Read nodes directly from Zustand at fire-time to avoid stale-closure
        // issues and dep-array race conditions that cancel this timer early.
        const currentNodes = useMoneyMapStore.getState().nodes;
        const targetZoom = 1.1;
        const incomeNode = currentNodes.find((n) => n.id === "node-income");
        if (incomeNode) {
          // Mobile node width = 200px, so center x offset = 100.
          // Nudge y up by 30px to compensate for larger bottom nav vs top bar.
          const nodeCx = incomeNode.position.x + 100;
          const nodeCy = incomeNode.position.y + 100;
          const vpW = window.innerWidth;
          const vpH = window.innerHeight;
          reactFlow.setViewport({
            x: vpW / 2 - nodeCx * targetZoom,
            y: vpH / 2 - nodeCy * targetZoom - 30,
            zoom: targetZoom,
          }, { duration: 0 });
        } else {
          // Fallback: fitView then boost zoom
          reactFlow.fitView({ padding: 0.04, duration: 0 });
          window.requestAnimationFrame(() => {
            const { x, y, zoom } = reactFlow.getViewport();
            const vpW = window.innerWidth;
            const vpH = window.innerHeight;
            const cx = (vpW / 2 - x) / zoom;
            const cy = (vpH / 2 - y) / zoom;
            reactFlow.setViewport({
              x: vpW / 2 - cx * targetZoom,
              y: vpH / 2 - cy * targetZoom - 30,
              zoom: targetZoom,
            }, { duration: 0 });
          });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isMobile, reactFlow]);

  useEffect(() => {
    if (!focusedNodeId) return;
    const node = nodes.find((candidate) => candidate.id === focusedNodeId);
    if (!node) return;

    void reactFlow.setCenter(node.position.x + 130, node.position.y + 100, {
      zoom: 1.05,
      duration: 420
    });

    const timeout = window.setTimeout(() => focusNode(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [focusNode, focusedNodeId, nodes, reactFlow]);

  return (
    <ReactFlow
      className={`money-canvas${isConnecting ? " is-connecting" : ""}`}
      nodes={nodes}
      edges={edgesWithSelection}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onConnectStart={handleConnectStart}
      onConnectEnd={handleConnectEnd}
      onEdgeClick={handleEdgeClick}
      edgesReconnectable
      onReconnectStart={handleReconnectStart}
      onReconnect={handleReconnect}
      onReconnectEnd={handleReconnectEnd}
      reconnectRadius={isMobile ? 36 : 20}
      connectionRadius={isMobile ? 36 : 20}
      onNodeContextMenu={handleNodeContextMenu}
      onPaneContextMenu={handlePaneContextMenu}
      defaultViewport={defaultViewport}
      minZoom={isMobile ? 0.25 : 0.15}
      maxZoom={isMobile ? 2.5 : 3.5}
      panOnDrag={!isConnecting}
      zoomOnPinch
      zoomOnScroll={!isMobile}
      nodesDraggable
      proOptions={{ hideAttribution: true }}
      fitView={false}
      onInit={() => {
        const { setMinZoom } = rfStore.getState();
        setMinZoom(isMobile ? 0.25 : 0.15);
      }}
    >
      {showCanvasDots && <CanvasDots />}
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
