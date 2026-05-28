# Automatic Bucket Percentages — Design Spec

**Date:** 2026-05-28  
**Status:** Approved

---

## Summary

Replace the manual "% of income" input mode with automatic, read-only bucket percentages. Each item in a node automatically shows what share it represents of its parent bucket's monthly total. Percentages are descriptive analytics — users never enter them.

---

## What Changes

### Removed

| What | Where |
|------|-------|
| `lib/percentageAmount.ts` | Deleted entirely |
| `fix/%` badge dropdown in `AmountInput` | `components/quick-add/FormControls.tsx` |
| `mode` / `onModeChange` props on `AmountInput` | `FormControls.tsx` |
| `inputMode` state + `pctPreview` memo | `QuickAddModal.tsx` |
| Percentage preview UI ("≈ 60M T of 200M T") | `QuickAddModal.tsx` |
| `isPercentageMode` branch in `handleSubmit` | `QuickAddModal.tsx` |
| `% of income` dropdown option | `FormControls.tsx` |

`MoneyItem` fields `inputMode`, `percentageValue`, `baseAmountSnapshot` stay in the type for backward compatibility with stored data but are never written from the UI going forward.

### Added

| What | Where |
|------|-------|
| `calculateBucketPercentages()` pure helper | `lib/calculateBucketPercentages.ts` |
| `bucketPct?: number` prop + label | `MoneyRow` in `MoneyNode.tsx` |
| `bucketPct?: number` prop + label | `GoalRow` in `MoneyNode.tsx` |
| `bucketPercentages` useMemo | `MoneyNode` component |

---

## New Helper: `calculateBucketPercentages`

**File:** `lib/calculateBucketPercentages.ts`

```ts
calculateBucketPercentages(
  nodeItemIds: string[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): Record<string, number>
```

**Logic:**
1. Filter `nodeItemIds` to items that exist and pass `isItemInMonth(item, selectedMonth)`.
2. Sum their amounts in `currency` (using stored historical snapshots — same logic as `getNodeMonthlyTotal`).
3. If total is 0, return `{}`.
4. For each visible item, return `Math.round(Math.abs(amountInCurrency) / total * 100)`.
5. Items with computed percentage < 1 get value `0.5` (sentinel for `<1%` display).

**Returns:** `Record<itemId, number>` — only entries for visible items in the current month.

---

## MoneyNode Changes

```ts
const bucketPercentages = useMemo(
  () => calculateBucketPercentages(data.itemIds, items, selectedMonth, defaultCurrency, usdToToman),
  [data.itemIds, items, selectedMonth, defaultCurrency, usdToToman]
)
```

Pass `bucketPct={bucketPercentages[item.id]}` to each `MoneyRow` and `GoalRow`.

Recalculates only when: selected month changes, items change, currency changes, items are added/deleted.  
Does **not** recalculate on: node drag, canvas zoom, hover, edge selection.

---

## Display

### MoneyRow

Right column (below date/recurrence):

```
Kho 2
↻ monthly
57%
```

**Styles:**
```
font-size: 10px (md: 11px)
opacity: 0.55
tabular-nums
```

### GoalRow

Below the item title/amount in the card info area:

```
Dubai Trip
24M T saved
57%
```

Same muted style.

### Edge Cases

| Condition | Behaviour |
|-----------|-----------|
| `bucketPct === undefined` (no total) | Hidden — render nothing |
| Computed percentage < 1% | Show `<1%` |
| Computed percentage ≥ 1% | Show `57%` |
| Negative amounts | Use absolute value — always positive percentage |
| Bucket total = 0 | `calculateBucketPercentages` returns `{}` — nothing shown |

---

## Scope

Applies to all node types: income, expense, savings, goal, bucket.  
Percentages are scoped to the **direct visible items** inside the same node.  
Does **not** recursively include child buckets or nested goal internals.

---

## Acceptance Criteria

- [ ] Item percentages are calculated automatically from bucket total
- [ ] Percentages represent share of current month's bucket total
- [ ] Only direct visible items in current month are counted
- [ ] Recurring items respect `isItemInMonth` start date logic
- [ ] Historical amounts use stored snapshots (not live exchange rates)
- [ ] Percentages display subtly in item rows (desktop and mobile)
- [ ] No manual percentage input system remains in the UI
- [ ] `<1%` shown for tiny percentages; nothing shown when total is 0
- [ ] Memoization prevents recalculation on drag/zoom/hover
- [ ] Layout unaffected — no row height changes that break spacing
- [ ] Existing app behaviour intact
