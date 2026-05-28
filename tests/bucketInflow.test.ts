import { getBucketInflow } from "@/lib/bucketInflow";
import type { MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";

function makeNode(id: string, itemIds: string[]): MoneyFlowNode {
  return {
    id,
    type: "moneyNode",
    position: { x: 0, y: 0 },
    data: { type: "income", title: id, itemIds },
  } as MoneyFlowNode;
}

function makeEdge(source: string, target: string): MoneyFlowEdge {
  return { id: `${source}-${target}`, source, target } as MoneyFlowEdge;
}

function makeItem(id: string, amount: number, date = "2026-05-15"): MoneyItem {
  return {
    id,
    title: id,
    type: "income",
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

// No edges to target → 0
const noEdges = getBucketInflow("node-savings", [], [], [], "2026-05", "TOMAN", null);
if (noEdges !== 0) throw new Error(`no edges should return 0, got ${noEdges}`);

// Single source with two items
const nodes1 = [makeNode("node-income", ["a", "b"]), makeNode("node-savings", [])];
const edges1 = [makeEdge("node-income", "node-savings")];
const items1 = [makeItem("a", 100_000_000), makeItem("b", 70_000_000)];
approx(getBucketInflow("node-savings", nodes1, edges1, items1, "2026-05", "TOMAN", null), 170_000_000, "single source");

// Two sources
const nodes2 = [
  makeNode("node-income", ["a"]),
  makeNode("node-freelance", ["b"]),
  makeNode("node-savings", []),
];
const edges2 = [makeEdge("node-income", "node-savings"), makeEdge("node-freelance", "node-savings")];
const items2 = [makeItem("a", 100_000_000), makeItem("b", 50_000_000)];
approx(getBucketInflow("node-savings", nodes2, edges2, items2, "2026-05", "TOMAN", null), 150_000_000, "two sources");

// Item in wrong month is excluded
const nodes3 = [makeNode("node-income", ["a", "b"]), makeNode("node-savings", [])];
const edges3 = [makeEdge("node-income", "node-savings")];
const items3 = [makeItem("a", 100_000_000), makeItem("b", 50_000_000, "2026-04-15")];
approx(getBucketInflow("node-savings", nodes3, edges3, items3, "2026-05", "TOMAN", null), 100_000_000, "wrong month excluded");

// Unrelated edge (different target) is ignored
const nodes4 = [makeNode("node-income", ["a"]), makeNode("node-savings", []), makeNode("node-expense", [])];
const edges4 = [makeEdge("node-income", "node-expense")]; // edge to expense, not savings
const items4 = [makeItem("a", 100_000_000)];
approx(getBucketInflow("node-savings", nodes4, edges4, items4, "2026-05", "TOMAN", null), 0, "unrelated edge ignored");

console.log("getBucketInflow: all tests passed ✓");
