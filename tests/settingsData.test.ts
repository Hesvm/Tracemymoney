import { buildSettingsExport, resetUserCreatedData } from "@/lib/settingsData";
import { initialEdges, initialItems, initialNodes } from "@/lib/initialData";
import type { AppSettings, ExchangeRateState, MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";

const settings: AppSettings = {
  defaultCurrency: "USD",
  calendarSystem: "gregorian",
  showCanvasDots: false,
  softAnimations: false
};

const exchangeRate: ExchangeRateState = {
  usdToToman: 82000,
  fetchedAt: "2026-05-21T05:42:00.000Z",
  isLoading: false
};

const customItems: MoneyItem[] = [
  {
    id: "item-custom",
    title: "Custom",
    type: "expense",
    createdAt: "2026-05-21T05:42:00.000Z",
    updatedAt: "2026-05-21T05:42:00.000Z"
  }
];

const customNodes = initialNodes.map((node) =>
  node.id === "node-expense" ? { ...node, data: { ...node.data, itemIds: ["item-custom"] } } : node
) as MoneyFlowNode[];
const customEdges: MoneyFlowEdge[] = [{ id: "edge-custom", source: "node-income", target: "node-expense" }];

const reset = resetUserCreatedData({
  items: customItems,
  nodes: customNodes,
  edges: customEdges
});

if (reset.items !== initialItems) throw new Error("reset should restore initial money items");
if (reset.nodes !== initialNodes) throw new Error("reset should restore initial nodes");
if (reset.edges !== initialEdges) throw new Error("reset should restore initial edges");

const exported = buildSettingsExport({
  items: customItems,
  nodes: customNodes,
  edges: customEdges,
  settings,
  exchangeRate
});

if (exported.settings.defaultCurrency !== "USD") throw new Error("export should include settings");
if (exported.exchangeRate.usdToToman !== 82000) throw new Error("export should include exchange rate state");
