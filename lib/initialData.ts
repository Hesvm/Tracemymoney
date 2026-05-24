import type { MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";
import { MarkerType } from "@xyflow/react";

export const initialItems: MoneyItem[] = [];

export const initialNodes: MoneyFlowNode[] = [
  {
    id: "node-income",
    type: "moneyNode",
    position: { x: 40, y: 110 },
    data: {
      type: "income",
      title: "Income",
      itemIds: []
    }
  },
  {
    id: "node-expense",
    type: "moneyNode",
    position: { x: 540, y: 0 },
    data: {
      type: "expense",
      title: "Expenses",
      itemIds: []
    }
  },
  {
    id: "node-savings",
    type: "moneyNode",
    position: { x: 545, y: 310 },
    data: {
      type: "savings",
      title: "Savings",
      itemIds: []
    }
  }
];

export const initialEdges: MoneyFlowEdge[] = [
  {
    id: "edge-income-expense",
    source: "node-income",
    sourceHandle: "right-source",
    target: "node-expense",
    targetHandle: "left-target",
    type: "moneyEdge",
    animated: false,
    style: { stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  },
  {
    id: "edge-income-savings",
    source: "node-income",
    sourceHandle: "right-source",
    target: "node-savings",
    targetHandle: "left-target",
    type: "moneyEdge",
    animated: false,
    style: { stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  }
];
