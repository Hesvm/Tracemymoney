# Savings Percentage Inflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Fixed/Percentage toggle to the Savings modal where "Percentage" means X% of the total money flowing into that Savings node for the selected month.

**Architecture:** A new pure helper `getBucketInflow` computes inflow by walking incoming edges from the canvas graph. The QuickAddModal gains two new local states (`inputMode`, `percentageValue`) and renders the toggle + preview only for savings. The resolved amount is stored as a snapshot alongside the raw percentage value.

**Tech Stack:** TypeScript, React (useState/useMemo/useEffect), Zustand store, existing `getNodeMonthlyTotal` helper, `formatPrimaryAmount` formatter.

---

## File Map

| File | Change |
|------|--------|
| `types/money.ts` | Add `percentageBaseType` and `percentageBaseNodeId` to `MoneyItem` |
| `store/moneyMapStore.ts` | Add same two fields to `AddPayload`; propagate in both item-creation paths |
| `lib/bucketInflow.ts` | **Create** — pure `getBucketInflow` function |
| `tests/bucketInflow.test.ts` | **Create** — plain assertion tests (no vitest) |
| `components/quick-add/QuickAddModal.tsx` | Add toggle, percentage input, preview, submit logic |

---

## Task 1: Extend Types

**Files:**
- Modify: `types/money.ts` (around line 44, after `baseAmountSnapshot`)
- Modify: `store/moneyMapStore.ts` (around line 43, after `baseAmountSnapshot`)

- [ ] **Step 1: Add two fields to `MoneyItem`**

In `types/money.ts`, the `MoneyItem` interface currently ends at `baseAmountSnapshot?: number;` (line 44). Add two lines immediately after it:

```ts
  baseAmountSnapshot?: number;
  percentageBaseType?: "bucket_inflow";
  percentageBaseNodeId?: string;
  createdAt: string;
```

- [ ] **Step 2: Add same two fields to `AddPayload`**

In `store/moneyMapStore.ts`, `AddPayload` currently ends at `baseAmountSnapshot?: number;` (line 43). Add two lines immediately after it:

```ts
  baseAmountSnapshot?: number;
  percentageBaseType?: "bucket_inflow";
  percentageBaseNodeId?: string;
};
```

- [ ] **Step 3: Propagate in `addItemFromForm`**

In `store/moneyMapStore.ts`, find the block where item fields are assembled (lines ~199–203):

```ts
        inputMode: payload.inputMode,
        percentageValue: payload.percentageValue,
        baseAmountSnapshot: payload.baseAmountSnapshot,
```

Add the two new fields immediately after `baseAmountSnapshot`:

```ts
        inputMode: payload.inputMode,
        percentageValue: payload.percentageValue,
        baseAmountSnapshot: payload.baseAmountSnapshot,
        percentageBaseType: payload.percentageBaseType,
        percentageBaseNodeId: payload.percentageBaseNodeId,
```

- [ ] **Step 4: Propagate in `updateItemFromForm`**

In `store/moneyMapStore.ts`, find the `updateItemFromForm` spread (lines ~293–297):

```ts
                  inputMode: payload.inputMode,
                  percentageValue: payload.percentageValue,
                  baseAmountSnapshot: payload.baseAmountSnapshot,
```

Add the two new fields immediately after `baseAmountSnapshot`:

```ts
                  inputMode: payload.inputMode,
                  percentageValue: payload.percentageValue,
                  baseAmountSnapshot: payload.baseAmountSnapshot,
                  percentageBaseType: payload.percentageBaseType,
                  percentageBaseNodeId: payload.percentageBaseNodeId,
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing errors unrelated to these fields).

- [ ] **Step 6: Commit**

```bash
git add types/money.ts store/moneyMapStore.ts
git commit -m "feat: add percentageBaseType/NodeId fields to MoneyItem and AddPayload"
```

---

## Task 2: Create `getBucketInflow` (TDD)

**Files:**
- Create: `tests/bucketInflow.test.ts`
- Create: `lib/bucketInflow.ts`

- [ ] **Step 1: Write the failing test file**

Create `tests/bucketInflow.test.ts` with the following content:

```ts
import { getBucketInflow } from "@/lib/bucketInflow";
import type { MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";

function makeNode(id: string, itemIds: string[]): MoneyFlowNode {
  return {
    id,
    type: "moneyNode",
    position: { x: 0, y: 0 },
    data: { type: "income", title: id, itemIds },
  } as MoneyFlowNode;
}

function makeEdge(source: string, target: string): MoneyFlowEdge {
  return { id: `${source}-${target}`, source, target } as MoneyFlowEdge;
}

function makeItem(id: string, amount: number, date = "2026-05-15"): MoneyItem {
  return {
    id,
    title: id,
    type: "income",
    amount: { amount, currency: "TOMAN" },
    date,
    recurrence: "none",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function approx(a: number, b: number, label: string) {
  if (Math.abs(a - b) > 0.01) throw new Error(`${label}: expected ~${b}, got ${a}`);
}

// No edges to target → 0
const noEdges = getBucketInflow("node-savings", [], [], [], "2026-05", "TOMAN", null);
if (noEdges !== 0) throw new Error(`no edges should return 0, got ${noEdges}`);

// Single source with two items
const nodes1 = [makeNode("node-income", ["a", "b"]), makeNode("node-savings", [])];
const edges1 = [makeEdge("node-income", "node-savings")];
const items1 = [makeItem("a", 100_000_000), makeItem("b", 70_000_000)];
approx(getBucketInflow("node-savings", nodes1, edges1, items1, "2026-05", "TOMAN", null), 170_000_000, "single source");

// Two sources
const nodes2 = [
  makeNode("node-income", ["a"]),
  makeNode("node-freelance", ["b"]),
  makeNode("node-savings", []),
];
const edges2 = [makeEdge("node-income", "node-savings"), makeEdge("node-freelance", "node-savings")];
const items2 = [makeItem("a", 100_000_000), makeItem("b", 50_000_000)];
approx(getBucketInflow("node-savings", nodes2, edges2, items2, "2026-05", "TOMAN", null), 150_000_000, "two sources");

// Item in wrong month is excluded
const nodes3 = [makeNode("node-income", ["a", "b"]), makeNode("node-savings", [])];
const edges3 = [makeEdge("node-income", "node-savings")];
const items3 = [makeItem("a", 100_000_000), makeItem("b", 50_000_000, "2026-04-15")];
approx(getBucketInflow("node-savings", nodes3, edges3, items3, "2026-05", "TOMAN", null), 100_000_000, "wrong month excluded");

// Unrelated edge (different target) is ignored
const nodes4 = [makeNode("node-income", ["a"]), makeNode("node-savings", []), makeNode("node-expense", [])];
const edges4 = [makeEdge("node-income", "node-expense")]; // edge to expense, not savings
const items4 = [makeItem("a", 100_000_000)];
approx(getBucketInflow("node-savings", nodes4, edges4, items4, "2026-05", "TOMAN", null), 0, "unrelated edge ignored");

console.log("getBucketInflow: all tests passed ✓");
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/bucketInflow.test.ts 2>&1
```

Expected: error like `Cannot find module '@/lib/bucketInflow'`.

- [ ] **Step 3: Create `lib/bucketInflow.ts`**

Create the file with this content:

```ts
import { getNodeMonthlyTotal } from "@/lib/nodeTotals";
import type { Currency, MoneyFlowEdge, MoneyFlowNode, MoneyItem } from "@/types/money";

/**
 * Returns the total money flowing INTO targetNodeId for the selected month.
 * Sums items from all direct source nodes connected via incoming edges.
 * Does NOT recurse into grandparents.
 */
export function getBucketInflow(
  targetNodeId: string,
  nodes: MoneyFlowNode[],
  edges: MoneyFlowEdge[],
  items: MoneyItem[],
  selectedMonth: string,
  currency: Currency,
  usdToToman: number | null
): number {
  const incomingSourceIds = edges
    .filter((e) => e.target === targetNodeId)
    .map((e) => e.source);

  return incomingSourceIds.reduce((sum, sourceId) => {
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return sum;
    return sum + getNodeMonthlyTotal(sourceNode.data.itemIds, items, selectedMonth, currency, usdToToman);
  }, 0);
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/bucketInflow.test.ts 2>&1
```

Expected: `getBucketInflow: all tests passed ✓`

- [ ] **Step 5: Commit**

```bash
git add lib/bucketInflow.ts tests/bucketInflow.test.ts
git commit -m "feat: add getBucketInflow helper with tests"
```

---

## Task 3: Update QuickAddModal — States, Edges, Computed Inflow

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

- [ ] **Step 1: Add import for `getBucketInflow`**

At the top of `QuickAddModal.tsx`, add after the existing `import { getHistoricalRate } from "@/lib/exchangeRates/getHistoricalRate";` line:

```ts
import { getBucketInflow } from "@/lib/bucketInflow";
```

- [ ] **Step 2: Pull `edges` from the store**

In the component body, after the existing `const nodes = useMoneyMapStore((state) => state.nodes);` line, add:

```ts
const edges = useMoneyMapStore((state) => state.edges);
```

- [ ] **Step 3: Add `inputMode` and `percentageValue` states**

After the existing `const [isRateManual, setIsRateManual] = useState(false);` line, add:

```ts
const [inputMode, setInputMode] = useState<"fixed" | "percentage">("fixed");
const [percentageValue, setPercentageValue] = useState<string>("20");
```

(`percentageValue` is stored as a string so the input field stays controlled without numeric coercion issues. It is parsed to a number at submit time.)

- [ ] **Step 4: Compute `savingsNodeId` and `bucketInflow`**

After the existing `parentOptions` useMemo, add:

```ts
const savingsNodeId = useMemo(() => {
  if (activeType !== "savings") return null;
  if (editItemId) {
    return nodes.find((n) => n.data.itemIds.includes(editItemId))?.id ?? null;
  }
  return nodes.find((n) => n.data.type === "savings")?.id ?? null;
}, [activeType, editItemId, nodes]);

const bucketInflow = useMemo(() => {
  if (!savingsNodeId) return 0;
  const month = date.slice(0, 7); // "YYYY-MM-DD" → "YYYY-MM"
  return getBucketInflow(savingsNodeId, nodes, edges, items, month, defaultCurrency, liveRate);
}, [savingsNodeId, nodes, edges, items, date, defaultCurrency, liveRate]);
```

- [ ] **Step 5: Update `resetForm` to clear new states**

Inside `resetForm()`, after the existing `setResolvedRateSource("current_api");` line, add:

```ts
setInputMode("fixed");
setPercentageValue("20");
```

- [ ] **Step 6: Update `useEffect` (edit mode) to restore new states**

In the `useEffect` that runs when `editItem` changes, after the existing line:

```ts
setTitleValue(editItem.title ?? "");
```

Add:

```ts
setInputMode(editItem.inputMode ?? "fixed");
setPercentageValue(String(editItem.percentageValue ?? 20));
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 8: Commit checkpoint**

```bash
git add components/quick-add/QuickAddModal.tsx
git commit -m "feat: add inputMode/percentageValue states and bucketInflow memo to savings modal"
```

---

## Task 4: Update QuickAddModal — UI (Toggle + Preview)

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

- [ ] **Step 1: Add the Fixed/Percentage toggle and percentage UI**

In the JSX scrollable fields section, find this block:

```tsx
{activeType !== "bucket" && (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_176px] gap-3">
      <Field label={copy.amount}>
        <AmountInput
          currency={currency}
          value={amount}
          onValueChange={setAmount}
          resetKey={resetKey}
        />
      </Field>
      <Field label="Currency">
        <CurrencySegmentedToggle value={currency} onChange={setCurrency} />
      </Field>
    </div>
    <SuggestionChips
      title={titleValue}
      currency={currency}
      onSelect={(v) => {
        setAmount(v);
        setResetKey((k) => k + 1);
      }}
    />
  </>
)}
```

Replace it with:

```tsx
{activeType !== "bucket" && (
  <>
    {activeType === "savings" && (
      <Field label="Amount Type">
        <div className="grid h-12 grid-cols-2 rounded-full bg-[#fbfaf7] p-1 shadow-[inset_0_0_0_1px_#ecebe7]">
          {(["fixed", "percentage"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded-full px-2 text-[13px] font-semibold transition ${
                inputMode === mode
                  ? "bg-white text-[#2f333b] shadow-[0_8px_18px_rgba(91,82,65,0.12)]"
                  : "text-[#8c90a0] hover:text-[#626677]"
              }`}
              onClick={() => setInputMode(mode)}
            >
              {mode === "fixed" ? "Fixed" : "Percentage"}
            </button>
          ))}
        </div>
      </Field>
    )}

    {(activeType !== "savings" || inputMode === "fixed") && (
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_176px] gap-3">
        <Field label={copy.amount}>
          <AmountInput
            currency={currency}
            value={amount}
            onValueChange={setAmount}
            resetKey={resetKey}
          />
        </Field>
        <Field label="Currency">
          <CurrencySegmentedToggle value={currency} onChange={setCurrency} />
        </Field>
      </div>
    )}

    {activeType === "savings" && inputMode === "percentage" && (
      <>
        <Field label="Percentage">
          <input
            className={inputClass}
            type="text"
            inputMode="numeric"
            placeholder="20"
            value={percentageValue}
            onChange={(e) => setPercentageValue(e.target.value.replace(/[^\d]/g, ""))}
          />
        </Field>
        <div className="grid gap-1 px-1">
          <span className="text-[12px] font-medium text-[#686d7a]">Based on</span>
          <span className="text-[13px] text-[#2f333b]">Total incoming to Savings this month</span>
        </div>
        {bucketInflow > 0 ? (
          <div className="rounded-2xl bg-[#f4f2ec] px-4 py-3">
            <span className="text-[13px] font-medium text-[#686d7a]">Preview </span>
            <span className="text-[13px] font-semibold text-[#2f333b]">
              {percentageValue || "0"}% of {formatPrimaryAmount({ amount: bucketInflow, currency: defaultCurrency })} ={" "}
              {formatPrimaryAmount({
                amount: Math.round((Number(percentageValue || 0) / 100) * bucketInflow),
                currency: defaultCurrency,
              })}
            </span>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#fff4ec] px-4 py-3">
            <span className="text-[12px] text-[#b07030]">
              No incoming money to this Savings node this month. Add or connect income first.
            </span>
          </div>
        )}
      </>
    )}

    {(activeType !== "savings" || inputMode === "fixed") && (
      <SuggestionChips
        title={titleValue}
        currency={currency}
        onSelect={(v) => {
          setAmount(v);
          setResetKey((k) => k + 1);
        }}
      />
    )}
  </>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx
git commit -m "feat: add Fixed/Percentage toggle and preview UI to savings modal"
```

---

## Task 5: Update QuickAddModal — Submit Logic + Disable on Empty Inflow

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

- [ ] **Step 1: Update submit button disabled condition**

Find the submit button JSX at the bottom of the modal:

```tsx
<button
  type="submit"
  className={`h-13 w-full rounded-full px-5 py-3.5 text-[16px] font-semibold transition active:scale-[0.99] ${submitButtonClass(activeType)}`}
>
  {editItemId ? copy.submit.replace("Add", "Save") : copy.submit}
</button>
```

Replace with:

```tsx
<button
  type="submit"
  disabled={activeType === "savings" && inputMode === "percentage" && bucketInflow === 0}
  className={`h-13 w-full rounded-full px-5 py-3.5 text-[16px] font-semibold transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${submitButtonClass(activeType)}`}
>
  {editItemId ? copy.submit.replace("Add", "Save") : copy.submit}
</button>
```

- [ ] **Step 2: Update `submit` function to handle percentage mode**

Find the `submit` function body. Currently it builds `payload` with `amount: activeType === "bucket" ? undefined : (activeType === "goal" ? undefined : amount)`. Replace the entire `payload` object and the preceding `effectiveRate` lines with:

```ts
const parsedManualRate = parseFloat(manualRate.replace(/,/g, ""));
const effectiveRate = isRateManual && Number.isFinite(parsedManualRate) && parsedManualRate > 0
  ? parsedManualRate
  : resolvedRate ?? undefined;
const effectiveRateSource = isRateManual ? "manual" : resolvedRateSource;

const isSavingsPercentage = activeType === "savings" && inputMode === "percentage";
const pct = Number(percentageValue || 0);
const resolvedAmount = isSavingsPercentage
  ? Math.round((pct / 100) * bucketInflow)
  : amount;

const payload = {
  type: activeType,
  title,
  amount: activeType === "bucket" || activeType === "goal" ? undefined : resolvedAmount,
  targetAmount: activeType === "goal" ? amount : undefined,
  currency,
  date,
  note: String(form.get("note") ?? ""),
  recurrence: activeType === "goal" ? "none" : recurrence,
  parentNodeId: parentNodeId || undefined,
  category: activeType === "goal" ? goalCategory : undefined,
  rateOverride: effectiveRate,
  rateSource: effectiveRateSource,
  inputMode: isSavingsPercentage ? ("percentage" as const) : ("fixed" as const),
  percentageValue: isSavingsPercentage ? pct : undefined,
  baseAmountSnapshot: isSavingsPercentage ? bucketInflow : undefined,
  percentageBaseType: isSavingsPercentage ? ("bucket_inflow" as const) : undefined,
  percentageBaseNodeId: isSavingsPercentage ? (savingsNodeId ?? undefined) : undefined,
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx
git commit -m "feat: savings percentage submit — snapshot amount, disable on empty inflow"
```

---

## Task 6: Manual Verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npm run dev
```

- [ ] **Step 2: Verify fixed mode (regression)**

1. Click "Add Savings"
2. Confirm `[ Fixed ] [ Percentage ]` toggle is visible
3. "Fixed" is selected by default
4. Enter a title and a numeric amount — confirm the form submits normally
5. The new item appears on the canvas

- [ ] **Step 3: Verify percentage mode — no inflow**

1. Open "Add Savings" on a canvas with no income nodes connected to savings
2. Switch to "Percentage"
3. Confirm warning: "No incoming money to this Savings node this month"
4. Confirm submit button is disabled / greyed out

- [ ] **Step 4: Verify percentage mode — with inflow**

1. Ensure an income node exists and is connected to the savings node (or add one)
2. Open "Add Savings"
3. Switch to "Percentage"
4. Type `20` in the percentage input
5. Confirm live preview: `20% of [inflow] = [amount]`
6. Submit — item appears on canvas
7. Edit the item — confirm it reopens in percentage mode with `20` pre-filled

- [ ] **Step 5: Run existing tests to check for regressions**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/calculateBucketPercentages.test.ts && npx tsx tests/bucketInflow.test.ts
```

Expected:
```
calculateBucketPercentages: all tests passed ✓
getBucketInflow: all tests passed ✓
```

- [ ] **Step 6: Final commit**

```bash
git add -p
git commit -m "feat: savings percentage inflow — complete implementation"
```
