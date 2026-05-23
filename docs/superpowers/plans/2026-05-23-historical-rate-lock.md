# Historical Rate Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock income/expense converted values at entry-time exchange rate; let goals/savings display the live wiggled rate; rename rate fields to `exchangeRateAtEntry`/`convertedAmountAtEntry`; show wiggled rate in Settings.

**Architecture:** Two explicit converter functions (`createLockedAmount` / `createLiveAmount`) replace the single `createMoneyAmount`. The store dispatches by item type. A migration in `applyDocument` rewrites old field names on load. A backfill pass in `fetchExchangeRate` stamps the rate on old income/expense items that are missing it. The wiggler already runs in `MoneyNode`; Settings just needs to tap `useAnimatedRate`.

**Tech Stack:** Next.js, TypeScript, Zustand, `useAnimatedRate` hook (already exists at `hooks/useAnimatedRate.ts`).

---

## File Map

| File | Change |
|---|---|
| `types/money.ts` | Rename `exchangeRateSnapshot` → `exchangeRateAtEntry`, `convertedAmount` → `convertedAmountAtEntry` |
| `lib/currency.ts` | Replace `createMoneyAmount` with `createLockedAmount` + `createLiveAmount` |
| `lib/formatters.ts` | Update field names; change `"at time"` label to `"· entry rate"` |
| `lib/analytics.ts` | Update field name references (2 lines) |
| `lib/document.ts` | Add `migrateMoneyAmount` called inside `applyDocument` |
| `store/moneyMapStore.ts` | Dispatch by type; backfill after rate fetch |
| `components/settings/SettingsModal.tsx` | Use `useAnimatedRate` for the displayed USD rate |
| `tests/currencyConversion.test.ts` | New test file — 6 assertions |

---

### Task 1: Write failing tests

**Files:**
- Create: `tests/currencyConversion.test.ts`

- [ ] **Step 1.1: Create the test file**

`tests/currencyConversion.test.ts`:

```ts
// These tests will fail until Tasks 2-4 are implemented.
// Run with: npx tsx tests/currencyConversion.test.ts

import { createLockedAmount, createLiveAmount } from "@/lib/currency";
import { formatConvertedAmount } from "@/lib/formatters";

// 1. createLockedAmount converts TOMAN → USD at rate 200,000
const locked = createLockedAmount(100_000_000, "TOMAN", 200_000);
if (locked.convertedAmountAtEntry !== 500)
  throw new Error(`Expected convertedAmountAtEntry 500, got ${locked.convertedAmountAtEntry}`);
if (locked.exchangeRateAtEntry !== 200_000)
  throw new Error(`Expected exchangeRateAtEntry 200000, got ${locked.exchangeRateAtEntry}`);

// 2. Stored value is immutable — changing the rate variable does not touch the stored object
const rate1 = 200_000;
const incomeItem = createLockedAmount(100_000_000, "TOMAN", rate1);
// Simulate rate change — nothing touches the stored object
const rate2 = 300_000;
if (incomeItem.convertedAmountAtEntry !== 500)
  throw new Error(`Expected income to still show 500 after rate change, got ${incomeItem.convertedAmountAtEntry}`);

// 3. Expense stays fixed after rate change
const expenseItem = createLockedAmount(50_000_000, "TOMAN", rate1);
if (expenseItem.convertedAmountAtEntry !== 250)
  throw new Error(`Expected expense convertedAmountAtEntry 250, got ${expenseItem.convertedAmountAtEntry}`);
// (rate2 is available but never applied retroactively)
if (expenseItem.convertedAmountAtEntry !== 250)
  throw new Error("Expense convertedAmountAtEntry changed — it should not");

// 4. createLiveAmount stores NO convertedAmountAtEntry
const live = createLiveAmount(100_000_000, "TOMAN");
if ("convertedAmountAtEntry" in live && live.convertedAmountAtEntry !== undefined)
  throw new Error("createLiveAmount must not store convertedAmountAtEntry");

// 5. formatConvertedAmount with stored value → shows "· entry rate" suffix
const lockedDisplay = formatConvertedAmount(
  { amount: 100_000_000, currency: "TOMAN", convertedAmountAtEntry: 500, convertedCurrency: "USD", exchangeRateAtEntry: 200_000 },
  300_000
);
if (!lockedDisplay.includes("· entry rate"))
  throw new Error(`Expected '· entry rate' in output, got: ${lockedDisplay}`);

// 6. formatConvertedAmount with NO stored value → shows live rate, no suffix
const liveDisplay = formatConvertedAmount(
  { amount: 100_000_000, currency: "TOMAN" },
  300_000
);
if (liveDisplay.includes("· entry rate"))
  throw new Error(`Live display must not include '· entry rate', got: ${liveDisplay}`);
if (!liveDisplay.includes("333"))
  throw new Error(`Live display should show ~333 USD at rate 300,000, got: ${liveDisplay}`);

console.log("All tests passed.");
```

- [ ] **Step 1.2: Run — confirm it fails**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/currencyConversion.test.ts
```

Expected: error about `createLockedAmount` not exported / `convertedAmountAtEntry` not existing.

---

### Task 2: Rename fields in types + update converter functions

**Files:**
- Modify: `types/money.ts`
- Modify: `lib/currency.ts`

- [ ] **Step 2.1: Update `types/money.ts`**

Replace the `MoneyAmount` interface:

```ts
export interface MoneyAmount {
  amount: number;
  currency: Currency;
  convertedAmountAtEntry?: number;
  convertedCurrency?: Currency;
  exchangeRateAtEntry?: number;
}
```

(Full file is short — rewrite the whole interface block. Only `MoneyAmount` changes. All other interfaces/types stay.)

- [ ] **Step 2.2: Rewrite `lib/currency.ts`**

```ts
import type { Currency, MoneyAmount } from "@/types/money";

export function createLockedAmount(amount: number, currency: Currency, rate: number | null): MoneyAmount {
  if (!Number.isFinite(amount)) {
    return { amount: 0, currency };
  }

  if (!rate) {
    return { amount, currency };
  }

  if (currency === "USD") {
    return {
      amount,
      currency,
      convertedAmountAtEntry: Math.round(amount * rate),
      convertedCurrency: "TOMAN",
      exchangeRateAtEntry: rate,
    };
  }

  return {
    amount,
    currency,
    convertedAmountAtEntry: Number((amount / rate).toFixed(2)),
    convertedCurrency: "USD",
    exchangeRateAtEntry: rate,
  };
}

export function createLiveAmount(amount: number, currency: Currency): MoneyAmount {
  if (!Number.isFinite(amount)) {
    return { amount: 0, currency };
  }
  return { amount, currency };
}
```

- [ ] **Step 2.3: Run tests — check progress**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/currencyConversion.test.ts
```

Expected: Tests 1–4 pass. Tests 5–6 fail because `formatConvertedAmount` still uses old field names.

---

### Task 3: Update formatters

**Files:**
- Modify: `lib/formatters.ts`

- [ ] **Step 3.1: Rewrite `lib/formatters.ts`**

```ts
import { formatCalendarDate } from "@/lib/calendar";
import type { CalendarSystem, MoneyAmount } from "@/types/money";

export function formatPrimaryAmount(amount?: MoneyAmount) {
  if (!amount) return "";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount.currency === "USD" ? 2 : 0
  }).format(amount.amount);

  return amount.currency === "USD" ? `$${formatted}` : `${formatted} T`;
}

export function formatConvertedAmount(amount?: MoneyAmount, liveRate?: number | null) {
  if (!amount) return "";

  if (amount.convertedAmountAtEntry != null && amount.convertedCurrency) {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: amount.convertedCurrency === "USD" ? 2 : 0
    }).format(amount.convertedAmountAtEntry);
    const value = amount.convertedCurrency === "USD" ? `$${formatted}` : `${formatted} T`;
    return `~ ${value} · entry rate`;
  }

  if (liveRate && liveRate > 0) {
    if (amount.currency === "USD") {
      const toman = amount.amount * liveRate;
      return `~ ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(toman)} T`;
    }
    if (amount.currency === "TOMAN") {
      const usd = amount.amount / liveRate;
      return `~ $${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(usd)}`;
    }
  }

  return "";
}

export function formatDateLabel(date?: string, calendarSystem: CalendarSystem = "shamsi") {
  if (calendarSystem === "shamsi") return formatCalendarDate(date, "shamsi");
  if (!date) return "2026, may 20";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "2026, may 20";

  const month = parsed.toLocaleString("en-US", { month: "short" }).toLowerCase();
  return `${parsed.getFullYear()}, ${month} ${parsed.getDate()}`;
}
```

- [ ] **Step 3.2: Run all tests — expect all to pass**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/currencyConversion.test.ts
```

Expected: `All tests passed.`

- [ ] **Step 3.3: Run existing tests — no regressions**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/monthSearch.test.ts && npx tsx tests/settingsData.test.ts
```

Expected: both exit cleanly (no output = pass).

- [ ] **Step 3.4: Commit**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && git add types/money.ts lib/currency.ts lib/formatters.ts tests/currencyConversion.test.ts && git commit -m "feat: rename rate fields + split createLockedAmount/createLiveAmount"
```

---

### Task 4: Update analytics

**Files:**
- Modify: `lib/analytics.ts`

- [ ] **Step 4.1: Update `amountInCurrency` and `targetInCurrency` field references**

In `lib/analytics.ts`, find these two functions and update the field names:

```ts
function amountInCurrency(item: MoneyItem, currency: AnalyticsCurrency, rate: number) {
  const amount = item.amount;
  if (!amount) return 0;
  if (amount.currency === currency) return amount.amount;
  if (amount.convertedCurrency === currency && typeof amount.convertedAmountAtEntry === "number") return amount.convertedAmountAtEntry;
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}

function targetInCurrency(item: MoneyItem, currency: AnalyticsCurrency, rate: number) {
  const amount = item.targetAmount;
  if (!amount) return 0;
  if (amount.currency === currency) return amount.amount;
  if (amount.convertedCurrency === currency && typeof amount.convertedAmountAtEntry === "number") return amount.convertedAmountAtEntry;
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}
```

(Only the `convertedAmount` references change — two lines in each function, one per function body. Everything else in `analytics.ts` is unchanged.)

- [ ] **Step 4.2: Typecheck**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only from `store/moneyMapStore.ts` (still imports deleted `createMoneyAmount`) — that's fixed next.

- [ ] **Step 4.3: Commit**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && git add lib/analytics.ts && git commit -m "fix: update analytics field references to convertedAmountAtEntry"
```

---

### Task 5: Add migration in `lib/document.ts`

**Files:**
- Modify: `lib/document.ts`

- [ ] **Step 5.1: Add `MoneyAmount` to the existing import at the top of `lib/document.ts`**

Change the existing import block from:

```ts
import type {
  AppSettings,
  CalendarSystem,
  ExchangeRateState,
  MoneyFlowEdge,
  MoneyFlowNode,
  MoneyItem,
} from "@/types/money";
```

To:

```ts
import type {
  AppSettings,
  CalendarSystem,
  ExchangeRateState,
  MoneyAmount,
  MoneyFlowEdge,
  MoneyFlowNode,
  MoneyItem,
} from "@/types/money";
```

- [ ] **Step 5.2: Add `migrateMoneyAmount` helper and call it inside `applyDocument`**

Add this type + function above `applyDocument` (after `ensureSystemNodes`):

```ts
type LegacyMoneyAmount = {
  amount?: number;
  currency?: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRateSnapshot?: number;
  convertedAmountAtEntry?: number;
  exchangeRateAtEntry?: number;
};

function migrateMoneyAmount(raw: LegacyMoneyAmount | undefined): MoneyAmount | undefined {
  if (!raw) return undefined;
  const result = { ...raw } as Record<string, unknown>;
  if ("exchangeRateSnapshot" in result && !("exchangeRateAtEntry" in result)) {
    result.exchangeRateAtEntry = result.exchangeRateSnapshot;
  }
  if ("convertedAmount" in result && !("convertedAmountAtEntry" in result)) {
    result.convertedAmountAtEntry = result.convertedAmount;
  }
  delete result.exchangeRateSnapshot;
  delete result.convertedAmount;
  return result as MoneyAmount;
}
```

Then inside `applyDocument`, update the items line:

```ts
items: isEmpty
  ? initialItems
  : doc.items.map((item) => ({
      ...item,
      amount: migrateMoneyAmount(item.amount as unknown as LegacyMoneyAmount),
      targetAmount: migrateMoneyAmount(item.targetAmount as unknown as LegacyMoneyAmount),
    })),
```

The full updated `applyDocument` function:

```ts
export function applyDocument(doc: UserDocument): Partial<DocumentSlice> {
  const isEmpty = doc.nodes.length === 0 && doc.items.length === 0;
  return {
    nodes: ensureSystemNodes(doc.nodes, doc.items),
    edges: isEmpty ? initialEdges : doc.edges.map(decorateEdge),
    items: isEmpty
      ? initialItems
      : doc.items.map((item) => ({
          ...item,
          amount: migrateMoneyAmount(item.amount as LegacyMoneyAmount),
          targetAmount: migrateMoneyAmount(item.targetAmount as LegacyMoneyAmount),
        })),
    settings: { ...defaultAppSettings, ...doc.settings },
    selectedMonth: normalizeMonth(doc.selectedMonth),
    calendarSystem: doc.calendarSystem,
    exchangeRate: {
      usdToToman: doc.exchangeRate.usdToToman,
      fetchedAt: doc.exchangeRate.fetchedAt,
      isLoading: false,
    },
    lastModifiedAt: doc.metadata.updatedAt,
  };
}
```

- [ ] **Step 5.3: Typecheck**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: still only errors from `store/moneyMapStore.ts` (`createMoneyAmount` not exported).

- [ ] **Step 5.4: Commit**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && git add lib/document.ts && git commit -m "feat: migrate old exchangeRateSnapshot/convertedAmount field names on load"
```

---

### Task 6: Update the store

**Files:**
- Modify: `store/moneyMapStore.ts`

- [ ] **Step 6.1: Update import at top of store**

Change:

```ts
import { createMoneyAmount } from "@/lib/currency";
```

To:

```ts
import { createLockedAmount, createLiveAmount } from "@/lib/currency";
```

- [ ] **Step 6.2: Update `addItemFromForm`**

Replace the block that builds `moneyAmount` and `targetAmount` (lines ~168-176 in the original):

```ts
const isHistorical = payload.type === "income" || payload.type === "expense";
const moneyAmount =
  payload.amount !== undefined
    ? isHistorical
      ? createLockedAmount(payload.amount, currency, get().exchangeRate.usdToToman)
      : createLiveAmount(payload.amount, currency)
    : undefined;
const targetAmount =
  payload.targetAmount !== undefined
    ? isHistorical
      ? createLockedAmount(payload.targetAmount, currency, get().exchangeRate.usdToToman)
      : createLiveAmount(payload.targetAmount, currency)
    : undefined;
```

- [ ] **Step 6.3: Update `updateItemFromForm`**

Replace the block that builds `moneyAmount` and `targetAmount` (lines ~239-247 in the original):

```ts
const isHistorical = payload.type === "income" || payload.type === "expense";
const moneyAmount =
  payload.amount !== undefined
    ? isHistorical
      ? createLockedAmount(payload.amount, currency, get().exchangeRate.usdToToman)
      : createLiveAmount(payload.amount, currency)
    : undefined;
const targetAmount =
  payload.targetAmount !== undefined
    ? isHistorical
      ? createLockedAmount(payload.targetAmount, currency, get().exchangeRate.usdToToman)
      : createLiveAmount(payload.targetAmount, currency)
    : undefined;
```

- [ ] **Step 6.4: Add backfill inside `fetchExchangeRate`**

Replace the `fetchExchangeRate` action:

```ts
fetchExchangeRate: async () => {
  const { fetchedAt } = get().exchangeRate;
  if (fetchedAt) {
    const ageMs = Date.now() - new Date(fetchedAt).getTime();
    if (ageMs < 2 * 60 * 60 * 1000) return;
  }
  set((state) => ({ exchangeRate: { ...state.exchangeRate, isLoading: true, error: undefined } }));
  try {
    const usdToToman = await fetchUsdToTomanRate();
    set((state) => {
      // Backfill: stamp convertedAmountAtEntry on income/expense items that are missing it.
      // Does not advance lastModifiedAt — this is not a user mutation.
      const needsBackfill = state.items.some(
        (item) =>
          (item.type === "income" || item.type === "expense") &&
          item.amount &&
          item.amount.convertedAmountAtEntry == null
      );
      const items = needsBackfill
        ? state.items.map((item) => {
            if (
              (item.type === "income" || item.type === "expense") &&
              item.amount &&
              item.amount.convertedAmountAtEntry == null
            ) {
              return {
                ...item,
                amount: createLockedAmount(item.amount.amount, item.amount.currency, usdToToman),
              };
            }
            return item;
          })
        : state.items;
      return {
        exchangeRate: { usdToToman, fetchedAt: new Date().toISOString(), isLoading: false },
        items,
      };
    });
  } catch (error) {
    set((state) => ({
      exchangeRate: {
        ...state.exchangeRate,
        isLoading: false,
        error: error instanceof Error ? error.message : "Exchange rate fetch failed",
      },
    }));
  }
},
```

- [ ] **Step 6.5: Typecheck — expect clean**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 6.6: Run all tests**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/currencyConversion.test.ts && npx tsx tests/monthSearch.test.ts && npx tsx tests/settingsData.test.ts
```

Expected: all exit cleanly.

- [ ] **Step 6.7: Commit**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && git add store/moneyMapStore.ts && git commit -m "feat: dispatch createLockedAmount/createLiveAmount by type; backfill on rate fetch"
```

---

### Task 7: Show wiggled rate in Settings

**Files:**
- Modify: `components/settings/SettingsModal.tsx`

- [ ] **Step 7.1: Add `useAnimatedRate` import**

At the top of `components/settings/SettingsModal.tsx`, add:

```ts
import { useAnimatedRate } from "@/hooks/useAnimatedRate";
```

- [ ] **Step 7.2: Tap the wiggled rate inside `SettingsModal`**

Inside the `SettingsModal` component body, after the existing state/selector calls, add:

```ts
const { displayed: displayedRate } = useAnimatedRate(exchangeRate.usdToToman);
```

- [ ] **Step 7.3: Use `displayedRate` in the label**

Find this line:

```tsx
label={`USD rate: ${formatRate(exchangeRate.usdToToman)}`}
```

Change it to:

```tsx
label={`USD rate: ${formatRate(displayedRate)}`}
```

- [ ] **Step 7.4: Typecheck**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7.5: Commit**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && git add components/settings/SettingsModal.tsx && git commit -m "feat: show wiggled live rate in Settings USD rate row"
```

---

### Task 8: Final verification

- [ ] **Step 8.1: Full typecheck**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 8.2: Run all tests**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsx tests/currencyConversion.test.ts && npx tsx tests/monthSearch.test.ts && npx tsx tests/settingsData.test.ts && echo "ALL PASS"
```

Expected: `ALL PASS`

- [ ] **Step 8.3: Lint**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx eslint . --max-warnings=0 2>&1 | tail -5
```

Expected: no new warnings.
