# Percentage-Based Amount Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle `fixed ▼ / % ▼` toggle badge inside the amount input so users can enter an amount as a percentage of total monthly income; the calculated result is stored as a snapshot.

**Architecture:** Four files change. `types/money.ts` gains 3 optional fields on `MoneyItem`. `store/moneyMapStore.ts` gains matching fields on `AddPayload` and passes them through in both `addItemFromForm` and `updateItemFromForm`. A new pure function `lib/percentageAmount.ts` calculates the amount. `FormControls.tsx` wraps `AmountInput` with a mode badge. `QuickAddModal.tsx` owns the `inputMode` state, preview memo, and updated submit logic.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS, Zustand 5, @xyflow/react

---

### Task 1: Extend MoneyItem type and AddPayload

**Files:**
- Modify: `types/money.ts`
- Modify: `store/moneyMapStore.ts`

- [ ] **Step 1: Add three optional fields to MoneyItem**

In `types/money.ts`, find the `MoneyItem` interface. After the `category?: GoalCategory;` line add:

```ts
  inputMode?: "fixed" | "percentage";
  percentageValue?: number;
  baseAmountSnapshot?: number;
```

Full interface after change:
```ts
export interface MoneyItem {
  id: string;
  title: string;
  type: MoneyNodeType;
  amount?: MoneyAmount;
  date?: string;
  note?: string;
  recurrence?: RecurrenceType;
  parentId?: string;
  targetAmount?: MoneyAmount;
  category?: GoalCategory;
  inputMode?: "fixed" | "percentage";
  percentageValue?: number;
  baseAmountSnapshot?: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add three optional fields to AddPayload**

In `store/moneyMapStore.ts`, find the `type AddPayload = {` block (around line 28). After `rateSource?: import("@/types/money").RateSource;` add:

```ts
  inputMode?: "fixed" | "percentage";
  percentageValue?: number;
  baseAmountSnapshot?: number;
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add types/money.ts store/moneyMapStore.ts
git commit -m "feat(percentage): extend MoneyItem and AddPayload with percentage fields"
```

---

### Task 2: Create calculatePercentageAmount lib

**Files:**
- Create: `lib/percentageAmount.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/percentageAmount.ts
import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import type { Currency, MoneyFlowNode, MoneyItem } from "@/types/money";

export interface PercentageResult {
  amount: number;        // calculated amount, e.g. 60_000_000
  baseSnapshot: number;  // total income base used, e.g. 200_000_000
}

/**
 * Calculate an amount as a percentage of total income for the given month.
 * Always uses ALL income-type nodes as the base.
 * Returns { amount: 0, baseSnapshot: 0 } when no income exists for the month.
 */
export function calculatePercentageAmount(
  pct: number,
  month: string,                  // "YYYY-MM" — from date.slice(0, 7)
  currency: Currency,
  nodes: MoneyFlowNode[],
  items: MoneyItem[],
  usdToToman: number | null
): PercentageResult {
  const incomeNodes = nodes.filter((n) => n.data.type === "income");
  const baseSnapshot = incomeNodes.reduce(
    (sum, n) => sum + getNodeMonthlyTotal(n.data.itemIds, items, month, currency, usdToToman),
    0
  );
  if (baseSnapshot === 0) return { amount: 0, baseSnapshot: 0 };
  const amount = Math.round((pct / 100) * baseSnapshot);
  return { amount, baseSnapshot };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/percentageAmount.ts
git commit -m "feat(percentage): add calculatePercentageAmount pure function"
```

---

### Task 3: Add mode badge to AmountInput in FormControls.tsx

**Files:**
- Modify: `components/quick-add/FormControls.tsx`

- [ ] **Step 1: Read the current AmountInput**

Read `components/quick-add/FormControls.tsx` lines 136–179 to confirm current props and return.

- [ ] **Step 2: Replace AmountInput with the badged version**

Find the entire `export function AmountInput` block (lines 136–179) and replace it with:

```tsx
export function AmountInput({
  currency,
  value,
  onValueChange,
  resetKey,
  mode = "fixed",
  onModeChange,
}: {
  currency: Currency;
  value: number;
  onValueChange: (value: number) => void;
  resetKey: number;
  mode?: "fixed" | "percentage";
  onModeChange?: (mode: "fixed" | "percentage") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState("");
  const [pctDisplay, setPctDisplay] = useState("");

  // Sync fixed-amount display
  useEffect(() => {
    if (mode === "fixed") {
      setDisplay(value ? formatAmountDisplay(String(value), currency) : "");
    }
  }, [currency, resetKey, value, mode]);

  // Sync percentage display
  useEffect(() => {
    if (mode === "percentage") {
      setPctDisplay(value ? String(value) : "");
    }
  }, [value, resetKey, mode]);

  const badgeBase =
    "absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-full px-3 text-[12px] font-bold flex items-center gap-1 transition select-none";
  const badgeFixed =
    `${badgeBase} bg-[#f0ede8] text-[#9a9da9] hover:bg-[#e8e4dc] hover:text-[#6b6860]`;
  const badgePct =
    `${badgeBase} bg-[#fff1d7] text-[#a16325] hover:bg-[#fde8b8]`;

  const sharedInputClass =
    "h-12 w-full rounded-full bg-[#fbfaf7] pl-4 pr-[86px] text-[16px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";

  return (
    <div className="relative">
      {mode === "percentage" ? (
        <input
          className={sharedInputClass}
          inputMode="numeric"
          name="amountDisplay"
          placeholder="30"
          value={pctDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            setPctDisplay(raw);
            onValueChange(raw === "" ? 0 : parseInt(raw, 10));
          }}
          required
        />
      ) : (
        <input
          ref={inputRef}
          className={sharedInputClass}
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
      )}
      {onModeChange && (
        <button
          type="button"
          className={mode === "percentage" ? badgePct : badgeFixed}
          onClick={() => onModeChange(mode === "fixed" ? "percentage" : "fixed")}
          aria-label={mode === "percentage" ? "Switch to fixed amount" : "Switch to percentage"}
        >
          {mode === "percentage" ? "%" : "fixed"}
          <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/quick-add/FormControls.tsx
git commit -m "feat(percentage): add mode badge to AmountInput (fixed/% toggle)"
```

---

### Task 4: Wire percentage mode into QuickAddModal

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

- [ ] **Step 1: Read QuickAddModal**

Read `components/quick-add/QuickAddModal.tsx` to confirm current imports, state declarations, and submit function.

- [ ] **Step 2: Add imports**

Add `calculatePercentageAmount` and `PercentageResult` import at the top with other imports:

```ts
import { calculatePercentageAmount, type PercentageResult } from "@/lib/percentageAmount";
```

Also add `formatPrimaryAmount` if not already imported (it is — line 8 of the file).

- [ ] **Step 3: Add store subscriptions for percentage calculation**

Inside `CanvasInner` / the modal component, after the existing store subscriptions (around line 83–88), add:

```ts
const nodes = useMoneyMapStore((state) => state.nodes);
const items = useMoneyMapStore((state) => state.items);
const usdToToman = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
```

- [ ] **Step 4: Add inputMode state**

After the existing `useState` declarations (around line 104), add:

```ts
const [inputMode, setInputMode] = useState<"fixed" | "percentage">("fixed");
```

- [ ] **Step 5: Reset inputMode when the modal resets**

Find the reset block that contains `setAmount(0)` (around line 115). Add `setInputMode("fixed");` on the line after `setAmount(0)`:

```ts
setAmount(0);
setInputMode("fixed");
```

- [ ] **Step 6: Add pctPreview memo**

After the existing `useMemo`/`useEffect` hooks (before the `submit` function, around line 120), add:

```ts
const pctPreview = useMemo((): PercentageResult | null => {
  if (inputMode !== "percentage" || !activeType || activeType === "bucket" || activeType === "income") return null;
  if (!amount) return null;
  return calculatePercentageAmount(
    amount,
    date.slice(0, 7),
    currency,
    nodes,
    items,
    usdToToman
  );
}, [inputMode, amount, date, currency, nodes, items, usdToToman, activeType]);
```

- [ ] **Step 7: Modify the submit function**

Find `function submit(event: FormEvent<HTMLFormElement>)`. Inside it, find the `const payload = {` block (around line 198).

Replace the `amount:` and `targetAmount:` lines and add the new fields at the end of the payload. Here is the modified payload block — find the existing `const payload = {` and replace the entire object literal:

```ts
const isPercentageMode =
  inputMode === "percentage" &&
  activeType !== "bucket" &&
  activeType !== "income" &&
  pctPreview !== null &&
  pctPreview.baseSnapshot > 0;

const resolvedAmount = isPercentageMode ? pctPreview!.amount : amount;

const payload = {
  type: activeType,
  title,
  amount: activeType === "bucket" ? undefined : (activeType === "goal" ? undefined : resolvedAmount),
  targetAmount: activeType === "goal" ? resolvedAmount : undefined,
  currency,
  date,
  note: String(form.get("note") ?? ""),
  recurrence: activeType === "goal" ? "none" : recurrence,
  parentNodeId: parentNodeId || undefined,
  category: activeType === "goal" ? goalCategory : undefined,
  rateOverride: effectiveRate,
  rateSource: effectiveRateSource,
  inputMode: isPercentageMode ? ("percentage" as const) : undefined,
  percentageValue: isPercentageMode ? amount : undefined,
  baseAmountSnapshot: isPercentageMode ? pctPreview!.baseSnapshot : undefined,
};
```

Also update the `saveAmountSuggestion` call above the payload — wrap it to skip in percentage mode:

Find:
```ts
if (title && amount && activeType !== "bucket") {
  saveAmountSuggestion(title, amount);
}
```

Replace with:
```ts
if (title && amount && activeType !== "bucket" && inputMode === "fixed") {
  saveAmountSuggestion(title, amount);
}
```

- [ ] **Step 8: Wire mode badge into the AmountInput element**

Find the `<AmountInput` JSX (around line 280). Change it to pass mode props:

```tsx
<AmountInput
  currency={currency}
  value={amount}
  onValueChange={setAmount}
  resetKey={resetKey}
  mode={inputMode}
  onModeChange={(newMode) => {
    setInputMode(newMode);
    setAmount(0);
    setResetKey((k) => k + 1);
  }}
/>
```

- [ ] **Step 9: Add percentage preview row**

Find the `<SuggestionChips` block (around line 287). Replace the entire `<SuggestionChips .../>` element with:

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
{inputMode === "percentage" && (
  <div className="flex items-center gap-2 rounded-[14px] bg-[#f7f5ef] px-4 py-3 text-[13px] border border-[#ede9de]">
    {pctPreview && pctPreview.baseSnapshot > 0 ? (
      <>
        <span className="font-semibold text-[#2f333b]">
          {amount}% of {formatPrimaryAmount({ amount: pctPreview.baseSnapshot, currency })}
        </span>
        <span className="font-bold text-[#c9b89a] mx-1">=</span>
        <span className="font-bold text-[#2d7f36]">
          {formatPrimaryAmount({ amount: pctPreview.amount, currency })}
        </span>
      </>
    ) : (
      <span className="text-[#a16325]">No income recorded for this month</span>
    )}
  </div>
)}
```

- [ ] **Step 10: Disable submit when no income in % mode**

Find the submit `<button type="submit" ...>` (around line 364). Add `disabled` prop and opacity class:

```tsx
<button
  type="submit"
  disabled={
    inputMode === "percentage" &&
    (!pctPreview || pctPreview.baseSnapshot === 0)
  }
  className={`h-13 w-full rounded-full px-5 py-3.5 text-[16px] font-semibold transition active:scale-[0.99] ${submitButtonClass(activeType)} disabled:opacity-40 disabled:cursor-not-allowed`}
>
  {editItemId ? copy.submit.replace("Add", "Save") : copy.submit}
</button>
```

- [ ] **Step 11: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx
git commit -m "feat(percentage): wire percentage mode into QuickAddModal with preview"
```

---

### Task 5: Persist percentage fields in the store

**Files:**
- Modify: `store/moneyMapStore.ts`

- [ ] **Step 1: Pass new fields through in addItemFromForm**

In `store/moneyMapStore.ts`, find the `const item: MoneyItem = {` block inside `addItemFromForm` (around line 187). After the `category: payload.type === "goal" ? payload.category : undefined,` line, add:

```ts
        inputMode: payload.inputMode,
        percentageValue: payload.percentageValue,
        baseAmountSnapshot: payload.baseAmountSnapshot,
```

Full item block after change:
```ts
      const item: MoneyItem = {
        id: createId("item"),
        title: payload.title,
        type: payload.type,
        amount: moneyAmount,
        targetAmount,
        date: payload.date,
        note: payload.note,
        recurrence: payload.recurrence ?? "none",
        parentId: payload.parentNodeId,
        category: payload.type === "goal" ? payload.category : undefined,
        inputMode: payload.inputMode,
        percentageValue: payload.percentageValue,
        baseAmountSnapshot: payload.baseAmountSnapshot,
        createdAt: now,
        updatedAt: now,
      };
```

- [ ] **Step 2: Pass new fields through in updateItemFromForm**

In `updateItemFromForm` (around line 276), find the item map callback. After `category: payload.type === "goal" ? payload.category : undefined,` (around line 288), add:

```ts
                  inputMode: payload.inputMode,
                  percentageValue: payload.percentageValue,
                  baseAmountSnapshot: payload.baseAmountSnapshot,
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add store/moneyMapStore.ts
git commit -m "feat(percentage): persist inputMode, percentageValue, baseAmountSnapshot in store"
```
