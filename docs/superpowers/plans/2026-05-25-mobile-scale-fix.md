# Mobile Scale, Ratios, and Overflow Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile-specific layout scale, overflow, and proportion issues without touching the desktop experience.

**Architecture:** All mobile rules go behind responsive breakpoints (`sm:` for modals/nav, `md:` for node width). We use a 200px mobile node width (vs 430px desktop) and a smaller canvas fitView padding so nodes appear larger. The analytics header gets a 3-row stacked layout on mobile (title+close / currency toggle / month nav) keeping the 3-column grid on desktop. QuickAddModal amount+currency fields stack vertically on mobile.

**Tech Stack:** React 19, Next.js 15, Tailwind 3, `@xyflow/react` 12, framer-motion 11.

---

## Files Modified

| File | Change |
|------|--------|
| `app/globals.css` | Add `overflow-x: hidden` to html/body |
| `components/canvas/MoneyNode.tsx` | 200px width + compact typography on mobile |
| `components/canvas/MoneyCanvas.tsx` | Tighter fitView padding (0.05) + viewport nudge for bottom-nav asymmetry |
| `components/analytics/AnalyticsHeader.tsx` | 3-row stacked layout on mobile, 3-col grid on desktop |
| `components/analytics/CurrencyPerspectiveToggle.tsx` | Accept optional `compact` prop for mobile analytics row |
| `components/quick-add/QuickAddModal.tsx` | Single-column amount/currency on mobile, smaller modal padding/title |
| `components/navigation/BottomNav.tsx` | `max-w-[calc(100vw-16px)]` overflow guard |
| `components/navigation/TopBrandBar.tsx` | `max-w-[calc(100vw-32px)]` overflow guard |

---

### Task 1: Global overflow prevention

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add overflow-x hidden**

Open `app/globals.css`. The `html, body` block is at line 58. Change it to:

```css
html,
body {
  min-height: 100%;
  overscroll-behavior: none;
  overflow-x: hidden;
}
```

- [ ] **Step 2: Verify — no desktop regression**

Run `npm run build` and check for errors:
```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "fix(mobile): prevent horizontal overflow on html/body"
```

---

### Task 2: MoneyNode mobile scale

**Files:**
- Modify: `components/canvas/MoneyNode.tsx`

The node `<article>` is at line 226. Make every responsive change below. The goal: 200px node on mobile, 430px on desktop; proportionally smaller internals.

- [ ] **Step 1: Shrink node container**

In the `<article>` className (line 226), change:
- `w-[280px] md:w-[430px]` → `w-[200px] md:w-[430px]`
- `rounded-[28px]` → `rounded-[20px] md:rounded-[28px]`
- `px-4 pb-5 pt-4 md:px-5 md:pb-6 md:pt-5` → `px-3 pb-4 pt-3 md:px-5 md:pb-6 md:pt-5`

The full article open tag becomes:
```tsx
<article
  className={`money-node group w-[200px] md:w-[430px] rounded-[20px] md:rounded-[28px] bg-white/95 px-3 pb-4 pt-3 md:px-5 md:pb-6 md:pt-5 shadow-soft backdrop-blur transition ${
    isFocused ? "ring-4 ring-[#d8cdb9]/70" : ""
  } ${selected ? "money-node-selected" : ""}`}
```

- [ ] **Step 2: Shrink header row**

At line 246, change `mb-6` → `mb-3 md:mb-6`:
```tsx
<div className="mb-3 md:mb-6 flex items-center justify-between">
```

- [ ] **Step 3: Shrink NodeBadge**

In `NodeBadge` (line 35), change:
- `h-8` → `h-6 md:h-8`
- `text-[14px]` → `text-[11px] md:text-[14px]`
- `px-2.5` → `px-2 md:px-2.5`
- `gap-1.5` → `gap-1 md:gap-1.5`
- Inner icon span: `size-5` → `size-4 md:size-5`
- Inner icon: `size-3.5` → `size-3 md:size-3.5`

The full NodeBadge `div` becomes:
```tsx
<div className={`inline-flex h-6 md:h-8 items-center gap-1 md:gap-1.5 rounded-full px-2 md:px-2.5 text-[11px] md:text-[14px] ${nodeStyles[type].pill}`}>
  {type === "savings" && (
    <span className="grid size-4 md:size-5 place-items-center overflow-hidden rounded-full bg-white/70">
      <Image src="/icons/savings-piggy.webp" alt="" width={20} height={20} className="size-4 md:size-5 object-cover" aria-hidden="true" />
    </span>
  )}
  {type !== "bucket" && type !== "savings" && (
    <span className={`grid size-4 md:size-5 place-items-center rounded-full ${nodeStyles[type].iconBg}`}>
      <Icon className="size-3 md:size-3.5 text-white" strokeWidth={2.4} />
    </span>
  )}
  <span className="font-serif italic leading-none">{title}</span>
</div>
```

- [ ] **Step 4: Shrink plus button**

At line 248, change `size-8` → `size-7 md:size-8` and `size-5` → `size-4 md:size-5`:
```tsx
<button
  className="nodrag grid size-7 md:size-8 place-items-center rounded-full bg-[#f7f6f3] text-[#9a9da9] transition hover:bg-[#efeee9] active:scale-95"
  aria-label={`Add to ${data.title}`}
  onClick={() => setPendingAddNode(id)}
>
  <Plus className="size-4 md:size-5" strokeWidth={2.2} />
</button>
```

- [ ] **Step 5: Shrink MoneyRow typography and layout**

In `MoneyRow` (line 71), change the `<motion.li>` className:
- `gap-7` → `gap-3 md:gap-7`
- `rounded-[14px]` → `rounded-[10px] md:rounded-[14px]`
- `px-2 py-1.5 -mx-2` → `px-1.5 py-1 -mx-1.5 md:px-2 md:py-1.5 md:-mx-2`

Primary text (line 84): `text-[17px]` → `text-[13px] md:text-[17px]`
Secondary text (line 90 italic): `text-[13px]` → `text-[11px] md:text-[13px]`
Date col (line 100): `text-[11px]` → `text-[10px] md:text-[11px]`

Full `MoneyRow` `<motion.li>`:
```tsx
<motion.li
  className="nodrag grid grid-cols-[1fr_auto] gap-3 md:gap-7 rounded-[10px] md:rounded-[14px] px-1.5 py-1 -mx-1.5 md:px-2 md:py-1.5 md:-mx-2 transition hover:bg-[#fbfaf7]"
  ...
>
  <div className="min-w-0">
    <div className="truncate text-[13px] md:text-[17px] font-semibold leading-[1.15] tracking-[-0.01em] text-[#2f333b]">
```

The `motion.div` converted amount stays at `text-[13px]` → `text-[11px] md:text-[13px]`.

The right date `div` (line 100):
```tsx
<div className="pt-1 text-right text-[10px] md:text-[11px] leading-none text-[#868b9b]">
```

- [ ] **Step 6: Shrink empty / no-items states**

At line 258 (collapsed state `li`) and line 287 (no-items `motion.li`), change `text-[14px]` → `text-[12px] md:text-[14px]` and `px-4 py-3` → `px-3 py-2 md:px-4 md:py-3` and `rounded-[18px]` → `rounded-[14px] md:rounded-[18px]`:

```tsx
<li className="rounded-[14px] md:rounded-[18px] bg-[#fbfaf7] px-3 py-2 md:px-4 md:py-3 text-[12px] md:text-[14px] font-medium text-[#9a958d]">
  {nodeItems.length} item{nodeItems.length === 1 ? "" : "s"} hidden
</li>
```

```tsx
<motion.li
  key="no-items"
  ...
  className="rounded-[14px] md:rounded-[18px] bg-[#fbfaf7] px-3 py-2 md:px-4 md:py-3 text-[12px] md:text-[14px] font-medium text-[#9a958d]"
>
  No items this month
</motion.li>
```

- [ ] **Step 7: Commit**

```bash
git add components/canvas/MoneyNode.tsx
git commit -m "fix(mobile): compact MoneyNode scale — 200px width, smaller typography"
```

---

### Task 3: Canvas mobile fitView improvement

**Files:**
- Modify: `components/canvas/MoneyCanvas.tsx`

The mobile fitView effect is at lines 182–190. Two problems:
1. `padding: 0.12` is too generous — zooms out too far. Lower = tighter crop = larger nodes.
2. Nodes end up centered in the full viewport height, but the bottom nav covers ~90px, pushing the visual center up. We nudge the viewport down by ~30px after fitView.

- [ ] **Step 1: Tighten fitView padding and add nudge**

Replace the `useEffect` at lines 182–190:
```tsx
useEffect(() => {
  if (isMobile && !didFitMobile.current) {
    didFitMobile.current = true;
    const timer = setTimeout(() => {
      reactFlow.fitView({ padding: 0.04, duration: 0 });
      // Nudge up to compensate: bottom nav (~90px) is taller than top bar (~52px),
      // so the visual center is ~20px above the mathematical center.
      window.requestAnimationFrame(() => {
        const vp = reactFlow.getViewport();
        reactFlow.setViewport({ ...vp, y: vp.y + 20 }, { duration: 0 });
      });
    }, 120);
    return () => clearTimeout(timer);
  }
}, [isMobile, reactFlow]);
```

- [ ] **Step 2: Update focusNode center for narrower mobile nodes**

The `setCenter` call at line 197 uses a fixed x-offset of `165` (half of 330px, approximately half of old 280px node). With 200px nodes, the center is at `100`. But since this fires on all screen sizes, use the node's actual width from the DOM, or just pick a middle ground. Change `165` → `130` and `120` → `100` (the y center depends on content, but this is acceptable):

```tsx
void reactFlow.setCenter(node.position.x + 130, node.position.y + 100, {
  zoom: 1.05,
  duration: 420
});
```

- [ ] **Step 3: Commit**

```bash
git add components/canvas/MoneyCanvas.tsx
git commit -m "fix(mobile): tighten fitView padding and nudge viewport for bottom nav"
```

---

### Task 4: Analytics Header mobile stacked layout

**Files:**
- Modify: `components/analytics/AnalyticsHeader.tsx`

Currently the header is a 3-column grid that tries to put title / currency-toggle / month+close in one row. On mobile the middle and right columns overflow. Fix: on mobile use 3 stacked rows; on desktop keep the 3-col grid. Duplicate the close button (one mobile-only, one desktop-only) using `sm:hidden` / `hidden sm:grid`.

- [ ] **Step 1: Rewrite AnalyticsHeader**

Replace the entire file content of `components/analytics/AnalyticsHeader.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CurrencyPerspectiveToggle } from "@/components/analytics/CurrencyPerspectiveToggle";
import { formatMonthLabel } from "@/lib/months";
import type { AnalyticsCurrency } from "@/lib/analytics";
import type { CalendarSystem } from "@/types/money";

export function AnalyticsHeader({
  currency,
  selectedMonth,
  calendarSystem,
  onPreviousMonth,
  onNextMonth,
  onCurrencyChange,
  onClose
}: {
  currency: AnalyticsCurrency;
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrencyChange: (currency: AnalyticsCurrency) => void;
  onClose: () => void;
}) {
  const monthLabel = formatMonthLabel(selectedMonth, calendarSystem);

  const monthNav = (
    <div
      className="flex h-9 items-center gap-0.5 rounded-full bg-white px-1.5 text-[#626677] shadow-dock sm:h-10 sm:gap-1 sm:px-2"
      aria-label={`Selected month ${monthLabel}`}
    >
      <button
        type="button"
        onClick={onPreviousMonth}
        className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-7"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4 sm:size-[18px]" strokeWidth={2.4} />
      </button>
      <div className="min-w-[90px] text-center text-[12px] font-semibold sm:min-w-[122px] sm:text-[14px]">
        {monthLabel}
      </div>
      <button
        type="button"
        onClick={onNextMonth}
        className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-7"
        aria-label="Next month"
      >
        <ChevronRight className="size-4 sm:size-[18px]" strokeWidth={2.4} />
      </button>
    </div>
  );

  const closeButton = (className: string) => (
    <button
      type="button"
      onClick={onClose}
      className={`grid size-9 place-items-center rounded-full bg-white text-[#8e92a0] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-10 ${className}`}
      aria-label="Close analytics"
    >
      <X className="size-4 sm:size-5" strokeWidth={2.1} />
    </button>
  );

  return (
    <header className="sticky top-0 z-10 bg-[#fbfaf7]/95 px-4 pb-3 pt-4 backdrop-blur sm:px-7 sm:pb-4 sm:pt-5">
      {/* Row 1 (both layouts): title left, close right */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b] sm:text-[27px]">
          Analytics
        </h2>
        {/* close: shown on mobile in row 1, hidden on desktop */}
        {closeButton("sm:hidden")}
        {/* close: hidden on mobile, shown on desktop in row 1 right */}
        {closeButton("hidden sm:grid")}
      </div>

      {/* Row 2 (mobile): currency toggle centered */}
      <div className="mt-3 flex justify-center sm:hidden">
        <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
      </div>

      {/* Row 3 (mobile): month nav centered */}
      <div className="mt-2 flex justify-center sm:hidden">
        {monthNav}
      </div>

      {/* Desktop only: currency + month nav inline with title row */}
      {/* We need a second pass for desktop since the grid col 2/3 are replaced above */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:-mt-9">
        <div />
        <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
        <div className="flex items-center gap-2">
          {monthNav}
        </div>
      </div>
    </header>
  );
}
```

Wait — the desktop layout above has a visual conflict (the title div and the `sm:-mt-9` div overlap). Let me use a cleaner approach with two separate layout structures:

```tsx
"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CurrencyPerspectiveToggle } from "@/components/analytics/CurrencyPerspectiveToggle";
import { formatMonthLabel } from "@/lib/months";
import type { AnalyticsCurrency } from "@/lib/analytics";
import type { CalendarSystem } from "@/types/money";

export function AnalyticsHeader({
  currency,
  selectedMonth,
  calendarSystem,
  onPreviousMonth,
  onNextMonth,
  onCurrencyChange,
  onClose
}: {
  currency: AnalyticsCurrency;
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrencyChange: (currency: AnalyticsCurrency) => void;
  onClose: () => void;
}) {
  const monthLabel = formatMonthLabel(selectedMonth, calendarSystem);

  return (
    <header className="sticky top-0 z-10 bg-[#fbfaf7]/95 px-4 pb-3 pt-4 backdrop-blur sm:px-7 sm:pb-4 sm:pt-5">

      {/* ── Mobile layout (< sm): 3 stacked rows ── */}
      <div className="sm:hidden">
        {/* Row 1: title + close */}
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">
            Analytics
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white text-[#8e92a0] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
            aria-label="Close analytics"
          >
            <X className="size-4" strokeWidth={2.1} />
          </button>
        </div>
        {/* Row 2: currency toggle */}
        <div className="mt-3 flex justify-center">
          <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
        </div>
        {/* Row 3: month nav */}
        <div className="mt-2 flex justify-center">
          <div className="flex h-9 items-center gap-0.5 rounded-full bg-white px-1.5 text-[#626677] shadow-dock" aria-label={`Selected month ${monthLabel}`}>
            <button type="button" onClick={onPreviousMonth} className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95" aria-label="Previous month">
              <ChevronLeft className="size-4" strokeWidth={2.4} />
            </button>
            <div className="min-w-[90px] text-center text-[12px] font-semibold">{monthLabel}</div>
            <button type="button" onClick={onNextMonth} className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95" aria-label="Next month">
              <ChevronRight className="size-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop layout (≥ sm): original 3-column grid ── */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-[27px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Analytics</h2>
        </div>
        <div className="justify-self-center">
          <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex h-10 items-center gap-1 rounded-full bg-white px-2 text-[#626677] shadow-dock" aria-label={`Selected month ${monthLabel}`}>
            <button type="button" onClick={onPreviousMonth} className="grid size-7 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95" aria-label="Previous month">
              <ChevronLeft className="size-[18px]" strokeWidth={2.4} />
            </button>
            <div className="min-w-[122px] text-center text-[14px] font-semibold">{monthLabel}</div>
            <button type="button" onClick={onNextMonth} className="grid size-7 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95" aria-label="Next month">
              <ChevronRight className="size-[18px]" strokeWidth={2.4} />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-white text-[#8e92a0] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
            aria-label="Close analytics"
          >
            <X className="size-5" strokeWidth={2.1} />
          </button>
        </div>
      </div>

    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/AnalyticsHeader.tsx
git commit -m "fix(mobile): analytics header 3-row stacked layout on mobile"
```

---

### Task 5: QuickAddModal mobile scale

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

Two issues: (a) padding too large on mobile, (b) amount+currency side-by-side causes overflow on narrow screens.

- [ ] **Step 1: Reduce modal padding on mobile**

Header div (line 246) — `px-6 pt-6 pb-4` → `px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4`:
```tsx
<div className="shrink-0 flex items-center justify-between px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
```

Title (line 247) — `text-2xl` → `text-xl sm:text-2xl`:
```tsx
<h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.04em] text-[#2f333b]">
```

Scrollable fields div (line 261) — `px-6` → `px-4 sm:px-6`:
```tsx
<div className="flex-1 overflow-y-auto px-4 sm:px-6">
```

Submit area (line 361) — `px-6 pt-3 pb-6` → `px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6`:
```tsx
<div className="shrink-0 px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6">
```

- [ ] **Step 2: Stack amount + currency on mobile**

The amount+currency grid at line 277 — `grid-cols-[1fr_176px]` → `grid-cols-1 sm:grid-cols-[1fr_176px]`:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-[1fr_176px] gap-3">
  <Field label={copy.amount}>
    <AmountInput currency={currency} value={amount} onValueChange={setAmount} resetKey={resetKey} />
  </Field>
  <Field label="Currency">
    <CurrencySegmentedToggle value={currency} onChange={setCurrency} />
  </Field>
</div>
```

- [ ] **Step 3: Update max-height to 88dvh**

In the `<motion.form>` style (line 238), change `maxHeight: "85dvh"` → `maxHeight: "88dvh"`:
```tsx
style={{ maxHeight: "88dvh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
```

- [ ] **Step 4: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx
git commit -m "fix(mobile): compact QuickAddModal padding and stack amount/currency vertically"
```

---

### Task 6: BottomNav and TopBrandBar overflow guards

**Files:**
- Modify: `components/navigation/BottomNav.tsx`
- Modify: `components/navigation/TopBrandBar.tsx`

- [ ] **Step 1: BottomNav — add max-width and month-pill guard**

In `BottomNav` (line 49), add `max-w-[calc(100vw-16px)]` to the `<nav>`:
```tsx
<nav
  className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-16px)]"
  style={{ bottom: "max(28px, calc(8px + env(safe-area-inset-bottom, 0px)))" }}
  aria-label="Money map controls"
>
```

The month pill div (line 56), add `max-w-[220px] overflow-hidden`:
```tsx
<div className="flex h-11 items-center gap-1 rounded-full bg-white px-2 text-[#30333b] shadow-dock max-w-[220px] overflow-hidden">
```

- [ ] **Step 2: TopBrandBar — add max-width**

In `TopBrandBar` (line 8), add `max-w-[calc(100vw-32px)]` to the outer div:
```tsx
<div
  className="fixed left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:gap-3 rounded-full bg-white px-3 py-1.5 md:px-4 md:py-2 shadow-dock max-w-[calc(100vw-32px)]"
  style={{ top: "max(12px, calc(8px + env(safe-area-inset-top, 0px)))" }}
>
```

- [ ] **Step 3: Commit**

```bash
git add components/navigation/BottomNav.tsx components/navigation/TopBrandBar.tsx
git commit -m "fix(mobile): overflow guards for BottomNav and TopBrandBar"
```

---

### Task 7: Verify and test

- [ ] **Step 1: Run tests**

```bash
npm test
```
Expected: all existing tests pass (no layout logic in tests; the month search tests should still pass).

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Start dev server and check mobile viewport**

```bash
npm run dev
```

Open preview at 390×844 (iPhone 14 Pro). Verify:
- Canvas nodes are 200px wide and visible at reasonable zoom
- Analytics modal header: 3 rows (title+close / currency / month) with no overflow
- QuickAddModal: single-column amount/currency on mobile, compact padding
- BottomNav: no overflow
- TopBrandBar: no overflow
- No horizontal scroll on any view

- [ ] **Step 4: Check desktop at 1280×800**

All layouts must be unchanged from before:
- Analytics header: original 3-column grid
- QuickAddModal: original side-by-side amount/currency
- MoneyNode: 430px width

---

## Self-Review Checklist

### Spec Coverage

| Requirement | Task |
|-------------|------|
| Canvas nodes too small/low | Task 3 (fitView padding 0.04 + nudge) |
| Node width 190–220px on mobile | Task 2 (`w-[200px]`) |
| Analytics header clipped on mobile | Task 4 (stacked layout) |
| Currency toggle overflow | Task 4 (its own row) |
| QuickAdd modal too zoomed in | Task 5 (compact padding, title) |
| Amount+currency overflow | Task 5 (single-column) |
| No horizontal scroll | Task 1 (overflow-x: hidden) + Task 6 |
| Desktop unchanged | All tasks use `sm:` or `md:` guards |
| Bottom nav overflow | Task 6 |
| Top brand bar overflow | Task 6 |

All requirements covered.
