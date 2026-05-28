import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import { isItemInMonth } from "@/lib/months";
import type { Currency, MoneyItem } from "@/types/money";

/**
 * For each item visible in the selected month, returns its percentage share
 * of the bucket's total for that month.
 *
 * Returns {} when the bucket total is zero (nothing to show).
 * Items with zero amount are omitted from the result.
 * Percentages are raw floats (0–100); display logic should round and handle <1%.
 */
export function calculateBucketPercentages(
  nodeItemIds: string[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): Record<string, number> {
  const total = getNodeMonthlyTotal(nodeItemIds, items, selectedMonth, currency, usdToToman);
  if (total === 0) return {};

  const result: Record<string, number> = {};
  for (const id of nodeItemIds) {
    const item = items.find((i) => i.id === id);
    if (!item || !isItemInMonth(item, selectedMonth)) continue;
    const itemAmt = getNodeMonthlyTotal([id], items, selectedMonth, currency, usdToToman);
    if (itemAmt !== 0) {
      result[id] = (itemAmt / total) * 100;
    }
  }
  return result;
}
