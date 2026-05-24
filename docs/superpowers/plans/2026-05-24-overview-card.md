# Overview Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-width "Overview" card between the Sankey and Real Value cards in the analytics modal, showing Income / Expenses / Net metrics and a soft layered area chart with a timeframe selector.

**Architecture:** Extend `lib/analytics.ts` with a 12-point `overviewTrend` field (derived income + expense), create `components/analytics/OverviewCard.tsx` as a self-contained component with custom SVG chart helpers and Framer Motion path animations, then wire it into `AnalyticsModal.tsx`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion (already in project), custom SVG (no new dependencies)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/analytics.ts` | Modify | Add `overviewTrend` to `AnalyticsSummary`, add `deriveOverviewTrend()` |
| `components/analytics/OverviewCard.tsx` | Create | Full card — timeframe chips, metrics, SVG chart, month labels |
| `components/analytics/AnalyticsModal.tsx` | Modify | Import + insert `<OverviewCard>` between Sankey and RealValue |

---

## Task 1: Extend `lib/analytics.ts` with `overviewTrend`

**Files:**
- Modify: `lib/analytics.ts`

- [ ] **Step 1: Add `overviewTrend` to `AnalyticsSummary` type**

In `lib/analytics.ts`, add the field to the type. The existing `monthlyIncome` (6 items, used by `IncomeRhythmCard`) stays unchanged. `overviewTrend` carries 12-point arrays — one per series — used only by `OverviewCard`.

Find this block (lines 37–52):
```ts
export type AnalyticsSummary = {
  currency: AnalyticsCurrency;
  rate: number;
  flow: MoneyFlowAnalytics;
  goals: AnalyticsGoal[];
  leaks: MoneyLeak[];
  monthlyIncome: MonthlyIncome[];
  sixMonthAverage: number;
  incomeVsAveragePct: number;
  realValue: {
    tomanIncome: number;
    usdIncome: number;
    tomanGrowthPct: number;
    usdGrowthPct: number;
  };
};
```

Replace with:
```ts
export type AnalyticsSummary = {
  currency: AnalyticsCurrency;
  rate: number;
  flow: MoneyFlowAnalytics;
  goals: AnalyticsGoal[];
  leaks: MoneyLeak[];
  monthlyIncome: MonthlyIncome[];
  sixMonthAverage: number;
  incomeVsAveragePct: number;
  realValue: {
    tomanIncome: number;
    usdIncome: number;
    tomanGrowthPct: number;
    usdGrowthPct: number;
  };
  overviewTrend: {
    income: MonthlyIncome[];
    expense: MonthlyIncome[];
  };
};
```

- [ ] **Step 2: Replace `getLast6MonthLabels` with a generalized version**

Find (lines 163–169):
```ts
function getLast6MonthLabels(selectedMonth: string): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const monthStr = shiftMonth(selectedMonth, i - 5);
    const monthIndex = parseInt(monthStr.split("-")[1], 10) - 1;
    return monthAbbreviations[monthIndex];
  });
}
```

Replace with:
```ts
function getLastNMonthLabels(selectedMonth: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const monthStr = shiftMonth(selectedMonth, i - (n - 1));
    const monthIndex = parseInt(monthStr.split("-")[1], 10) - 1;
    return monthAbbreviations[monthIndex];
  });
}
```

- [ ] **Step 3: Update `deriveMonthlyIncome` to call `getLastNMonthLabels`**

Find (lines 171–176):
```ts
function deriveMonthlyIncome(currentIncome: number, selectedMonth: string) {
  const base = currentIncome || 1;
  const multipliers = [0.72, 0.84, 0.79, 0.93, 0.88, 1];
  const labels = getLast6MonthLabels(selectedMonth);
  return labels.map((label, index) => ({ label, value: base * multipliers[index] }));
}
```

Replace with:
```ts
function deriveMonthlyIncome(currentIncome: number, selectedMonth: string) {
  const base = currentIncome || 1;
  const multipliers = [0.72, 0.84, 0.79, 0.93, 0.88, 1];
  const labels = getLastNMonthLabels(selectedMonth, 6);
  return labels.map((label, index) => ({ label, value: base * multipliers[index] }));
}
```

- [ ] **Step 4: Add `deriveOverviewTrend` function**

Add this function directly below `deriveMonthlyIncome`:
```ts
function deriveOverviewTrend(incomeTotal: number, expenseTotal: number, selectedMonth: string) {
  const incomeBase = incomeTotal || 1;
  const expenseBase = expenseTotal || 1;
  const incomeMultipliers = [0.68, 0.72, 0.78, 0.84, 0.76, 0.82, 0.79, 0.93, 0.88, 0.91, 0.95, 1.0];
  const expenseMultipliers = [0.71, 0.65, 0.74, 0.68, 0.72, 0.76, 0.70, 0.78, 0.73, 0.69, 0.75, 0.62];
  const labels = getLastNMonthLabels(selectedMonth, 12);
  return {
    income: labels.map((label, i) => ({ label, value: incomeBase * incomeMultipliers[i] })),
    expense: labels.map((label, i) => ({ label, value: expenseBase * expenseMultipliers[i] })),
  };
}
```

- [ ] **Step 5: Populate `overviewTrend` in `getAnalyticsSummary`**

In `getAnalyticsSummary`, find the line `const monthlyIncome = deriveMonthlyIncome(incomeTotal, selectedMonth);` and add after it:
```ts
const overviewTrend = deriveOverviewTrend(incomeTotal, expenseTotal, selectedMonth);
```

Then add `overviewTrend` to the return statement. The existing return statement ends with `}` on the last line — add the new field before the closing brace:

Find the existing return (starts around line 195 after your edits):
```ts
  return {
    currency,
    rate,
    flow: {
```

And find its closing:
```ts
    realValue: {
      tomanIncome: currency === "TOMAN" ? incomeTotal : incomeTotal * rate,
      usdIncome: currency === "USD" ? incomeTotal : incomeTotal / rate,
      tomanGrowthPct: 40,
      usdGrowthPct: 6
    }
  };
```

Replace that closing block with:
```ts
    realValue: {
      tomanIncome: currency === "TOMAN" ? incomeTotal : incomeTotal * rate,
      usdIncome: currency === "USD" ? incomeTotal : incomeTotal / rate,
      tomanGrowthPct: 40,
      usdGrowthPct: 6
    },
    overviewTrend
  };
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors. If errors appear they will be in the next tasks' files (which don't exist yet) — that's fine for now.

- [ ] **Step 7: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat: add overviewTrend to AnalyticsSummary for Overview card"
```

---

## Task 2: Create `components/analytics/OverviewCard.tsx`

**Files:**
- Create: `components/analytics/OverviewCard.tsx`

- [ ] **Step 1: Create the file**

Create `components/analytics/OverviewCard.tsx` with the full implementation below.

Key decisions:
- `selectedMonth` is passed as a prop (available in `AnalyticsModal` from the store)
- Month labels are computed from `selectedMonth + calendarSystem` using `isoToCalendarParts` for Shamsi correctness
- SVG viewBox is `0 0 400 80`, `preserveAspectRatio="none"` — the outer container controls rendered height
- Data points are positioned at the center of equal-width month segments (`x = (i + 0.5) * VW / n`)
- Framer Motion `pathLength` animates the stroke lines; area fills fade in with opacity
- `key` on `motion.path` includes both `timeframe` and the data value so animation re-triggers on both timeframe switch and data change

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatAnalyticsAmount, type AnalyticsSummary } from "@/lib/analytics";
import { shamsiMonthAbbr, shiftMonth } from "@/lib/months";
import { isoToCalendarParts } from "@/lib/calendar";
import type { CalendarSystem } from "@/types/money";

type Timeframe = "1m" | "3m" | "6m" | "1y";
const TIMEFRAME_COUNT: Record<Timeframe, number> = { "1m": 2, "3m": 3, "6m": 6, "1y": 12 };
const GREGORIAN_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const VW = 400;
const CHART_TOP = 6;
const CHART_BOTTOM = 64;
const CHART_H = CHART_BOTTOM - CHART_TOP;

function getMonthLabels(selectedMonth: string, n: number, calendarSystem: CalendarSystem): string[] {
  return Array.from({ length: n }, (_, i) => {
    const iso = shiftMonth(selectedMonth, i - (n - 1));
    if (calendarSystem === "shamsi") {
      const parts = isoToCalendarParts(`${iso}-01`, "shamsi");
      return shamsiMonthAbbr[parts.month - 1];
    }
    return GREGORIAN_ABBR[parseInt(iso.split("-")[1], 10) - 1];
  });
}

function buildLinePath(values: number[], min: number, max: number): string {
  const span = max - min || 1;
  const n = values.length;
  const segW = VW / n;
  const pts = values.map((v, i) => ({
    x: segW * (i + 0.5),
    y: CHART_TOP + (1 - (v - min) / span) * CHART_H,
  }));
  return pts.reduce((path, pt, i) => {
    if (i === 0) return `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpX = (prev.x + (pt.x - prev.x) * 0.5).toFixed(1);
    return `${path} C${cpX},${prev.y.toFixed(1)} ${cpX},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");
}

function buildAreaPath(values: number[], min: number, max: number): string {
  return `${buildLinePath(values, min, max)} L${VW},${CHART_BOTTOM} L0,${CHART_BOTTOM} Z`;
}

export function OverviewCard({
  summary,
  calendarSystem,
  selectedMonth,
}: {
  summary: AnalyticsSummary;
  calendarSystem: CalendarSystem;
  selectedMonth: string;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("6m");
  const n = TIMEFRAME_COUNT[timeframe];

  const incomeVals = summary.overviewTrend.income.slice(-n).map((m) => m.value);
  const expenseVals = summary.overviewTrend.expense.slice(-n).map((m) => m.value);
  const labels = getMonthLabels(selectedMonth, n, calendarSystem);

  const allVals = [...incomeVals, ...expenseVals];
  const min = Math.min(...allVals) * 0.85;
  const max = Math.max(...allVals) * 1.08;

  const incomeLinePath = buildLinePath(incomeVals, min, max);
  const incomeArea = buildAreaPath(incomeVals, min, max);
  const expenseLinePath = buildLinePath(expenseVals, min, max);
  const expenseArea = buildAreaPath(expenseVals, min, max);

  const net = summary.flow.incomeTotal - summary.flow.expenseTotal;
  const netPositive = net >= 0;

  const segW = VW / n;
  const dividerXs = Array.from({ length: n - 1 }, (_, i) => segW * (i + 1));

  const chartKey = `${timeframe}-${summary.flow.incomeTotal}-${summary.flow.expenseTotal}`;

  return (
    <section className="rounded-[34px] bg-[#fffdf8] p-5 shadow-soft sm:p-6 lg:col-span-2">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[21px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Overview</h3>
        <div className="flex gap-1.5">
          {(["1m", "3m", "6m", "1y"] as Timeframe[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors duration-150 ${
                timeframe === t ? "bg-[#2f333b] text-white" : "bg-[#f4f2ee] text-[#9a958d] hover:bg-[#ede9e3]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <motion.div
          key={`income-${summary.flow.incomeTotal}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-[16px] bg-[#f7f6f3] p-3"
        >
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#a09b94]">Income</div>
          <div className="text-[18px] font-bold leading-none tracking-[-0.04em] text-[#2f333b]">
            {formatAnalyticsAmount(summary.flow.incomeTotal, summary.currency, { compact: true })}
          </div>
        </motion.div>

        <motion.div
          key={`expense-${summary.flow.expenseTotal}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-[16px] bg-[#f7f6f3] p-3"
        >
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#a09b94]">Expenses</div>
          <div className="text-[18px] font-bold leading-none tracking-[-0.04em] text-[#2f333b]">
            {formatAnalyticsAmount(summary.flow.expenseTotal, summary.currency, { compact: true })}
          </div>
        </motion.div>

        <motion.div
          key={`net-${net}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-[16px] bg-[#f7f6f3] p-3"
        >
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#a09b94]">Net</div>
          <div
            className="text-[18px] font-bold leading-none tracking-[-0.04em]"
            style={{ color: netPositive ? "#5a9e6a" : "#c47060" }}
          >
            {netPositive ? "+" : "−"}
            {formatAnalyticsAmount(Math.abs(net), summary.currency, { compact: true })}
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-[18px] bg-[#fbfaf7] px-1 pb-1 pt-2">
        <svg
          viewBox={`0 0 ${VW} 80`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height: 96 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ov-income-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a8ceb0" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#a8ceb0" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="ov-expense-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7aeb7" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#e7aeb7" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Month dividers */}
          {dividerXs.map((x) => (
            <line
              key={x}
              x1={x}
              y1={CHART_TOP}
              x2={x}
              y2={CHART_BOTTOM}
              stroke="#d8d4cc"
              strokeWidth="1"
              strokeDasharray="3,4"
            />
          ))}

          {/* Month labels */}
          {labels.map((label, i) => (
            <text
              key={label + i}
              x={segW * (i + 0.5)}
              y={78}
              textAnchor="middle"
              fontSize="8"
              fill="#b5b0aa"
              fontFamily="var(--font-sf-pro), system-ui, sans-serif"
              fontWeight="600"
            >
              {label}
            </text>
          ))}

          {/* Income area */}
          <motion.path
            key={`ia-${chartKey}`}
            d={incomeArea}
            fill="url(#ov-income-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />

          {/* Income line */}
          <motion.path
            key={`il-${chartKey}`}
            d={incomeLinePath}
            fill="none"
            stroke="#a8ceb0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />

          {/* Expense area */}
          <motion.path
            key={`ea-${chartKey}`}
            d={expenseArea}
            fill="url(#ov-expense-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          />

          {/* Expense line */}
          <motion.path
            key={`el-${chartKey}`}
            d={expenseLinePath}
            fill="none"
            stroke="#e7aeb7"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex items-center gap-3.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9a958d]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#a8ceb0]" />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9a958d]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#e7aeb7]" />
          Expenses
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/analytics/OverviewCard.tsx
git commit -m "feat: add OverviewCard with area chart and timeframe chips"
```

---

## Task 3: Wire `OverviewCard` into `AnalyticsModal.tsx`

**Files:**
- Modify: `components/analytics/AnalyticsModal.tsx`

- [ ] **Step 1: Add the import**

In `components/analytics/AnalyticsModal.tsx`, find the block of analytics imports:
```ts
import { GoalsProgressCard } from "@/components/analytics/GoalsProgressCard";
import { IncomeRhythmCard } from "@/components/analytics/IncomeRhythmCard";
import { MoneyFlowReplay } from "@/components/analytics/MoneyFlowReplay";
import { MoneyLeaksCard } from "@/components/analytics/MoneyLeaksCard";
import { RealValueCard } from "@/components/analytics/RealValueCard";
```

Replace with:
```ts
import { GoalsProgressCard } from "@/components/analytics/GoalsProgressCard";
import { IncomeRhythmCard } from "@/components/analytics/IncomeRhythmCard";
import { MoneyFlowReplay } from "@/components/analytics/MoneyFlowReplay";
import { MoneyLeaksCard } from "@/components/analytics/MoneyLeaksCard";
import { OverviewCard } from "@/components/analytics/OverviewCard";
import { RealValueCard } from "@/components/analytics/RealValueCard";
```

- [ ] **Step 2: Insert `<OverviewCard>` between Sankey and Real Value**

Find:
```tsx
<div className="grid grid-cols-1 gap-4 pb-2 lg:grid-cols-2">
  <MoneyFlowReplay summary={summary} />
  <RealValueCard summary={summary} />
```

Replace with:
```tsx
<div className="grid grid-cols-1 gap-4 pb-2 lg:grid-cols-2">
  <MoneyFlowReplay summary={summary} />
  <OverviewCard summary={summary} calendarSystem={calendarSystem} selectedMonth={selectedMonth} />
  <RealValueCard summary={summary} />
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Start dev server and verify visually**

```bash
npm run dev
```

Open the app, click the analytics button. Confirm:
- Overview card appears between Money Flow and Real Value
- Three metric chips show Income / Expenses / Net
- Net is green when income > expenses, warm red when expenses > income
- Area chart renders with two soft curves and dashed month dividers
- Timeframe chips (1m / 3m / 6m / 1y) switch the chart window
- Switching chip triggers the path-draw animation
- Currency toggle (Toman ↔ USD) updates all three metric values
- If calendar is set to Shamsi, month labels show Far/Ord/Kho/... etc.
- Existing cards (Money Flow, Real Value, Goals, Money Leaks, Income Rhythm) are untouched

- [ ] **Step 5: Commit**

```bash
git add components/analytics/AnalyticsModal.tsx
git commit -m "feat: wire OverviewCard into analytics modal"
```
