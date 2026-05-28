# Historical Currency Rate Fallback System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permanently snapshot the USD/Toman exchange rate on every transaction so historical data stays accurate even as the live rate changes, with a growing local cache of past rates.

**Architecture:** A new `exchangeRates` Dexie table accumulates daily USD/Toman snapshots whenever the app fetches a live rate. When a user opens the add/edit modal, a lookup util walks the cache backwards from the selected date to find the best available historical rate, with graceful fallback to the current live rate. The resolved rate is shown in an editable UI field and passed explicitly to the store's add/update actions — replacing the current implicit "use whatever rate is in state" approach.

**Tech Stack:** Dexie (already used in `lib/db.ts`), Zustand (already used), React hooks, TypeScript.

---

## File Map

**Create:**
- `lib/exchangeRates/saveDailyRate.ts` — persist today's rate to the `exchangeRates` Dexie table (idempotent per day)
- `lib/exchangeRates/getHistoricalRate.ts` — resolve the best available rate for a given date (cache → fallback)

**Modify:**
- `lib/db.ts` — add `exchangeRates` table (Dexie v2 schema upgrade)
- `types/money.ts` — add `rateSource` field to `MoneyAmount`
- `lib/currency.ts` — thread `rateSource` through `createLockedAmount`
- `store/moneyMapStore.ts` — add `rateOverride`/`rateSource` to `AddPayload`; update `addItemFromForm`, `updateItemFromForm`, and `fetchExchangeRate`
- `components/quick-add/QuickAddModal.tsx` — look up historical rate when date/currency changes; show editable rate field; pass resolved rate to store

---

## Task 1: Upgrade Dexie schema — add `exchangeRates` table

**Files:**
- Modify: `lib/db.ts`

- [ ] **Step 1: Read current `lib/db.ts`** (already shown above — needed for the edit below)

- [ ] **Step 2: Update `lib/db.ts` with new table**

Replace the entire file with:

```ts
import Dexie, { type Table } from "dexie";
import type { UserDocument } from "@/lib/document";

interface LocalRecord {
  id: string;
  data: UserDocument;
  updatedAt: string;
}

export interface CachedExchangeRate {
  date: string;        // YYYY-MM-DD — primary key
  usdToToman: number;
  source: "navasan" | "manual";
  createdAt: string;
}

class MoneyMapDB extends Dexie {
  documents!: Table<LocalRecord, string>;
  exchangeRates!: Table<CachedExchangeRate, string>;

  constructor() {
    super("money-map-db");
    this.version(1).stores({
      documents: "id",
    });
    this.version(2).stores({
      documents: "id",
      exchangeRates: "date",
    });
  }
}

export const db = new MoneyMapDB();

export async function loadLocalDocument(id = "local"): Promise<UserDocument | null> {
  const record = await db.documents.get(id);
  return record?.data ?? null;
}

export async function saveLocalDocument(doc: UserDocument, id = "local"): Promise<void> {
  await db.documents.put({ id, data: doc, updatedAt: new Date().toISOString() });
}
```

- [ ] **Step 3: Verify the app still compiles**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to `db.ts`).

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts
git commit -m "feat: add exchangeRates table to Dexie DB (schema v2)"
```

---

## Task 2: Create `saveDailyRate` util

**Files:**
- Create: `lib/exchangeRates/saveDailyRate.ts`

- [ ] **Step 1: Create the file**

```ts
import { db } from "@/lib/db";

export async function saveDailyRate(usdToToman: number, dateIso?: string): Promise<void> {
  const date = dateIso ?? new Date().toISOString().slice(0, 10);
  const existing = await db.exchangeRates.get(date);
  if (existing) return; // already have a rate for today — don't overwrite
  await db.exchangeRates.put({
    date,
    usdToToman,
    source: "navasan",
    createdAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/exchangeRates/saveDailyRate.ts
git commit -m "feat: add saveDailyRate util for exchange rate cache"
```

---

## Task 3: Create `getHistoricalRate` util

**Files:**
- Create: `lib/exchangeRates/getHistoricalRate.ts`

- [ ] **Step 1: Create the file**

```ts
import { db } from "@/lib/db";

export type RateResult = {
  rate: number;
  source: "historical_cache" | "current_api";
  hint: "exact" | "nearest_previous";
} | null;

/**
 * Resolves the best available USD/Toman rate for a given date.
 * Returns null when no cached rate exists at or before the date
 * (caller should fall back to the current live rate from the store).
 */
export async function getHistoricalRate(dateIso: string): Promise<RateResult> {
  // Try exact date first
  const exact = await db.exchangeRates.get(dateIso);
  if (exact) {
    return { rate: exact.usdToToman, source: "historical_cache", hint: "exact" };
  }

  // Find the nearest previous date
  const previous = await db.exchangeRates
    .where("date")
    .belowOrEqual(dateIso)
    .last();

  if (previous) {
    return { rate: previous.usdToToman, source: "historical_cache", hint: "nearest_previous" };
  }

  return null;
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/exchangeRates/getHistoricalRate.ts
git commit -m "feat: add getHistoricalRate util with exact/nearest-previous fallback"
```

---

## Task 4: Add `rateSource` to `MoneyAmount` type

**Files:**
- Modify: `types/money.ts`

- [ ] **Step 1: Update `MoneyAmount` in `types/money.ts`**

Change:

```ts
export interface MoneyAmount {
  amount: number;
  currency: Currency;
  convertedAmountAtEntry?: number;
  convertedCurrency?: Currency;
  exchangeRateAtEntry?: number;
}
```

To:

```ts
export type RateSource = "historical_cache" | "current_api" | "manual";

export interface MoneyAmount {
  amount: number;
  currency: Currency;
  convertedAmountAtEntry?: number;
  convertedCurrency?: Currency;
  exchangeRateAtEntry?: number;
  rateSource?: RateSource;
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors (new optional field is backwards compatible).

- [ ] **Step 3: Commit**

```bash
git add types/money.ts
git commit -m "feat: add rateSource field to MoneyAmount type"
```

---

## Task 5: Thread `rateSource` through `createLockedAmount`

**Files:**
- Modify: `lib/currency.ts`

- [ ] **Step 1: Update `lib/currency.ts`**

Replace the entire file with:

```ts
import type { Currency, MoneyAmount, RateSource } from "@/types/money";

export function createLockedAmount(
  amount: number,
  currency: Currency,
  rate: number | null,
  rateSource: RateSource = "current_api"
): MoneyAmount {
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
      rateSource,
    };
  }

  return {
    amount,
    currency,
    convertedAmountAtEntry: Number((amount / rate).toFixed(2)),
    convertedCurrency: "USD",
    exchangeRateAtEntry: rate,
    rateSource,
  };
}

export function createLiveAmount(amount: number, currency: Currency): MoneyAmount {
  if (!Number.isFinite(amount)) {
    return { amount: 0, currency };
  }
  return { amount, currency };
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors (the default param keeps all existing callers working unchanged).

- [ ] **Step 3: Commit**

```bash
git add lib/currency.ts
git commit -m "feat: thread rateSource through createLockedAmount"
```

---

## Task 6: Update store — save daily rate after fetch + add `rateOverride` to `AddPayload`

**Files:**
- Modify: `store/moneyMapStore.ts`

This task has two related changes in one file: (a) save to cache after fetch, (b) accept `rateOverride` so the modal can pass the historically resolved rate.

- [ ] **Step 1: Add `saveDailyRate` import at top of `store/moneyMapStore.ts`**

Add this import after the existing imports:

```ts
import { saveDailyRate } from "@/lib/exchangeRates/saveDailyRate";
```

- [ ] **Step 2: Extend `AddPayload` type**

Change:

```ts
type AddPayload = {
  type: MoneyNodeType;
  amount?: number;
  currency?: Currency;
  title: string;
  date?: string;
  note?: string;
  recurrence?: RecurrenceType;
  parentNodeId?: string;
  targetAmount?: number;
  category?: GoalCategory;
};
```

To:

```ts
type AddPayload = {
  type: MoneyNodeType;
  amount?: number;
  currency?: Currency;
  title: string;
  date?: string;
  note?: string;
  recurrence?: RecurrenceType;
  parentNodeId?: string;
  targetAmount?: number;
  category?: GoalCategory;
  rateOverride?: number;
  rateSource?: import("@/types/money").RateSource;
};
```

- [ ] **Step 3: Update `addItemFromForm` to use `rateOverride`**

In `addItemFromForm`, find the two calls to `createLockedAmount` that use `get().exchangeRate.usdToToman`. Change both to use the override when provided.

Change:

```ts
      const currency = payload.currency ?? get().settings.defaultCurrency;
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

To:

```ts
      const currency = payload.currency ?? get().settings.defaultCurrency;
      const isHistorical = payload.type === "income" || payload.type === "expense";
      const effectiveRate = payload.rateOverride ?? get().exchangeRate.usdToToman;
      const effectiveRateSource = payload.rateSource ?? "current_api";
      const moneyAmount =
        payload.amount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.amount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.amount, currency)
          : undefined;
      const targetAmount =
        payload.targetAmount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.targetAmount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.targetAmount, currency)
          : undefined;
```

- [ ] **Step 4: Update `updateItemFromForm` to use `rateOverride`**

Same pattern — find the two `createLockedAmount` calls in `updateItemFromForm` and apply the same change:

Change:

```ts
      const currency = payload.currency ?? get().settings.defaultCurrency;
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

To:

```ts
      const currency = payload.currency ?? get().settings.defaultCurrency;
      const isHistorical = payload.type === "income" || payload.type === "expense";
      const effectiveRate = payload.rateOverride ?? get().exchangeRate.usdToToman;
      const effectiveRateSource = payload.rateSource ?? "current_api";
      const moneyAmount =
        payload.amount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.amount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.amount, currency)
          : undefined;
      const targetAmount =
        payload.targetAmount !== undefined
          ? isHistorical
            ? createLockedAmount(payload.targetAmount, currency, effectiveRate, effectiveRateSource)
            : createLiveAmount(payload.targetAmount, currency)
          : undefined;
```

- [ ] **Step 5: Call `saveDailyRate` in `fetchExchangeRate` after successful fetch**

In the `fetchExchangeRate` action, after the `set(...)` call that updates `exchangeRate`, add:

```ts
        // Fire-and-forget: build the historical archive
        saveDailyRate(usdToToman).catch(() => {/* non-critical */});
```

The complete `try` block inside `fetchExchangeRate` should end like this:

```ts
      try {
        const usdToToman = await fetchUsdToTomanRate();
        set((state) => {
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
        saveDailyRate(usdToToman).catch(() => {/* non-critical */});
      } catch (error) {
        // ... existing error handling unchanged
      }
```

- [ ] **Step 6: Verify compilation**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add store/moneyMapStore.ts
git commit -m "feat: accept rateOverride in AddPayload; save daily rate after fetch"
```

---

## Task 7: Update `QuickAddModal` — historical rate lookup + editable rate field

**Files:**
- Modify: `components/quick-add/QuickAddModal.tsx`

This is the main UX change. When currency is USD and type is not `bucket`, show an exchange rate field pre-populated from the historical cache (or current live rate as fallback). The user can always edit it manually. The resolved rate is passed to the store.

- [ ] **Step 1: Add new imports to `QuickAddModal.tsx`**

Add to the top of the file (after existing imports):

```ts
import { getHistoricalRate } from "@/lib/exchangeRates/getHistoricalRate";
```

- [ ] **Step 2: Add exchange-rate state variables inside `QuickAddModal` component**

Add these four state declarations after the existing `const [resetKey, setResetKey] = useState(0);` line:

```ts
  const liveRate = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
  const [resolvedRate, setResolvedRate] = useState<number | null>(null);
  const [resolvedRateSource, setResolvedRateSource] = useState<"historical_cache" | "current_api" | "manual">("current_api");
  const [resolvedRateHint, setResolvedRateHint] = useState<"exact" | "nearest_previous" | null>(null);
  const [manualRate, setManualRate] = useState<string>("");
  const [isRateManual, setIsRateManual] = useState(false);
```

- [ ] **Step 3: Add rate-lookup effect that runs when `date` or `currency` changes**

Add this `useEffect` after the existing reset/load `useEffect`:

```ts
  useEffect(() => {
    if (currency !== "USD" || activeType === "bucket" || activeType === "goal") {
      setResolvedRate(null);
      setResolvedRateHint(null);
      setManualRate("");
      setIsRateManual(false);
      return;
    }

    let cancelled = false;
    getHistoricalRate(date).then((result) => {
      if (cancelled) return;
      if (result) {
        setResolvedRate(result.rate);
        setResolvedRateSource(result.source);
        setResolvedRateHint(result.hint);
        setManualRate(String(result.rate));
      } else {
        // Fall back to live rate
        const fallback = liveRate;
        setResolvedRate(fallback);
        setResolvedRateSource("current_api");
        setResolvedRateHint(null);
        setManualRate(fallback ? String(fallback) : "");
      }
      setIsRateManual(false);
    });

    return () => { cancelled = true; };
  }, [date, currency, activeType, liveRate]);
```

- [ ] **Step 4: Reset rate-related state in `resetForm`**

Add these lines at the end of the existing `resetForm` function body:

```ts
    setResolvedRate(null);
    setResolvedRateHint(null);
    setManualRate("");
    setIsRateManual(false);
    setResolvedRateSource("current_api");
```

- [ ] **Step 5: Populate rate state when editing an existing item**

In the existing `useEffect` that populates form fields from `editItem`, add after setting `setTitleValue`:

```ts
    // Restore the rate that was used at entry time (if available)
    if (editItem.amount?.exchangeRateAtEntry) {
      setManualRate(String(editItem.amount.exchangeRateAtEntry));
      setResolvedRate(editItem.amount.exchangeRateAtEntry);
      setResolvedRateSource(editItem.amount.rateSource ?? "current_api");
      setIsRateManual(editItem.amount.rateSource === "manual");
    }
```

- [ ] **Step 6: Update `submit` to pass the resolved rate**

In `submit`, change:

```ts
    const payload = {
      type: activeType,
      title,
      amount: activeType === "bucket" ? undefined : amount,
      targetAmount: activeType === "goal" ? amount : undefined,
      currency,
      date,
      note: String(form.get("note") ?? ""),
      recurrence: activeType === "goal" ? "none" : recurrence,
      parentNodeId: parentNodeId || undefined,
      category: activeType === "goal" ? goalCategory : undefined
    };
```

To:

```ts
    const parsedManualRate = parseFloat(manualRate.replace(/,/g, ""));
    const effectiveRate = isRateManual && Number.isFinite(parsedManualRate) && parsedManualRate > 0
      ? parsedManualRate
      : resolvedRate ?? undefined;
    const effectiveRateSource = isRateManual ? "manual" : resolvedRateSource;

    const payload = {
      type: activeType,
      title,
      amount: activeType === "bucket" ? undefined : amount,
      targetAmount: activeType === "goal" ? amount : undefined,
      currency,
      date,
      note: String(form.get("note") ?? ""),
      recurrence: activeType === "goal" ? "none" : recurrence,
      parentNodeId: parentNodeId || undefined,
      category: activeType === "goal" ? goalCategory : undefined,
      rateOverride: effectiveRate,
      rateSource: effectiveRateSource,
    };
```

- [ ] **Step 7: Add the exchange rate UI field to the form**

In the JSX, after the `<SuggestionChips>` block (and still inside the `{activeType !== "bucket" && (...)}` section), add the rate field. It should only render when `currency === "USD"` and type is not goal:

Find this block in the JSX:
```tsx
                {activeType !== "bucket" && (
                  <Field label="Date">
                    <StyledDatePicker value={date} onChange={setDate} calendarSystem={calendarSystem} />
                  </Field>
                )}
```

Add a new `<Field>` block **before** that date field, inside the outer `{activeType !== "bucket" && (...)}` guard:

```tsx
                {activeType !== "bucket" && activeType !== "goal" && currency === "USD" && (
                  <Field label="USD rate for this date">
                    <div className="grid gap-1.5">
                      <input
                        className={inputClass}
                        type="text"
                        inputMode="numeric"
                        value={manualRate}
                        onChange={(e) => {
                          setManualRate(e.target.value);
                          setIsRateManual(true);
                        }}
                        placeholder="e.g. 82000"
                      />
                      <span className="px-1 text-[12px] text-[#b1b1b8]">
                        {isRateManual
                          ? "Using your custom rate"
                          : resolvedRateHint === "exact"
                          ? "Historical rate loaded"
                          : resolvedRateHint === "nearest_previous"
                          ? "No exact rate found. Using nearest available rate."
                          : "No historical rate found. Using latest available rate."}
                      </span>
                    </div>
                  </Field>
                )}
```

- [ ] **Step 8: Verify compilation**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && npx tsc --noEmit 2>&1 | head -40
```

Expected: no new errors.

- [ ] **Step 9: Commit**

```bash
git add components/quick-add/QuickAddModal.tsx lib/exchangeRates/getHistoricalRate.ts
git commit -m "feat: show editable historical rate field in QuickAddModal; resolve from cache"
```

---

## Task 8: Verify analytics still uses stored snapshots (no change needed, confirm only)

**Files:**
- Read: `lib/analytics.ts` (already read — confirm no changes needed)

The `amountInCurrency` function in `lib/analytics.ts` already prefers `convertedAmountAtEntry` when the converted currency matches:

```ts
function amountInCurrency(item: MoneyItem, currency: AnalyticsCurrency, rate: number) {
  const amount = item.amount;
  if (!amount) return 0;
  if (amount.currency === currency) return amount.amount;
  if (amount.convertedCurrency === currency && typeof amount.convertedAmountAtEntry === "number")
    return amount.convertedAmountAtEntry;   // ← uses snapshot, not live rate
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}
```

This is correct — it uses the stored snapshot and only falls back to the live rate if no snapshot exists. No changes needed.

- [ ] **Step 1: Confirm no analytics changes are needed**

Re-read the three lines above. The logic is already snapshot-first. ✓

- [ ] **Step 2: Commit a confirmation note** *(skip if nothing changed)*

No commit needed for this task.

---

## Self-Review Against Spec

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Every transaction permanently stores exchange rate at creation | Task 5 (`createLockedAmount` → `rateSource`), Task 6 (`rateOverride` in payload) |
| Old transactions never auto-update | Analytics already uses `convertedAmountAtEntry` (Task 8 confirms) |
| Historical rate fallback: exact → nearest previous → current API | Task 3 (`getHistoricalRate`) |
| Daily rate cache in IndexedDB | Task 1 (schema), Task 2 (`saveDailyRate`), Task 6 (call on fetch) |
| Cache built up over time (store on each fetch) | Task 6 (`saveDailyRate` called in `fetchExchangeRate`) |
| Exchange rate field shown in modal | Task 7 (Step 7) |
| Helper text indicating rate source | Task 7 (Step 7 — three states: exact, nearest_previous, fallback) |
| User can always manually edit the rate | Task 7 (Steps 5–7) |
| Manual edit marked as `rateSource: "manual"` | Task 7 (Step 6 — `isRateManual` flag) |
| Analytics use stored snapshots, not live rate | Task 8 (confirmed already correct) |
| Currency perspective toggle historically accurate | Same — `amountInCurrency` uses `convertedAmountAtEntry` |
| No redesign of existing UI | Only adds a new field inside existing modal form |
| `rateSource` field on `MoneyAmount` | Task 4 |

**Placeholder scan:** None found — all code blocks are complete and runnable.

**Type consistency check:**
- `RateSource` defined in `types/money.ts` (Task 4), imported in `lib/currency.ts` (Task 5), used in `store/moneyMapStore.ts` (Task 6) via `import("@/types/money").RateSource`, and used in `QuickAddModal.tsx` state (Task 7) — consistent.
- `createLockedAmount` signature: `(amount, currency, rate, rateSource?)` — used identically in Tasks 5 and 6.
- `getHistoricalRate` returns `RateResult` with `source: "historical_cache" | "current_api"` — consumed correctly in Task 7 Step 3.
- `AddPayload.rateSource` typed as `import("@/types/money").RateSource` which equals `"historical_cache" | "current_api" | "manual"` — matches `setResolvedRateSource` state in Task 7.
