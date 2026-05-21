import type { MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";
import { MarkerType } from "@xyflow/react";

const createdAt = "2026-05-20T08:00:00.000Z";

export const initialItems: MoneyItem[] = [
  {
    id: "item-income-salary",
    title: "Salary",
    type: "income",
    amount: { amount: 60000000, currency: "TOMAN", convertedAmount: 300, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: "2026-05-20",
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `item-income-${index + 2}`,
    title: "",
    type: "income" as const,
    amount: { amount: 60000000, currency: "TOMAN" as const, convertedAmount: 300, convertedCurrency: "USD" as const, exchangeRateSnapshot: 200000 },
    date: "2026-05-20",
    recurrence: "none" as const,
    createdAt,
    updatedAt: createdAt
  })),
  {
    id: "item-expense-rent",
    title: "Rent",
    type: "expense",
    amount: { amount: 24000000, currency: "TOMAN", convertedAmount: 120, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: "2026-05-20",
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-expense-2",
    title: "",
    type: "expense",
    amount: { amount: 60000000, currency: "TOMAN", convertedAmount: 300, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: "2026-05-20",
    recurrence: "none",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-saving-cash",
    title: "Cash",
    type: "savings",
    amount: { amount: 300, currency: "USD", convertedAmount: 60000000, convertedCurrency: "TOMAN", exchangeRateSnapshot: 200000 },
    date: "2026-05-20",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-saving-usdt",
    title: "USDT on wallex",
    type: "savings",
    amount: { amount: 100, currency: "USD", convertedAmount: 20000000, convertedCurrency: "TOMAN", exchangeRateSnapshot: 200000 },
    date: "2026-05-20",
    createdAt,
    updatedAt: createdAt
  }
];

export const initialNodes: MoneyFlowNode[] = [
  {
    id: "node-income",
    type: "moneyNode",
    position: { x: 40, y: 110 },
    data: {
      type: "income",
      title: "Income",
      itemIds: ["item-income-salary", "item-income-2", "item-income-3", "item-income-4", "item-income-5"]
    }
  },
  {
    id: "node-expense",
    type: "moneyNode",
    position: { x: 540, y: 0 },
    data: {
      type: "expense",
      title: "Expenses",
      itemIds: ["item-expense-rent", "item-expense-2"]
    }
  },
  {
    id: "node-savings",
    type: "moneyNode",
    position: { x: 545, y: 310 },
    data: {
      type: "savings",
      title: "Savings",
      itemIds: ["item-saving-cash", "item-saving-usdt"]
    }
  }
];

export const initialEdges: MoneyFlowEdge[] = [
  {
    id: "edge-income-expense",
    source: "node-income",
    target: "node-expense",
    type: "moneyEdge",
    animated: false,
    style: { stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  },
  {
    id: "edge-income-savings",
    source: "node-income",
    target: "node-savings",
    type: "moneyEdge",
    animated: false,
    style: { stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  }
];
