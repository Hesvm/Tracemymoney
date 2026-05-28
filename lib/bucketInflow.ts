import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import type { Currency, MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";

/**
 * Returns the total money flowing INTO targetNodeId for the selected month.
 * Sums items from all direct source nodes connected via incoming edges.
 * Does NOT recurse into grandparents.
 */
export function getBucketInflow(
  targetNodeId: string,
  nodes: MoneyFlowNode[],
  edges: MoneyFlowEdge[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): number {
  const incomingSourceIds = edges
    .filter((e) => e.target === targetNodeId)
    .map((e) => e.source);

  return incomingSourceIds.reduce((sum, sourceId) => {
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return sum;
    return sum + getNodeMonthlyTotal(sourceNode.data.itemIds, items, selectedMonth, currency, usdToToman);
  }, 0);
}
