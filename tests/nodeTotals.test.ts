// Run with: npx tsx tests/nodeTotals.test.ts
import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import type { MoneyItem } from "@/types/money";

function item(overrides: Partial<MoneyItem> & { id: string }): MoneyItem {
  return {
    title: "Test",
    type: "income",
    recurrence: "none",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const RATE = 100_000;

// 1. Single TOMAN income item in matching month
const items1 = [
  item({ id: "a", type: "income", date: "2026-05-01", amount: { amount: 50_000_000, currency: "TOMAN" } }),
];
const result1 = getNodeMonthlyTotal(["a"], items1, "2026-05", "TOMAN", RATE);
if (result1 !== 50_000_000) throw new Error(`1: Expected 50000000, got ${result1}`);

// 2. Item outside selected month excluded
const items2 = [
  item({ id: "b", type: "income", date: "2026-04-01", amount: { amount: 10_000_000, currency: "TOMAN" } }),
];
const result2 = getNodeMonthlyTotal(["b"], items2, "2026-05", "TOMAN", RATE);
if (result2 !== 0) throw new Error(`2: Expected 0, got ${result2}`);

// 3. Recurring item included from its start month onward
const items3 = [
  item({ id: "c", type: "income", date: "2026-03-01", recurrence: "monthly", amount: { amount: 5_000_000, currency: "TOMAN" } }),
];
const result3 = getNodeMonthlyTotal(["c"], items3, "2026-05", "TOMAN", RATE);
if (result3 !== 5_000_000) throw new Error(`3: Expected 5000000, got ${result3}`);

// 4. Recurring item NOT included before its start month
const items4 = [
  item({ id: "d", type: "income", date: "2026-06-01", recurrence: "monthly", amount: { amount: 5_000_000, currency: "TOMAN" } }),
];
const result4 = getNodeMonthlyTotal(["d"], items4, "2026-05", "TOMAN", RATE);
if (result4 !== 0) throw new Error(`4: Expected 0, got ${result4}`);

// 5. USD item uses convertedAmountAtEntry snapshot (historical accuracy)
const items5 = [
  item({
    id: "e",
    type: "income",
    date: "2026-05-01",
    amount: { amount: 10, currency: "USD", convertedAmountAtEntry: 1_200_000, convertedCurrency: "TOMAN", exchangeRateAtEntry: 120_000 },
  }),
];
const result5 = getNodeMonthlyTotal(["e"], items5, "2026-05", "TOMAN", RATE);
if (result5 !== 1_200_000) throw new Error(`5: Expected 1200000 (snapshot), got ${result5}`);

// 6. Multiple items summed
const items6 = [
  item({ id: "f", type: "income", date: "2026-05-01", amount: { amount: 20_000_000, currency: "TOMAN" } }),
  item({ id: "g", type: "income", date: "2026-05-15", amount: { amount: 30_000_000, currency: "TOMAN" } }),
];
const result6 = getNodeMonthlyTotal(["f", "g"], items6, "2026-05", "TOMAN", RATE);
if (result6 !== 50_000_000) throw new Error(`6: Expected 50000000, got ${result6}`);

// 7. Item with no amount counts as 0
const items7 = [item({ id: "h", type: "income", date: "2026-05-01" })];
const result7 = getNodeMonthlyTotal(["h"], items7, "2026-05", "TOMAN", RATE);
if (result7 !== 0) throw new Error(`7: Expected 0 for item with no amount, got ${result7}`);

// 8. Unknown itemId silently ignored
const result8 = getNodeMonthlyTotal(["missing"], [], "2026-05", "TOMAN", RATE);
if (result8 !== 0) throw new Error(`8: Expected 0 for missing id, got ${result8}`);

// 9. USD → USD same-currency passthrough
const items9 = [
  item({ id: "i", type: "income", date: "2026-05-01", amount: { amount: 500, currency: "USD" } }),
];
const result9 = getNodeMonthlyTotal(["i"], items9, "2026-05", "USD", RATE);
if (result9 !== 500) throw new Error(`9: Expected 500, got ${result9}`);

// 10. null rate falls back to FALLBACK_RATE (no crash)
const items10 = [
  item({ id: "j", type: "income", date: "2026-05-01", amount: { amount: 100_000_000, currency: "TOMAN" } }),
];
const result10 = getNodeMonthlyTotal(["j"], items10, "2026-05", "USD", null);
if (result10 <= 0) throw new Error(`10: Expected positive USD amount with fallback rate, got ${result10}`);

console.log("All nodeTotals tests passed.");
