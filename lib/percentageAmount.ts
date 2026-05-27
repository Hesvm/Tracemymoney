import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import type { Currency, MoneyFlowNode, MoneyItem } from "@/types/money";

export interface PercentageResult {
  amount: number;        // calculated amount, e.g. 60_000_000
  baseSnapshot: number;  // total income base used, e.g. 200_000_000
}

/**
 * Calculate an amount as a percentage of total income for the given month.
 * Always uses ALL income-type nodes as the base.
 * Returns { amount: 0, baseSnapshot: 0 } when no income exists for the month.
 */
export function calculatePercentageAmount(
  pct: number,
  month: string,                  // "YYYY-MM" — from date.slice(0, 7)
  currency: Currency,
  nodes: MoneyFlowNode[],
  items: MoneyItem[],
  usdToToman: number | null
): PercentageResult {
  const incomeNodes = nodes.filter((n) => n.data.type === "income");
  const baseSnapshot = incomeNodes.reduce(
    (sum, n) => sum + getNodeMonthlyTotal(n.data.itemIds, items, month, currency, usdToToman),
    0
  );
  if (baseSnapshot === 0) return { amount: 0, baseSnapshot: 0 };
  const amount = Math.round((pct / 100) * baseSnapshot);
  return { amount, baseSnapshot };
}
