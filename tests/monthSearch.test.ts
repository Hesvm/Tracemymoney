import { formatMonthLabel, isItemInMonth, shiftMonth } from "@/lib/months";
import { searchMoneyMap } from "@/lib/search";
import type { MoneyFlowNode, MoneyItem } from "@/types/money";

// --- month utilities ---

if (shiftMonth("2026-05", -1) !== "2026-04") throw new Error("previous month should subtract one month");
if (shiftMonth("2026-12", 1) !== "2027-01") throw new Error("next month should cross year boundary");
if (formatMonthLabel("2026-05", "gregorian") !== "May 2026") throw new Error("gregorian label should be readable");
if (formatMonthLabel("2026-05", "shamsi") !== "ORD 1405") throw new Error("shamsi label should use requested abbreviation");

// one-off item visibility
if (!isItemInMonth({ date: "2026-05-20" }, "2026-05")) throw new Error("item should match selected month");
if (isItemInMonth({ date: "2026-06-01" }, "2026-05")) throw new Error("item should not match other months");

// recurring item visibility — should only appear from start month onward
if (isItemInMonth({ date: "2026-05-01", recurrence: "monthly" }, "2026-04"))
  throw new Error("monthly recurring should not appear before start month");
if (!isItemInMonth({ date: "2026-05-01", recurrence: "monthly" }, "2026-05"))
  throw new Error("monthly recurring should appear in start month");
if (!isItemInMonth({ date: "2026-05-01", recurrence: "monthly" }, "2026-06"))
  throw new Error("monthly recurring should appear in months after start");
if (isItemInMonth({ date: "2026-05-15", recurrence: "weekly" }, "2026-04"))
  throw new Error("weekly recurring should not appear before start month");
if (!isItemInMonth({ date: "2026-05-15", recurrence: "weekly" }, "2026-07"))
  throw new Error("weekly recurring should appear in months after start");

// --- search ---

const fixtureNodes: MoneyFlowNode[] = [
  {
    id: "node-income",
    type: "moneyNode",
    position: { x: 0, y: 0 },
    data: { type: "income", title: "Income", itemIds: ["item-salary"] },
  },
  {
    id: "node-expense",
    type: "moneyNode",
    position: { x: 0, y: 0 },
    data: { type: "expense", title: "Expenses", itemIds: ["item-rent"] },
  },
];

const fixtureItems: MoneyItem[] = [
  {
    id: "item-salary",
    title: "Salary",
    type: "income",
    amount: { amount: 5000, currency: "USD" },
    date: "2026-05-01",
    recurrence: "monthly",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item-rent",
    title: "Rent",
    type: "expense",
    amount: { amount: 40000000, currency: "TOMAN" },
    date: "2026-05-01",
    recurrence: "monthly",
    createdAt: "",
    updatedAt: "",
  },
];

const results = searchMoneyMap({
  query: "rent",
  nodes: fixtureNodes,
  items: fixtureItems,
});

if (!results.some((result) => result.label.includes("Rent") && result.nodeId === "node-expense")) {
  throw new Error("search should find item titles and point to the parent node");
}

const nodeResults = searchMoneyMap({
  query: "income",
  nodes: fixtureNodes,
  items: fixtureItems,
});

if (!nodeResults.some((result) => result.type === "node" && result.nodeId === "node-income")) {
  throw new Error("search should find node titles");
}
