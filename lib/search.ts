import { formatConvertedAmount, formatPrimaryAmount } from "@/lib/formatters";
import type { MoneyFlowNode, MoneyItem } from "@/types/money";

export type SearchResultType = "node" | "item";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  nodeId: string;
  label: string;
  detail?: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function itemSearchText(item: MoneyItem) {
  return [
    item.title,
    item.note,
    formatPrimaryAmount(item.amount),
    formatConvertedAmount(item.amount),
    item.amount?.amount?.toLocaleString("en-US"),
    item.targetAmount?.amount?.toLocaleString("en-US")
  ]
    .filter(Boolean)
    .join(" ");
}

export function searchMoneyMap({
  query,
  nodes,
  items
}: {
  query: string;
  nodes: MoneyFlowNode[];
  items: MoneyItem[];
}): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const results: SearchResult[] = [];

  for (const node of nodes) {
    if (normalize(node.data.title).includes(normalizedQuery)) {
      results.push({
        id: `node-${node.id}`,
        type: "node",
        nodeId: node.id,
        label: node.data.title,
        detail: node.data.type
      });
    }

    for (const itemId of node.data.itemIds) {
      const item = items.find((candidate) => candidate.id === itemId);
      if (!item) continue;
      const haystack = normalize(itemSearchText(item));
      if (!haystack.includes(normalizedQuery)) continue;

      results.push({
        id: `item-${item.id}`,
        type: "item",
        nodeId: node.id,
        label: item.title || node.data.title,
        detail: formatPrimaryAmount(item.amount)
      });
    }
  }

  return results.slice(0, 8);
}
