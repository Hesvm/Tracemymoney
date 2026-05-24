# Overview Card — Design Spec
**Date:** 2026-05-24

## Goal

Add a full-width "Overview" card directly below the Money Flow (Sankey) card in the analytics modal. It answers "did I earn more than I spent?" through a soft visual area chart — calm, minimal, premium. No spreadsheet feel.

---

## Layout Placement

Grid order after this change:

```
[ Full width ]  Money Flow (Sankey)       — existing, untouched
[ Full width ]  Overview                  — NEW
[ Half ][ Half ] Real Value | Goals       — existing, untouched
[ Half ][ Half ] Money Leaks | Income Rhythm — existing, untouched
```

In `AnalyticsModal.tsx`, insert `<OverviewCard>` between `<MoneyFlowReplay>` and `<RealValueCard>` inside the existing `grid grid-cols-1 gap-4 pb-2 lg:grid-cols-2` container. The card uses `lg:col-span-2` to span full width, matching `MoneyFlowReplay`.

---

## Component

**File:** `components/analytics/OverviewCard.tsx`

**Props:**
```ts
{ summary: AnalyticsSummary; calendarSystem: "gregorian" | "shamsi" }
```

`calendarSystem` is already available in `AnalyticsModal` from the store — pass it through.

---

## Card Structure

```
╭────────────────────────────────────────╮
│  Overview              [ 1m ][ 3m ][ 6m ][ 1y ]  │
│                                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Income   │ │ Expenses │ │  Net   │ │
│  │ 840M T   │ │ 520M T   │ │ +320M  │ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                        │
│  [soft area chart with month dividers] │
│                                        │
│  ● Income  ● Expenses                  │
╰────────────────────────────────────────╯
```

### Metrics row
- **Income** — `summary.flow.incomeTotal` in selected currency
- **Expenses** — `summary.flow.expenseTotal` in selected currency
- **Net** — `incomeTotal - expenseTotal`
  - Positive: `#5a9e6a` (soft green)
  - Negative: `#c47060` (muted warm red)
- Values formatted with `formatAnalyticsAmount(value, currency, { compact: true })`

### Timeframe chips
- Options: `1m`, `3m`, `6m`, `1y`
- Default active: `6m`
- Local state in the component (`useState<"1m" | "3m" | "6m" | "1y">`)
- Controls how many data points the chart renders (2, 3, 6, or 12 months — `1m` uses last 2 points so a curve is drawable)
- Metrics row always shows the **current selected month** regardless of timeframe — the chip only changes the chart window

---

## Chart

**Technique:** Custom SVG — no new dependencies.

**Two areas:**
- Income — stroke `#a8ceb0`, fill gradient `#a8ceb0` → transparent
- Expenses — stroke `#e7aeb7`, fill gradient `#e7aeb7` → transparent
- Smooth cubic Bézier curves (`C` path commands)
- Semi-transparent fills (opacity 0.48 → 0.03)

**Month dividers:** Soft dashed vertical lines (`stroke-dasharray="3,4"`, color `#d8d4cc`) dividing the chart into equal segments. Month labels centered in each segment at the bottom.

**Month label language:**
- `calendarSystem === "gregorian"` → abbreviated English month names (`Jan` … `Dec`)
- `calendarSystem === "shamsi"` → abbreviated Shamsi month names (فرو، ارد، خرد، تیر، مرد، شهر، مهر، آبا، آذر، دی، بهم، اسف)

---

## Data

### Analytics lib additions (`lib/analytics.ts`)

Add `deriveMonthlyExpense(expenseTotal, selectedMonth)` — mirrors the existing `deriveMonthlyIncome` pattern exactly: applies hardcoded multipliers to `expenseTotal` to produce a **12-month** simulated trend array. `deriveMonthlyIncome` must also be updated to produce 12 points (it currently produces 6). The chart slices the last N months based on the selected timeframe.

Add `monthlyExpense: MonthlyIncome[]` to `AnalyticsSummary` (reuse the `MonthlyIncome` type — same shape).

Populate it in `getAnalyticsSummary`.

The chart trims the arrays to the selected timeframe count before rendering (1, 3, 6, or 12 points).

---

## Styling

Matches existing card aesthetic:

| Property | Value |
|---|---|
| Background | `#fffdf8` |
| Border radius | `rounded-[34px]` |
| Shadow | `shadow-soft` |
| Padding | `p-5 sm:p-6` |
| Title | `text-[21px] font-semibold tracking-[-0.03em] text-[#2f333b]` |
| Metric chip bg | `bg-[#f7f6f3]` rounded-[16px] |
| Chart bg | `bg-[#fbfaf7]` rounded-[18px] |
| Font | SF Pro Display (inherited via CSS var) |

---

## Motion

Using Framer Motion (already a project dependency):

- Metric values: animate with `useSpring` or a simple `animate` on number change (250ms)
- Chart paths: `initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}` on mount; re-trigger on timeframe change via a key prop
- Chip switch: instant, no animation needed — the chart transition carries the feedback

---

## Currency Toggle

The card receives `summary` which is already currency-aware — no extra work needed. When the user toggles Toman ↔ USD in the analytics header, `AnalyticsModal` recomputes `summary` and passes updated values down. The card re-renders naturally.

---

## Files Changed

| File | Change |
|---|---|
| `lib/analytics.ts` | Add `deriveMonthlyExpense()`, add `monthlyExpense` to `AnalyticsSummary` |
| `components/analytics/OverviewCard.tsx` | New component |
| `components/analytics/AnalyticsModal.tsx` | Import + insert `<OverviewCard>` between Sankey and RealValue; pass `calendarSystem` |

---

## Out of Scope

- Real per-month historical storage (expense trend is derived/simulated, same as income trend)
- Tooltip on chart hover (can be added later)
- Responsive mobile layout changes beyond what `lg:col-span-2` already handles
