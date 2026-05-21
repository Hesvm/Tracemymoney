"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
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
  const showCanvasDots = useMoneyMapStore((state) => state.settings.showCanvasDots);
  const focusedNodeId = useMoneyMapStore((state) => state.focusedNodeId);
  const focusNode = useMoneyMapStore((state) => state.focusNode);
  const rfStore = useStoreApi();
  const reactFlow = useReactFlow();

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
      const moved = reconnectEdge(oldEdge.id, newConnection);
      if (moved) setSelectedEdgeId(null);
    },
    [reconnectEdge, setSelectedEdgeId]
  );

  const handleReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, oldEdge: Edge) => {
      if (!reconnectSuccessful.current) {
        reconnectEdge(oldEdge.id, {
          source: oldEdge.source,
          target: oldEdge.target,
          sourceHandle: oldEdge.sourceHandle ?? null,
          targetHandle: oldEdge.targetHandle ?? null
        });
      }
      reconnectSuccessful.current = false;
    },
    [reconnectEdge]
  );

  const edgesWithSelection = edges.map((edge) => ({
    ...edge,
    selected: edge.id === selectedEdgeId
  }));

  useEffect(() => {
    if (!focusedNodeId) return;
    const node = nodes.find((candidate) => candidate.id === focusedNodeId);
    if (!node) return;

    void reactFlow.setCenter(node.position.x + 165, node.position.y + 120, {
      zoom: 1.05,
      duration: 420
    });

    const timeout = window.setTimeout(() => focusNode(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [focusNode, focusedNodeId, nodes, reactFlow]);

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
