# Savings Bucket Inflow Percentage

**Date:** 2026-05-28  
**Status:** Approved

---

## Summary

The Savings add/edit modal supports two amount-entry modes: **Fixed** and **Percentage**. When percentage mode is active, the entered percentage is applied against the total money flowing into that Savings node for the selected month. The resolved amount is stored as a snapshot and never mutates automatically afterward.

---

## Background

A previous implementation pass incorrectly removed the Fixed/Percentage toggle and replaced it with purely descriptive per-item share labels. This spec restores the intended percentage mode and defines the correct base for calculation: **the sum of all directly incoming items from source nodes connected to the Savings node via canvas edges**.

---

## Feature Scope

Applies to the **Savings** add/edit form only. Other node types (income, expense, goal, bucket) are not affected.

---

## Data Model

### New fields on `MoneyItem` (in `types/money.ts`)

```ts
percentageBaseType?: "bucket_inflow";   // what the base was
percentageBaseNodeId?: string;          // which node's inflow was used
```

Existing fields already in `MoneyItem` and `AddPayload`:
- `inputMode?: "fixed" | "percentage"`
- `percentageValue?: number`
- `baseAmountSnapshot?: number`

### `AddPayload` additions

Same two new fields mirroring `MoneyItem`.

### Stored shape (percentage example)

```ts
{
  inputMode: "percentage",
  percentageValue: 20,
  percentageBaseType: "bucket_inflow",
  percentageBaseNodeId: "node-savings",
  baseAmountSnapshot: 170_000_000,
  amount: { amount: 34_000_000, currency: "TOMAN" }
}
```

---

## Inflow Calculation

### Definition

For a target Savings node, **bucket inflow** = sum of all items on directly connected source nodes for the selected month.

```
Income ──→ Savings
Freelance ─→ Savings

Inflow = Σ items on Income (selected month) + Σ items on Freelance (selected month)
```

Only **direct** incoming connections are counted. Grandparent nodes are not traversed.

### New function: `lib/bucketInflow.ts`

```ts
export function getBucketInflow(
  targetNodeId: string,
  nodes: MoneyFlowNode[],
  edges: MoneyFlowEdge[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): number
```

Implementation:
1. Filter `edges` to those where `edge.target === targetNodeId`
2. For each matching edge's `source`, find the source node
3. Use existing `getNodeMonthlyTotal(sourceNode.data.itemIds, items, selectedMonth, currency, usdToToman)` to sum items
4. Return grand total

Currency, rate snapshot, and month scoping all delegate to `getNodeMonthlyTotal` (already handles recurring items, conversion, rate fallback).

---

## UI: Savings Modal

### Amount Type Toggle (savings only)

```
Amount Type
[ Fixed ]  [ Percentage ]
```

Rendered as a segmented two-button toggle, styled like `CurrencySegmentedToggle`.

### Fixed Mode

Unchanged from current behavior — shows `AmountInput` + `CurrencySegmentedToggle`.

### Percentage Mode

Hides `AmountInput`. Shows:

```
Percentage
[ 20 ]

Based on
Total incoming to Savings this month

Preview
20% of 170M T = 34M T
```

- **Percentage input**: plain numeric field (integer, 0–100), no currency widget
- **"Based on" label**: static, always reads "Total incoming to Savings this month"
- **Preview**: computed live from `(percentageValue / 100) * inflow`, formatted via `formatPrimaryAmount`
- **Empty inflow**: if inflow = 0 for the selected month, show `"No incoming money to this Savings node this month. Add or connect income first."` and disable the submit button

### Finding the target node

| Case | How |
|------|-----|
| Adding a new savings item | `nodes.find(n => n.data.type === 'savings')` — first savings-type node |
| Editing an existing item | `nodes.find(n => n.data.itemIds.includes(editItemId))` |

If no savings node exists yet (first ever savings item), inflow = 0 and the empty-inflow message is shown.

---

## Submit Behavior

### Percentage mode

1. Compute `resolvedAmount = Math.round((percentageValue / 100) * inflow)`
2. Build `amount: { amount: resolvedAmount, currency: defaultCurrency }`
3. Pass to `addItemFromForm` / `updateItemFromForm`:
   - `inputMode: "percentage"`
   - `percentageValue`
   - `percentageBaseType: "bucket_inflow"`
   - `percentageBaseNodeId: targetNodeId`
   - `baseAmountSnapshot: inflow`
   - `amount: resolvedAmount` (the snapshot)

### Fixed mode

Same as today — `inputMode: "fixed"`, `percentageValue` and `baseAmountSnapshot` are `undefined`.

---

## Snapshot Immutability

Once saved, changing upstream inflow does **not** automatically update existing savings items. Historical items remain stable. On edit, the preview recalculates against the currently selected month's inflow, but the stored snapshot only updates when the user explicitly saves.

---

## Month Scoping

The inflow is calculated for the month of the item's `date` field. Recurring items respect their start date — they only appear in months at or after their start date, delegated entirely to `isItemInMonth`.

---

## Currency

Inflow is converted to `defaultCurrency` using the standard rate resolution already in `getNodeMonthlyTotal` (stored snapshot → historical API → fallback).

---

## Acceptance Criteria

- [ ] Savings modal shows `[ Fixed ] [ Percentage ]` toggle
- [ ] Percentage mode: base = total incoming edges to Savings node, selected month
- [ ] No manual source selection by the user
- [ ] Live preview: `X% of Y = Z`
- [ ] Empty inflow shows explanation message and disables submit
- [ ] Saved item stores `inputMode`, `percentageValue`, `baseAmountSnapshot`, `percentageBaseNodeId`
- [ ] Existing (historical) saved items do not mutate
- [ ] Edit mode pre-fills `inputMode` and `percentageValue`; preview recalculates from current month
- [ ] Fixed mode behavior unchanged
- [ ] No regressions on income, expense, goal, bucket forms
