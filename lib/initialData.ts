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
const d10 = currentMonthDate(10);
const d15 = currentMonthDate(15);

export const initialItems: MoneyItem[] = [
  {
    id: "item-income-salary",
    title: "Salary",
    type: "income",
    amount: { amount: 60000000, currency: "TOMAN", convertedAmount: 300, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d1,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-income-freelance",
    title: "Freelance",
    type: "income",
    amount: { amount: 18000000, currency: "TOMAN", convertedAmount: 90, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d10,
    recurrence: "none",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-income-side",
    title: "Side Project",
    type: "income",
    amount: { amount: 10000000, currency: "TOMAN", convertedAmount: 50, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d15,
    recurrence: "none",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-expense-rent",
    title: "Rent",
    type: "expense",
    amount: { amount: 25000000, currency: "TOMAN", convertedAmount: 125, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d1,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-expense-groceries",
    title: "Groceries",
    type: "expense",
    amount: { amount: 7000000, currency: "TOMAN", convertedAmount: 35, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d10,
    recurrence: "none",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-expense-transport",
    title: "Transport",
    type: "expense",
    amount: { amount: 3500000, currency: "TOMAN", convertedAmount: 17, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d5,
    recurrence: "monthly",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-saving-cash",
    title: "Cash",
    type: "savings",
    amount: { amount: 300, currency: "USD", convertedAmount: 60000000, convertedCurrency: "TOMAN", exchangeRateSnapshot: 200000 },
    date: d1,
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-saving-usdt",
    title: "USDT on Wallex",
    type: "savings",
    amount: { amount: 100, currency: "USD", convertedAmount: 20000000, convertedCurrency: "TOMAN", exchangeRateSnapshot: 200000 },
    date: d1,
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-goal-trip",
    title: "Dubai Trip",
    type: "goal",
    targetAmount: { amount: 500000000, currency: "TOMAN", convertedAmount: 2500, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d1,
    category: "trip",
    recurrence: "none",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "item-goal-laptop",
    title: "New Laptop",
    type: "goal",
    targetAmount: { amount: 150000000, currency: "TOMAN", convertedAmount: 750, convertedCurrency: "USD", exchangeRateSnapshot: 200000 },
    date: d1,
    category: "other",
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
      itemIds: ["item-income-salary", "item-income-freelance", "item-income-side"]
    }
  },
  {
    id: "node-expense",
    type: "moneyNode",
    position: { x: 540, y: 0 },
    data: {
      type: "expense",
      title: "Expenses",
      itemIds: ["item-expense-rent", "item-expense-groceries", "item-expense-transport"]
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
  },
  {
    id: "node-goals",
    type: "moneyNode",
    position: { x: 545, y: 530 },
    data: {
      type: "goal",
      title: "Goals",
      itemIds: ["item-goal-trip", "item-goal-laptop"]
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
