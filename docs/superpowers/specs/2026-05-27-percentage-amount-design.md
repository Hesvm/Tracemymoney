# Percentage-Based Amount Mode — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

---

## Goal

Allow users to enter an expense, savings, or goal amount as a percentage of total monthly income. The calculated result is stored as an immutable snapshot — not a live formula. Existing fixed-amount behaviour is completely unchanged.

---

## Product Rules

- This is lightweight intentional planning, not a budgeting engine.
- Percentage is always relative to **total income for the item's date month** — no per-node selector.
- Calculated amount is stored permanently at save time.
- Future income changes do **not** mutate historical items.
- Recurring % items store the creation-month snapshot; per-month recalculation requires a future occurrence-generation feature (v1 intentionally defers this — `percentageValue` and `baseAmountSnapshot` are stored for future use).
- No recursive percentages, no allocation cascades, no financial simulation.

---

## Data Model

Add three optional fields to `MoneyItem` in `types/money.ts`:

```ts
inputMode?: "fixed" | "percentage"   // undefined treated as "fixed" — fully backward-compatible
percentageValue?: number             // the raw % entered by the user, e.g. 30
baseAmountSnapshot?: number         // total income for that month at save time, e.g. 200_000_000
```

The existing `amount` field continues to hold the **final calculated amount** (e.g. 60 000 000 T). All analytics, node chips, recurring display, and sync logic are untouched.

---

## UI — Amount Mode Toggle Badge

### Placement

The `AmountInput` component in `FormControls.tsx` gains an optional `inputMode` / `onModeChange` prop pair. A small pill badge appears at the right edge of the input field:

- **Fixed mode (default):** `fixed ▼` — muted grey, blends into the input
- **Percentage mode:** `% ▼` — warm amber tint (`#fff1d7` / `#a16325`)

Clicking the badge toggles mode directly (no dropdown). The badge sits inside the input's right padding area so the input's border and height stay unchanged.

### Fixed mode

Identical to today. The badge is the only addition — visually quiet enough to ignore.

### Percentage mode

- Input accepts a plain number (e.g. `30`), not formatted with commas
- Placeholder: `30`
- Currency toggle still present — drives which currency the income base is read in
- A **preview row** slides in below the amount row:
  ```
  30% of 200M T = 60M T
  ```
  Preview updates live as the user types.
- If income total is 0 for the selected month, preview shows:
  ```
  No income recorded for this month
  ```
  and the submit button is disabled.

### Applied to

| Modal | Toggle shown |
|-------|-------------|
| Add Expense | ✅ |
| Add Savings | ✅ |
| Add Goal | ✅ |
| Add Income | ❌ (circular) |
| Add Bucket | ❌ (no amount field) |

---

## Calculation Logic

### New file: `lib/percentageAmount.ts`

Single exported pure function:

```ts
export function calculatePercentageAmount(
  pct: number,
  month: string,              // "YYYY-MM" — derived from item's date field
  currency: Currency,
  nodes: MoneyFlowNode[],
  items: MoneyItem[],
  usdToToman: number | null
): { amount: number; baseSnapshot: number }
```

Implementation:
1. Find all nodes where `node.data.type === "income"`.
2. Sum their items for `month` using the existing `getNodeMonthlyTotal()` per node.
3. `baseSnapshot = sum`.
4. `amount = Math.round((pct / 100) * baseSnapshot)`.
5. Return `{ amount, baseSnapshot }`.

Returns `{ amount: 0, baseSnapshot: 0 }` when no income exists for the month.

### Currency handling

The `currency` prop (from the currency toggle) determines which currency `getNodeMonthlyTotal` returns the base in. The stored `amount` is in that currency. Historical exchange-rate snapshots are respected via the existing `amountInCurrency` logic inside `getNodeMonthlyTotal`.

### Month derivation

The month for the calculation is derived from the **date field** in the form — not the app's `selectedMonth`. If the user picks a date of 2025-03-15, the income base is March 2025. This ensures historical accuracy.

---

## QuickAddModal — Integration

### New state

```ts
const [inputMode, setInputMode] = useState<"fixed" | "percentage">("fixed");
```

### Percentage preview

The existing `amount` state (`number | null`) is reused: in % mode it holds the raw percentage (e.g. `30`), not a money amount. Switching modes resets `amount` to `null`.

```ts
const pctPreview = useMemo(() => {
  if (inputMode !== "percentage" || !amount) return null;
  // amount is the raw % here (e.g. 30)
  // date.slice(0, 7) gives "YYYY-MM"
  return calculatePercentageAmount(amount, date.slice(0, 7), currency, nodes, items, usdToToman);
}, [inputMode, amount, date, currency, nodes, items, usdToToman]);
```

### Submit payload

When `inputMode === "percentage"`:

```ts
const resolvedAmount = pctPreview?.amount ?? 0;
// payload uses resolvedAmount as the actual amount
// plus attaches metadata:
inputMode: "percentage",
percentageValue: amount,          // the raw %
baseAmountSnapshot: pctPreview?.baseSnapshot,
```

When `inputMode === "fixed"`: behaviour unchanged.

### Disable submit condition

Add to existing submit-disabled logic:

```ts
if (inputMode === "percentage" && (!pctPreview || pctPreview.baseSnapshot === 0)) → disabled
```

---

## New Components / Files

| Path | Purpose |
|------|---------|
| `lib/percentageAmount.ts` | Pure calculation function |
| *(inline in FormControls.tsx)* | `AmountModeBadge` sub-component inside `AmountInput` |
| *(inline in QuickAddModal.tsx)* | `PercentagePreview` row component |

No new top-level component files needed — scope is contained to the two existing files plus the new lib function.

---

## Acceptance Criteria

- [ ] `fixed ▼` badge visible on amount input in expense/savings/goal modals
- [ ] Clicking badge switches to `% ▼` mode; input clears and accepts percentage number
- [ ] Preview row appears in % mode, updates live
- [ ] Preview shows "No income recorded for this month" if income total is 0; submit disabled
- [ ] Saving a % item stores correct `amount`, `percentageValue`, `baseAmountSnapshot`, `inputMode`
- [ ] Saved item appears identically to a fixed item in all node/analytics views
- [ ] Switching back to fixed mode clears percentage fields; behaves as normal
- [ ] Income and bucket modals show no badge
- [ ] Existing fixed-amount items unaffected (no data migration needed)
- [ ] Currency toggle applies correctly to % calculation
- [ ] Historical month dates use that month's income, not current month
