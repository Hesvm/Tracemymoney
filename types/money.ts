import type { Edge, Node } from "@xyflow/react";

export type Currency = "TOMAN" | "USD";

export type MoneyNodeType = "income" | "expense" | "savings" | "goal" | "bucket";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type CalendarSystem = "shamsi" | "gregorian";

export interface AppSettings {
  defaultCurrency: Currency;
  calendarSystem: CalendarSystem;
  showCanvasDots: boolean;
  softAnimations: boolean;
}

export type GoalCategory = "car" | "phone" | "trip" | "gift" | "house" | "boat" | "gaming-console" | "watch" | "other";

export interface MoneyAmount {
  amount: number;
  currency: Currency;
  convertedAmount?: number;
  convertedCurrency?: Currency;
  exchangeRateSnapshot?: number;
}

export interface MoneyItem {
  id: string;
  title: string;
  type: MoneyNodeType;
  amount?: MoneyAmount;
  date?: string;
  note?: string;
  recurrence?: RecurrenceType;
  parentId?: string;
  targetAmount?: MoneyAmount;
  category?: GoalCategory;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyEdge {
  id: string;
  source: string;
  target: string;
  amount?: MoneyAmount;
}

export interface ExchangeRateState {
  usdToToman: number | null;
  fetchedAt: string | null;
  isLoading: boolean;
  error?: string;
}

export interface MoneyNodeData extends Record<string, unknown> {
  type: MoneyNodeType;
  title: string;
  itemIds: string[];
  category?: GoalCategory;
}

export type MoneyFlowNode = Node<MoneyNodeData, "moneyNode">;
export type MoneyFlowEdge = Edge;
