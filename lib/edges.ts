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

export function createEdge(
  source: string,
  target: string,
  sourceHandle = "right-source",
  targetHandle = "left-target"
): MoneyFlowEdge {
  return decorateEdge({
    id: `edge-${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
  });
}
