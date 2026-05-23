import type { MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";
import { MarkerType } from "@xyflow/react";

function currentMonthDate(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(Math.min(day, 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const createdAt = new Date().toISOString();
const d1 = currentMonthDate(1);
const d5 = currentMonthDate(5);

export const initialItems: MoneyItem[] = [
  // Income
  {
    id: "item-income-salary",
    title: "Salary",
    type: "income",
    amount: { amount: 130000000, currency: "TOMAN" },
    date: d1,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-income-ads",
    title: "X Ads",
    type: "income",
    amount: { amount: 200, currency: "USD" },
    date: d5,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  // Expense
  {
    id: "item-expense-rent",
    title: "Rent",
    type: "expense",
    amount: { amount: 40000000, currency: "TOMAN" },
    date: d1,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-expense-daily",
    title: "Daily Fund",
    type: "expense",
    amount: { amount: 300, currency: "USD" },
    date: d1,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  // Savings / investments
  {
    id: "item-saving-gold",
    title: "Gold 5 gram",
    type: "savings",
    amount: { amount: 97000000, currency: "TOMAN" },
    date: d1,
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-saving-usdt",
    title: "Wallex USDT",
    type: "savings",
    amount: { amount: 500, currency: "USD" },
    date: d1,
    createdAt,
    updatedAt: createdAt
  },
  // Goal
  {
    id: "item-goal-phone",
    title: "New Phone",
    type: "goal",
    targetAmount: { amount: 1000, currency: "USD" },
    date: d1,
    category: "phone",
    recurrence: "none",
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
      itemIds: ["item-income-salary", "item-income-ads"]
    }
  },
  {
    id: "node-expense",
    type: "moneyNode",
    position: { x: 540, y: 0 },
    data: {
      type: "expense",
      title: "Expenses",
      itemIds: ["item-expense-rent", "item-expense-daily"]
    }
  },
  {
    id: "node-savings",
    type: "moneyNode",
    position: { x: 545, y: 310 },
    data: {
      type: "savings",
      title: "Investments",
      itemIds: ["item-saving-gold", "item-saving-usdt"]
    }
  },
  {
    id: "node-goals",
    type: "moneyNode",
    position: { x: 545, y: 530 },
    data: {
      type: "goal",
      title: "Goals",
      itemIds: ["item-goal-phone"]
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
  },
  {
    id: "edge-income-goals",
    source: "node-income",
    target: "node-goals",
    type: "moneyEdge",
    animated: false,
    style: { stroke: "#b9babd", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#b9babd" }
  }
];
