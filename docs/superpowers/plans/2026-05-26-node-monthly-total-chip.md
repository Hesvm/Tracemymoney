# Node Monthly Total Chip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a muted monthly-total chip to each node header (next to `+`) showing the direct-item sum for the selected month in the user's default currency.

**Architecture:** New pure function `getNodeMonthlyTotal` in `lib/nodeTotals.ts` reuses `isItemInMonth` (months.ts) and `amountInCurrency` (analytics.ts). A new `NodeTotalChip` presentational component renders the pill + CSS hover tooltip. `MoneyNode` subscribes to `defaultCurrency` and `usdToToman`, computes two `useMemo` totals (primary + secondary), and renders the chip between badge and `+` button.

**Tech Stack:** React 19, Zustand 5, TypeScript, Tailwind CSS, Next.js 15

---

### Task 1: `lib/nodeTotals.ts` — pure total calculator

**Files:**
- Create: `lib/nodeTotals.ts`
- Create: `tests/nodeTotals.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/nodeTotals.test.ts`:

```ts
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
if (result1 !== 50_000_000) throw new Error(`Expected 50000000, got ${result1}`);

// 2. Item outside selected month excluded
const items2 = [
  item({ id: "b", type: "income", date: "2026-04-01", amount: { amount: 10_000_000, currency: "TOMAN" } }),
];
const result2 = getNodeMonthlyTotal(["b"], items2, "2026-05", "TOMAN", RATE);
if (result2 !== 0) throw new Error(`Expected 0, got ${result2}`);

// 3. Recurring item included from its start month onward
const items3 = [
  item({ id: "c", type: "income", date: "2026-03-01", recurrence: "monthly", amount: { amount: 5_000_000, currency: "TOMAN" } }),
];
const result3 = getNodeMonthlyTotal(["c"], items3, "2026-05", "TOMAN", RATE);
if (result3 !== 5_000_000) throw new Error(`Expected 5000000, got ${result3}`);

// 4. Recurring item NOT included before its start month
const items4 = [
  item({ id: "d", type: "income", date: "2026-06-01", recurrence: "monthly", amount: { amount: 5_000_000, currency: "TOMAN" } }),
];
const result4 = getNodeMonthlyTotal(["d"], items4, "2026-05", "TOMAN", RATE);
if (result4 !== 0) throw new Error(`Expected 0 (start month in future), got ${result4}`);

// 5. USD item converted using convertedAmountAtEntry (historical accuracy)
const items5 = [
  item({ id: "e", type: "income", date: "2026-05-01", amount: { amount: 10, currency: "USD", convertedAmountAtEntry: 1_200_000, convertedCurrency: "TOMAN", exchangeRateAtEntry: 120_000 } }),
];
const result5 = getNodeMonthlyTotal(["e"], items5, "2026-05", "TOMAN", RATE);
if (result5 !== 1_200_000) throw new Error(`Expected 1200000 (from snapshot), got ${result5}`);

// 6. Multiple items summed
const items6 = [
  item({ id: "f", type: "income", date: "2026-05-01", amount: { amount: 20_000_000, currency: "TOMAN" } }),
  item({ id: "g", type: "income", date: "2026-05-15", amount: { amount: 30_000_000, currency: "TOMAN" } }),
];
const result6 = getNodeMonthlyTotal(["f", "g"], items6, "2026-05", "TOMAN", RATE);
if (result6 !== 50_000_000) throw new Error(`Expected 50000000, got ${result6}`);

// 7. Item with no amount → counts as 0
const items7 = [item({ id: "h", type: "income", date: "2026-05-01" })];
const result7 = getNodeMonthlyTotal(["h"], items7, "2026-05", "TOMAN", RATE);
if (result7 !== 0) throw new Error(`Expected 0 for item with no amount, got ${result7}`);

// 8. Unknown itemId silently ignored
const result8 = getNodeMonthlyTotal(["missing"], [], "2026-05", "TOMAN", RATE);
if (result8 !== 0) throw new Error(`Expected 0 for missing id, got ${result8}`);

console.log("All nodeTotals tests passed.");
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx tsx tests/nodeTotals.test.ts
```

Expected: `Cannot find module '@/lib/nodeTotals'` or similar import error.

- [ ] **Step 3: Create `lib/nodeTotals.ts`**

```ts
import { amountInCurrency } from "@/lib/analytics";
import { isItemInMonth } from "@/lib/months";
import type { Currency, MoneyItem } from "@/types/money";

const FALLBACK_RATE = 94_382;

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
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx tsx tests/nodeTotals.test.ts
```

Expected: `All nodeTotals tests passed.`

- [ ] **Step 5: Commit**

```bash
git add lib/nodeTotals.ts tests/nodeTotals.test.ts
git commit -m "feat(nodeTotals): add getNodeMonthlyTotal pure function"
```

---

### Task 2: `components/canvas/NodeTotalChip.tsx` — pill + tooltip

**Files:**
- Create: `components/canvas/NodeTotalChip.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { formatAnalyticsAmount } from "@/lib/analytics";
import type { Currency, MoneyNodeType } from "@/types/money";

const tintClasses: Record<MoneyNodeType, string> = {
  income:  "bg-[rgba(232,246,221,0.9)] text-[#2d7f36] border-[#2d7f36]/10",
  expense: "bg-[rgba(249,221,226,0.9)] text-[#d9344f] border-[#d9344f]/10",
  savings: "bg-[rgba(255,241,215,0.9)] text-[#a16325] border-[#a16325]/10",
  goal:    "bg-[rgba(255,241,215,0.9)] text-[#a16325] border-[#a16325]/10",
  bucket:  "bg-[rgba(247,246,243,0.9)] text-[#6b6860] border-black/[0.06]",
};

interface NodeTotalChipProps {
  total: number;
  currency: Currency;
  nodeType: MoneyNodeType;
  secondaryTotal?: number;
  secondaryCurrency?: Currency;
}

export function NodeTotalChip({
  total,
  currency,
  nodeType,
  secondaryTotal,
  secondaryCurrency,
}: NodeTotalChipProps) {
  if (total === 0) return null;

  const sign = nodeType === "expense" ? "-" : "";
  const label = `${sign}${formatAnalyticsAmount(total, currency, { compact: true })}`;

  const secondaryLabel =
    secondaryTotal != null && secondaryTotal > 0 && secondaryCurrency
      ? `≈ ${formatAnalyticsAmount(secondaryTotal, secondaryCurrency, { compact: true })}`
      : "Secondary value unavailable";

  return (
    <div className="nodrag relative hidden md:block group/chip">
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] md:text-[12px] font-semibold leading-none select-none ${tintClasses[nodeType]}`}
      >
        {label}
      </span>
      {/* Tooltip — desktop only, CSS hover, no portal */}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/chip:opacity-100 z-50">
        <div className="whitespace-nowrap rounded-full bg-[#fafaf7] px-3 py-1 text-[11px] font-medium text-[#4a4740] shadow-[0_4px_16px_rgba(0,0,0,0.10)] border border-black/[0.06]">
          {secondaryLabel}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/canvas/NodeTotalChip.tsx
git commit -m "feat(NodeTotalChip): add monthly total pill with secondary currency tooltip"
```

---

### Task 3: Wire `NodeTotalChip` into `MoneyNode` header

**Files:**
- Modify: `components/canvas/MoneyNode.tsx`

- [ ] **Step 1: Add store subscriptions and memos**

In `MoneyNode` (after the existing `liveRate` subscription at line ~215), add:

```ts
const defaultCurrency = useMoneyMapStore((state) => state.settings.defaultCurrency);
const usdToToman = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
const secondaryCurrency: import("@/types/money").Currency = defaultCurrency === "TOMAN" ? "USD" : "TOMAN";

const primaryTotal = useMemo(
  () => getNodeMonthlyTotal(data.itemIds, items, selectedMonth, defaultCurrency, usdToToman),
  [data.itemIds, items, selectedMonth, defaultCurrency, usdToToman]
);

const secondaryTotal = useMemo(
  () => getNodeMonthlyTotal(data.itemIds, items, selectedMonth, secondaryCurrency, usdToToman),
  [data.itemIds, items, selectedMonth, secondaryCurrency, usdToToman]
);
```

- [ ] **Step 2: Add imports at top of `MoneyNode.tsx`**

```ts
import { useMemo } from "react";
import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import { NodeTotalChip } from "@/components/canvas/NodeTotalChip";
```

Note: `useState` is already imported — change `import { useState }` to `import { useState, useMemo }`.

- [ ] **Step 3: Insert chip in the header JSX**

Find the header `<div>` (line ~246) — replace it:

```tsx
<div className="mb-3 md:mb-6 flex items-center justify-between gap-2">
  <NodeBadge type={data.type} title={data.title} />
  <div className="flex items-center gap-1.5 shrink-0">
    <NodeTotalChip
      total={primaryTotal}
      currency={defaultCurrency}
      nodeType={data.type}
      secondaryTotal={secondaryTotal}
      secondaryCurrency={secondaryCurrency}
    />
    <button
      className="nodrag grid size-7 md:size-8 place-items-center rounded-full bg-[#f7f6f3] text-[#9a9da9] transition hover:bg-[#efeee9] active:scale-95"
      aria-label={`Add to ${data.title}`}
      onClick={() => setPendingAddNode(id)}
    >
      <Plus className="size-4 md:size-5" strokeWidth={2.2} />
    </button>
  </div>
</div>
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/canvas/MoneyNode.tsx
git commit -m "feat(MoneyNode): show monthly total chip in node header"
```
