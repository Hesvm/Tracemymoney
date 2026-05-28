# Automatic Bucket Percentages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual "% of income" input mode with auto-calculated read-only percentages that show each item's share of its parent bucket's monthly total.

**Architecture:** A new pure helper `calculateBucketPercentages` computes a `Record<itemId, float>` map once per `MoneyNode` render via `useMemo`. Each `MoneyRow` and `GoalRow` receives its pre-calculated percentage and renders it as a small muted label. All old percentage-input UI is removed from `FormControls` and `QuickAddModal`.

**Tech Stack:** TypeScript, React, Next.js, Zustand, Vitest (for tests)

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Create | `lib/calculateBucketPercentages.ts` | New pure helper |
| Create | `tests/calculateBucketPercentages.test.ts` | Unit tests |
| Modify | `components/quick-add/FormControls.tsx` | Remove mode/onModeChange from AmountInput |
| Modify | `components/quick-add/QuickAddModal.tsx` | Remove inputMode state + pct preview UI |
| Delete | `lib/percentageAmount.ts` | Old "% of income" helper — deleted |
| Modify | `components/canvas/MoneyNode.tsx` | Add useMemo + pass bucketPct to rows |

---

## Task 1: Create `lib/calculateBucketPercentages.ts`

**Files:**
- Create: `lib/calculateBucketPercentages.ts`

- [ ] **Step 1: Write the helper**

Create `lib/calculateBucketPercentages.ts` with this exact content:

```ts
import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import { isItemInMonth } from "@/lib/months";
import type { Currency, MoneyItem } from "@/types/money";

export function calculateBucketPercentages(
  nodeItemIds: string[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): Record<string, number> {
  const total = getNodeMonthlyTotal(nodeItemIds, items, selectedMonth, currency, usdToToman);
  if (total === 0) return {};

  const result: Record<string, number> = {};
  for (const id of nodeItemIds) {
    const item = items.find((i) => i.id === id);
    if (!item || !isItemInMonth(item, selectedMonth)) continue;
    const itemAmt = getNodeMonthlyTotal([id], items, selectedMonth, currency, usdToToman);
    if (itemAmt !== 0) {
      result[id] = (itemAmt / total) * 100;
    }
  }
  return result;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors related to the new file.

---

## Task 2: Write and run tests for `calculateBucketPercentages`

**Files:**
- Create: `tests/calculateBucketPercentages.test.ts`

- [ ] **Step 1: Check test runner is available**

```bash
ls node_modules/.bin/vitest 2>/dev/null && echo "vitest found" || echo "not found"
```

If "not found": `npm add -D vitest` then add `"test": "vitest run"` to `scripts` in `package.json`.

- [ ] **Step 2: Write the test file**

Create `tests/calculateBucketPercentages.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculateBucketPercentages } from "@/lib/calculateBucketPercentages";
import type { MoneyItem } from "@/types/money";

function makeItem(id: string, amount: number, date = "2026-05-15"): MoneyItem {
  return {
    id,
    title: id,
    type: "expense",
    amount: { amount, currency: "TOMAN" },
    date,
    recurrence: "none",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("calculateBucketPercentages", () => {
  it("returns empty object for empty nodeItemIds", () => {
    expect(
      calculateBucketPercentages([], [], "2026-05", "TOMAN", null)
    ).toEqual({});
  });

  it("returns empty object when bucket total is zero", () => {
    const items = [makeItem("a", 0)];
    expect(
      calculateBucketPercentages(["a"], items, "2026-05", "TOMAN", null)
    ).toEqual({});
  });

  it("calculates correct percentages for two items", () => {
    const items = [makeItem("a", 40_000_000), makeItem("b", 60_000_000)];
    const result = calculateBucketPercentages(["a", "b"], items, "2026-05", "TOMAN", null);
    expect(result["a"]).toBeCloseTo(40);
    expect(result["b"]).toBeCloseTo(60);
  });

  it("handles a single item as 100%", () => {
    const items = [makeItem("a", 20_000_000)];
    const result = calculateBucketPercentages(["a"], items, "2026-05", "TOMAN", null);
    expect(result["a"]).toBeCloseTo(100);
  });

  it("omits items not in the selected month", () => {
    const items = [makeItem("a", 40_000_000), makeItem("b", 60_000_000, "2026-04-15")];
    const result = calculateBucketPercentages(["a", "b"], items, "2026-05", "TOMAN", null);
    expect(result["a"]).toBeCloseTo(100);
    expect(result["b"]).toBeUndefined();
  });

  it("omits items with zero amount", () => {
    const items = [makeItem("a", 40_000_000), makeItem("b", 0)];
    const result = calculateBucketPercentages(["a", "b"], items, "2026-05", "TOMAN", null);
    expect(result["a"]).toBeCloseTo(100);
    expect(result["b"]).toBeUndefined();
  });

  it("omits items with undefined amount", () => {
    const noAmt: MoneyItem = {
      id: "c",
      title: "c",
      type: "expense",
      date: "2026-05-15",
      recurrence: "none",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const items = [makeItem("a", 40_000_000), noAmt];
    const result = calculateBucketPercentages(["a", "c"], items, "2026-05", "TOMAN", null);
    expect(result["a"]).toBeCloseTo(100);
    expect(result["c"]).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
npx vitest run tests/calculateBucketPercentages.test.ts --reporter=verbose
```

Expected: 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/calculateBucketPercentages.ts tests/calculateBucketPercentages.test.ts
git commit -m "feat(percentages): add calculateBucketPercentages pure helper"
```

---

## Task 3: Remove AmountInput percentage mode from `FormControls.tsx`

**Files:**
- Modify: `components/quick-add/FormControls.tsx`

The `AmountInput` function currently has `mode` and `onModeChange` props, internal `pctDisplay` state, `menuOpen` state, `menuRef`, and a badge dropdown. All of that goes away. The function reverts to fixed-amount only.

- [ ] **Step 1: Replace the entire `AmountInput` function**

Find the function starting at `export function AmountInput({` and ending just before `export function CurrencySegmentedToggle`.

Replace with:

```ts
export function AmountInput({
  currency,
  value,
  onValueChange,
  resetKey,
}: {
  currency: Currency;
  value: number;
  onValueChange: (value: number) => void;
  resetKey: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(value ? formatAmountDisplay(String(value), currency) : "");
  }, [currency, resetKey, value]);

  const inputClass =
    "h-12 w-full rounded-full bg-[#fbfaf7] px-4 text-[16px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={inputClass}
        inputMode={currency === "USD" ? "decimal" : "numeric"}
        name="amountDisplay"
        placeholder="20,000,000"
        value={display}
        onChange={(event) => {
          const nextRaw = event.target.value;
          const caret = event.target.selectionStart ?? nextRaw.length;
          const digitsBeforeCaret = nextRaw.slice(0, caret).replace(/\D/g, "").length;
          const nextDisplay = formatAmountDisplay(nextRaw, currency);
          setDisplay(nextDisplay);
          onValueChange(parseAmount(nextDisplay, currency));
          window.requestAnimationFrame(() => {
            const nextCaret = caretFromDigitCount(nextDisplay, digitsBeforeCaret);
            inputRef.current?.setSelectionRange(nextCaret, nextCaret);
          });
        }}
        required
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors about `mode` and `onModeChange` props passed in `QuickAddModal.tsx` — that's fine, fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add components/quick-add/FormControls.tsx
git commit -m "feat(percentages): remove percentage mode toggle from AmountInput"
```

---

## Task 4: Remove percentage mode logic from `QuickAddModal.tsx`

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

Remove the following (one at a time):

- [ ] **Step 1: Remove the `percentageAmount` import**

Delete this line near the top of the file:
```ts
import { calculatePercentageAmount, type PercentageResult } from "@/lib/percentageAmount";
```

- [ ] **Step 2: Remove `inputMode` state and `pctPreview` memo**

Delete:
```ts
const [inputMode, setInputMode] = useState<"fixed" | "percentage">("fixed");
```

Delete the entire `pctPreview` useMemo block:
```ts
const pctPreview = useMemo((): PercentageResult | null => {
  if (inputMode !== "percentage" || !activeType || activeType === "bucket" || activeType === "income") return null;
  if (!amount) return null;
  return calculatePercentageAmount(amount, date.slice(0, 7), currency, nodes, items, liveRate);
}, [inputMode, amount, date, currency, nodes, items, liveRate, activeType]);
```

- [ ] **Step 3: Clean `resetForm()`**

In `resetForm()`, delete the line:
```ts
setInputMode("fixed");
```

- [ ] **Step 4: Clean `submit()`**

**a)** Remove the `isPercentageMode` block:
```ts
const isPercentageMode =
  inputMode === "percentage" &&
  activeType !== "bucket" &&
  activeType !== "income" &&
  pctPreview !== null &&
  pctPreview.baseSnapshot > 0;
```

**b)** Change the suggestion save guard from:
```ts
if (title && amount && activeType !== "bucket" && inputMode === "fixed") {
```
to:
```ts
if (title && amount && activeType !== "bucket") {
```

**c)** Remove the `resolvedAmount` line:
```ts
const resolvedAmount = isPercentageMode ? pctPreview!.amount : amount;
```

**d)** In the payload, change `amount: activeType === "bucket" ? undefined : (activeType === "goal" ? undefined : resolvedAmount)` back to using `amount`:
```ts
amount: activeType === "bucket" ? undefined : (activeType === "goal" ? undefined : amount),
```

**e)** Remove the three percentage payload fields:
```ts
inputMode: isPercentageMode ? ("percentage" as const) : undefined,
percentageValue: isPercentageMode ? amount : undefined,
baseAmountSnapshot: isPercentageMode ? pctPreview!.baseSnapshot : undefined,
```

- [ ] **Step 5: Clean the JSX**

**a)** On `<AmountInput>`, remove the `mode` and `onModeChange` props. Change:
```tsx
<AmountInput
  currency={currency}
  value={amount}
  onValueChange={setAmount}
  resetKey={resetKey}
  mode={activeType === "income" ? "fixed" : inputMode}
  onModeChange={activeType !== "income" ? (newMode) => {
    setInputMode(newMode);
    setAmount(0);
    setResetKey((k) => k + 1);
  } : undefined}
/>
```
to:
```tsx
<AmountInput
  currency={currency}
  value={amount}
  onValueChange={setAmount}
  resetKey={resetKey}
/>
```

**b)** Unwrap `SuggestionChips` from its `inputMode` guard. Change:
```tsx
{inputMode === "fixed" && (
  <SuggestionChips
    title={titleValue}
    currency={currency}
    onSelect={(v) => {
      setAmount(v);
      setResetKey((k) => k + 1);
    }}
  />
)}
```
to:
```tsx
<SuggestionChips
  title={titleValue}
  currency={currency}
  onSelect={(v) => {
    setAmount(v);
    setResetKey((k) => k + 1);
  }}
/>
```

**c)** Delete the entire percentage preview paragraph block:
```tsx
{inputMode === "percentage" && activeType !== "income" && (
  <p className="px-1 text-[12px] leading-none">
    {pctPreview && pctPreview.baseSnapshot > 0 ? (
      <span className="text-[#a8a39a]">
        {amount}% of {formatPrimaryAm...
      </span>
    ) : (
      <span className="text-[#d4a090]">No income recorded for this month</span>
    )}
  </p>
)}
```

**d)** Remove the `disabled` prop from the submit button. Change:
```tsx
disabled={
  inputMode === "percentage" &&
  (!pctPreview || pctPreview.baseSnapshot === 0)
}
```
to nothing (delete the `disabled` prop entirely, or `disabled={false}`).

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx
git commit -m "feat(percentages): remove inputMode and percentage preview from QuickAddModal"
```

---

## Task 5: Delete `lib/percentageAmount.ts`

**Files:**
- Delete: `lib/percentageAmount.ts`

- [ ] **Step 1: Delete the file**

```bash
rm lib/percentageAmount.ts
```

- [ ] **Step 2: Type-check to confirm no remaining imports**

```bash
npx tsc --noEmit
```

Expected: no errors (the only consumer was `QuickAddModal`, already cleaned in Task 4).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(percentages): delete old percentageAmount helper"
```

---

## Task 6: Add bucket percentage display to `MoneyNode.tsx`

**Files:**
- Modify: `components/canvas/MoneyNode.tsx`

- [ ] **Step 1: Add the import**

At the top of `components/canvas/MoneyNode.tsx`, add after the existing lib imports:

```ts
import { calculateBucketPercentages } from "@/lib/calculateBucketPercentages";
```

- [ ] **Step 2: Add `bucketPct` prop to `MoneyRow`**

Find the `MoneyRow` function signature:
```ts
function MoneyRow({
  item,
  nodeId,
  calendarSystem,
  animatedRate,
  rateTick
}: {
  item: MoneyItem;
  nodeId: string;
  calendarSystem: "shamsi" | "gregorian";
  animatedRate: number | null;
  rateTick: number;
})
```

Replace with:
```ts
function MoneyRow({
  item,
  nodeId,
  calendarSystem,
  animatedRate,
  rateTick,
  bucketPct,
}: {
  item: MoneyItem;
  nodeId: string;
  calendarSystem: "shamsi" | "gregorian";
  animatedRate: number | null;
  rateTick: number;
  bucketPct?: number;
})
```

- [ ] **Step 3: Add percentage label to `MoneyRow` right column**

In `MoneyRow`'s return, find the right-column div:
```tsx
<div className="pt-1 text-right text-[10px] md:text-[11px] leading-none text-[#868b9b]">
  {isRecurring ? (
    <>
      <div>{formatShortDate(item.date, calendarSystem)}</div>
      <div className="mt-0.5 italic opacity-70">↻ {recurrenceLabel[item.recurrence!]}</div>
    </>
  ) : (
    formatShortDate(item.date, calendarSystem)
  )}
</div>
```

Replace with:
```tsx
<div className="pt-1 text-right text-[10px] md:text-[11px] leading-none text-[#868b9b]">
  {isRecurring ? (
    <>
      <div>{formatShortDate(item.date, calendarSystem)}</div>
      <div className="mt-0.5 italic opacity-70">↻ {recurrenceLabel[item.recurrence!]}</div>
    </>
  ) : (
    formatShortDate(item.date, calendarSystem)
  )}
  {bucketPct !== undefined && bucketPct > 0 && (
    <div className="mt-0.5 tabular-nums" style={{ opacity: 0.55 }}>
      {bucketPct < 1 ? "<1%" : `${Math.round(bucketPct)}%`}
    </div>
  )}
</div>
```

- [ ] **Step 4: Add `bucketPct` prop to `GoalRow`**

Find `GoalRow` signature:
```ts
function GoalRow({ item, nodeId }: { item: MoneyItem; nodeId: string })
```

Replace with:
```ts
function GoalRow({ item, nodeId, bucketPct }: { item: MoneyItem; nodeId: string; bucketPct?: number })
```

- [ ] **Step 5: Add percentage label to `GoalRow` middle column**

In `GoalRow`, find the middle info column div that contains the title and amount. It looks like:

```tsx
<div>
  <div className="truncate text-[17px] font-semibold leading-none tracking-[-0.02em] text-[#2f333b]">{item.title || "Goal"}</div>
  <div className="mt-1 text-[13px] ...">
    {formatPrimaryAmount(targetAmt)}
  </div>
</div>
```

Add the percentage label after the amount div, inside the same wrapper div:
```tsx
{bucketPct !== undefined && bucketPct > 0 && (
  <div className="mt-0.5 text-[10px] tabular-nums text-[#868b9b]" style={{ opacity: 0.55 }}>
    {bucketPct < 1 ? "<1%" : `${Math.round(bucketPct)}%`}
  </div>
)}
```

- [ ] **Step 6: Add `bucketPercentages` useMemo in `MoneyNode`**

In the `MoneyNode` function body, after the existing `primaryTotal` and `secondaryTotal` useMemos, add:

```ts
const bucketPercentages = useMemo(
  () => calculateBucketPercentages(data.itemIds, items, selectedMonth, defaultCurrency, usdToToman),
  [data.itemIds, items, selectedMonth, defaultCurrency, usdToToman]
);
```

- [ ] **Step 7: Pass `bucketPct` to each row in the render**

Find where `GoalRow` is called:
```tsx
<GoalRow key={item.id} item={item} nodeId={id} />
```
Replace with:
```tsx
<GoalRow key={item.id} item={item} nodeId={id} bucketPct={bucketPercentages[item.id]} />
```

Find where `MoneyRow` is called:
```tsx
<MoneyRow
  key={item.id}
  item={item}
  nodeId={id}
  calendarSystem={calendarSystem}
  animatedRate={animatedRate}
  rateTick={rateTick}
/>
```
Replace with:
```tsx
<MoneyRow
  key={item.id}
  item={item}
  nodeId={id}
  calendarSystem={calendarSystem}
  animatedRate={animatedRate}
  rateTick={rateTick}
  bucketPct={bucketPercentages[item.id]}
/>
```

- [ ] **Step 8: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add components/canvas/MoneyNode.tsx
git commit -m "feat(percentages): show automatic bucket percentages on item rows"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run full type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run linter**

```bash
npx eslint . --max-warnings=0
```

Expected: no new warnings (fix any that appear).

- [ ] **Step 3: Run tests**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass including the new `calculateBucketPercentages` tests.

- [ ] **Step 4: Run dev server and verify visually**

```bash
npm run dev
```

Check:
- Items in expense/income/savings nodes show a small muted `%` label in the row's right column
- Items in goal nodes show a small `%` label in the middle column
- When a bucket has only one item, it shows `100%`
- When bucket total is 0, no percentage shown
- QuickAddModal no longer has the `fix/%` badge toggle
- Adding a new item works normally with fixed amount
