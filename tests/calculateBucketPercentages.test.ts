import { calculateBucketPercentages } from "@/lib/calculateBucketPercentages";
import type { MoneyItem } from "@/types/money";

function makeItem(id: string, amount: number, date = "2026-05-15"): MoneyItem {
  return {
    id,
    title: id,
    type: "expense",
    amount: { amount, currency: "TOMAN" },
    date,
    recurrence: "none",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function approx(a: number, b: number, label: string) {
  if (Math.abs(a - b) > 0.01) throw new Error(`${label}: expected ~${b}, got ${a}`);
}

// empty nodeItemIds returns {}
const empty = calculateBucketPercentages([], [], "2026-05", "TOMAN", null);
if (Object.keys(empty).length !== 0) throw new Error("empty nodeItemIds should return {}");

// bucket total of zero returns {}
const zeroTotal = calculateBucketPercentages(["a"], [makeItem("a", 0)], "2026-05", "TOMAN", null);
if (Object.keys(zeroTotal).length !== 0) throw new Error("zero total should return {}");

// two items split correctly
const items2 = [makeItem("a", 40_000_000), makeItem("b", 60_000_000)];
const split = calculateBucketPercentages(["a", "b"], items2, "2026-05", "TOMAN", null);
approx(split["a"], 40, "item a");
approx(split["b"], 60, "item b");

// single item is 100%
const single = calculateBucketPercentages(["a"], [makeItem("a", 20_000_000)], "2026-05", "TOMAN", null);
approx(single["a"], 100, "single item");

// item in wrong month is excluded
const wrongMonth = [makeItem("a", 40_000_000), makeItem("b", 60_000_000, "2026-04-15")];
const monthFiltered = calculateBucketPercentages(["a", "b"], wrongMonth, "2026-05", "TOMAN", null);
approx(monthFiltered["a"], 100, "only in-month item");
if (monthFiltered["b"] !== undefined) throw new Error("out-of-month item should be excluded");

// item with zero amount is excluded
const withZero = [makeItem("a", 40_000_000), makeItem("b", 0)];
const zeroItem = calculateBucketPercentages(["a", "b"], withZero, "2026-05", "TOMAN", null);
approx(zeroItem["a"], 100, "non-zero item after zero");
if (zeroItem["b"] !== undefined) throw new Error("zero-amount item should be excluded");

// item with no amount field is excluded
const noAmt: MoneyItem = {
  id: "c",
  title: "c",
  type: "expense",
  date: "2026-05-15",
  recurrence: "none",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const withNoAmt = [makeItem("a", 40_000_000), noAmt];
const noAmtResult = calculateBucketPercentages(["a", "c"], withNoAmt, "2026-05", "TOMAN", null);
approx(noAmtResult["a"], 100, "item with no amount field");
if (noAmtResult["c"] !== undefined) throw new Error("item without amount should be excluded");

console.log("calculateBucketPercentages: all tests passed ✓");
