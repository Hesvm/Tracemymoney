import { formatMonthLabel, isItemInMonth, shiftMonth } from "@/lib/months";
import { searchMoneyMap } from "@/lib/search";
import { initialItems, initialNodes } from "@/lib/initialData";

if (shiftMonth("2026-05", -1) !== "2026-04") throw new Error("previous month should subtract one month");
if (shiftMonth("2026-12", 1) !== "2027-01") throw new Error("next month should cross year boundary");
if (formatMonthLabel("2026-05", "gregorian") !== "May 2026") throw new Error("gregorian label should be readable");
if (formatMonthLabel("2026-05", "shamsi") !== "ORD 1405") throw new Error("shamsi label should use requested abbreviation");
if (!isItemInMonth({ date: "2026-05-20" }, "2026-05")) throw new Error("item should match selected month");
if (isItemInMonth({ date: "2026-06-01" }, "2026-05")) throw new Error("item should not match other months");

const results = searchMoneyMap({
  query: "rent",
  nodes: initialNodes,
  items: initialItems
});

if (!results.some((result) => result.label.includes("Rent") && result.nodeId === "node-expense")) {
  throw new Error("search should find item titles and point to the parent node");
}

const nodeResults = searchMoneyMap({
  query: "income",
  nodes: initialNodes,
  items: initialItems
});

if (!nodeResults.some((result) => result.type === "node" && result.nodeId === "node-income")) {
  throw new Error("search should find node titles");
}
