import { isItemInMonth } from "@/lib/months";
import type { Currency, MoneyItem } from "@/types/money";

const FALLBACK_RATE = 94_382;

function amountInCurrency(item: MoneyItem, currency: Currency, rate: number): number {
  const amt = item.amount;
  if (!amt) return 0;
  if (amt.currency === currency) return amt.amount;
  if (amt.convertedCurrency === currency && typeof amt.convertedAmountAtEntry === "number") {
    return amt.convertedAmountAtEntry;
  }
  return currency === "USD" ? amt.amount / rate : amt.amount * rate;
}

export function getNodeMonthlyTotal(
  nodeItemIds: string[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): number {
  const rate = usdToToman ?? FALLBACK_RATE;
  return nodeItemIds.reduce((sum, id) => {
    const item = items.find((i) => i.id === id);
    if (!item || !isItemInMonth(item, selectedMonth)) return sum;
    return sum + amountInCurrency(item, currency, rate);
  }, 0);
}
