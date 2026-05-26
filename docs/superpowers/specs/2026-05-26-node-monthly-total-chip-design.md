# Node Monthly Total Chip — Design Spec

**Date:** 2026-05-26  
**Status:** Approved

---

## Goal

Add a small monthly total chip to each node header, next to the `+` button, showing the direct-item total for the currently selected month in the user's default currency. Improves scannability without redesigning the canvas.

---

## Scope

- UI/data enhancement only.
- No changes to canvas architecture, connector handles, node dragging, recurring logic, analytics, search, settings, or sync.

---

## New Files

### `lib/nodeTotals.ts`

Pure function with no side effects.

```ts
getNodeMonthlyTotal(
  nodeItemIds: string[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): number
```

**Logic:**
1. Map `nodeItemIds` → `MoneyItem[]`, drop missing.
2. Filter with `isItemInMonth(item, selectedMonth)` from `lib/months.ts` — handles all recurrence types correctly, including "no items before start month."
3. For each visible item call `amountInCurrency(item, currency, rate)` from `lib/analytics.ts` — respects `convertedAmountAtEntry` for historical accuracy; falls back to live rate only when snapshot is absent. Pass `usdToToman ?? 94382` as `rate` (same fallback constant analytics.ts uses).
4. Sum and return. Returns `0` if no visible items or all amounts zero.
5. The function always returns a positive number; sign rendering is the chip's responsibility.

### `components/canvas/NodeTotalChip.tsx`

Presentational component. No store access.

**Props:**
```ts
{
  total: number;          // always positive; 0 → renders nothing
  currency: Currency;
  nodeType: MoneyNodeType;
  secondaryTotal?: number;
  secondaryCurrency?: Currency;
}
```

**Rendering:**
- Returns `null` when `total === 0`.
- Formats with `formatAnalyticsAmount(total, currency, { compact: true })` from `lib/analytics.ts`.
- Prepends `-` for `nodeType === "expense"`.
- Tooltip (desktop only): `≈ {formatAnalyticsAmount(secondaryTotal, secondaryCurrency, { compact: true })}`. If secondary unavailable: "Secondary value unavailable." Implemented with CSS `group/chip` + absolute positioned sibling — no Radix, no portal.
- Mobile: no tooltip.

**Tint palette** (muted, matches existing `nodeStyles`):

| Node type | Background | Text |
|-----------|-----------|------|
| income | `rgba(232,246,221,0.9)` | `#2d7f36` |
| expense | `rgba(249,221,226,0.9)` | `#d9344f` |
| savings / goal | `rgba(255,241,215,0.9)` | `#a16325` |
| bucket | `rgba(247,246,243,0.9)` | `#6b6860` |

**Size:** `rounded-full px-2 py-0.5 text-[11px] md:text-[12px] font-semibold border border-black/[0.06]`

---

## Modified Files

### `components/canvas/MoneyNode.tsx`

**Header layout change** (line ~246):
```
Before:  [ NodeBadge ]                    [ + button ]
After:   [ NodeBadge ]    [ NodeTotalChip ] [ + button ]
```

**Store subscriptions added:**
- `settings.defaultCurrency`
- `exchangeRate.usdToToman`

**Two `useMemo` calls:**
```ts
const primaryTotal = useMemo(
  () => getNodeMonthlyTotal(data.itemIds, items, selectedMonth, defaultCurrency, usdToToman),
  [data.itemIds, items, selectedMonth, defaultCurrency, usdToToman]
);

const secondaryTotal = useMemo(
  () => getNodeMonthlyTotal(data.itemIds, items, selectedMonth, secondaryCurrency, usdToToman),
  [data.itemIds, items, selectedMonth, secondaryCurrency, usdToToman]
);
```

Where `secondaryCurrency = defaultCurrency === "TOMAN" ? "USD" : "TOMAN"`.

**Memo stability:** `items` is a Zustand array reference updated only on real mutations. Drag, zoom, and edge selection do not mutate `items`, `selectedMonth`, or currency — so neither memo fires during canvas interactions.

---

## Calculation Rules Summary

| Rule | Behaviour |
|------|-----------|
| Month scope | Only items visible in `selectedMonth` via `isItemInMonth` |
| Recursive children | Not included — direct node items only |
| Recurring before start | Excluded by `isItemInMonth` (targetMonth >= itemMonth) |
| Historical rate | `convertedAmountAtEntry` used when present; live rate fallback only |
| Zero total | Chip hidden |
| Expense sign | `-` prefix rendered by chip |
| Income / Savings / Goal sign | No prefix |

---

## Layout Safety

- Desktop: chip sits between badge and `+` button in the existing `flex items-center justify-between` row.
- Mobile: chip uses smaller text (`text-[11px]`). If the node is very narrow (200px mobile width), chip truncates gracefully — `+` button always wins space.
- Never overlaps the `+` button or overflows the node card.

---

## Performance

- Two `useMemo` per node instance.
- Dependencies are data-change-only — no firing on drag/zoom/edge selection.
- No global selector or Zustand derived state needed at this scale.

---

## Acceptance Criteria

- [ ] Each node with a non-zero current-month total shows a chip next to the `+` button.
- [ ] Chip uses `selectedMonth` only — not all-time or future projections.
- [ ] Only direct node items counted — no recursive child totals.
- [ ] Expense chips show negative; others positive.
- [ ] Recurring items excluded before their start month.
- [ ] Historical `convertedAmountAtEntry` respected.
- [ ] Primary chip uses `settings.defaultCurrency`.
- [ ] Desktop hover shows secondary currency tooltip.
- [ ] Zero total hides chip.
- [ ] Compact number format (200M T, $2.4K).
- [ ] Node headers not crowded; `+` button always accessible.
- [ ] Canvas interactions (drag, zoom, edge select) unchanged.
