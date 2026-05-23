# Historical Rate Lock — Design Spec

**Date:** 2026-05-23  
**Status:** Approved

## Problem

Income and expense items currently store their USD/Toman converted value at entry time via `exchangeRateSnapshot` / `convertedAmount`, but goals and savings also store a locked converted value — they should use the live rate dynamically. Additionally, the Settings panel displays the raw (non-wiggled) exchange rate instead of the locally-wiggled displayed rate.

## Goal

- Income and expense: converted value is locked at the rate active when the item was created or last edited. Never recalculated from a later live rate.
- Goals and savings: converted value always reflects the current live (wiggled) rate.
- Settings "USD rate" row shows the locally-wiggled displayed rate, consistent with what nodes show.

---

## Section 1 — Data Model

### Field renames on `MoneyAmount` (`types/money.ts`)

| Old name | New name |
|---|---|
| `exchangeRateSnapshot` | `exchangeRateAtEntry` |
| `convertedAmount` | `convertedAmountAtEntry` |
| `convertedCurrency` | unchanged |

`MoneyItem.createdAt` / `MoneyItem.updatedAt` already serve as entry timestamps. No new timestamp fields are added.

### Migration

`lib/document.ts` — `applyDocument` runs a one-time field-name migration when deserializing any stored document. Any `MoneyAmount` carrying old field names (`exchangeRateSnapshot`, `convertedAmount`) is rewritten to the new names. This is non-destructive and idempotent.

---

## Section 2 — Converter Functions

### Replace `createMoneyAmount` with two explicit functions (`lib/currency.ts`)

```ts
// Income / expense — rate is locked at entry, never recalculated
createLockedAmount(amount: number, currency: Currency, rate: number | null): MoneyAmount
// Returns MoneyAmount with convertedAmountAtEntry + exchangeRateAtEntry set.

// Goals / savings — no stored conversion; display uses live rate at render time
createLiveAmount(amount: number, currency: Currency): MoneyAmount
// Returns MoneyAmount with only amount + currency; no convertedAmountAtEntry.
```

### Store dispatch by type (`store/moneyMapStore.ts`)

`addItemFromForm` and `updateItemFromForm` both use:

```ts
const isHistorical = payload.type === "income" || payload.type === "expense";
const rate = isHistorical ? get().exchangeRate.usdToToman : null;
const moneyAmount = createLockedAmount / createLiveAmount based on isHistorical
```

Goals use `createLiveAmount` for `targetAmount`; savings use `createLiveAmount` for `amount`.

### Backfill (`store/moneyMapStore.ts` — inside `fetchExchangeRate`)

After a successful rate fetch, scan all income and expense items. Any item whose `amount.convertedAmountAtEntry` is absent gets it computed from the freshly fetched rate and written back. This runs at most once per item (once the field is set it is never overwritten by the backfill). The `lastModifiedAt` timestamp is NOT advanced by the backfill (it is not a user mutation).

---

## Section 3 — Display

### `lib/formatters.ts` — `formatConvertedAmount`

- Update field references: `convertedAmount` → `convertedAmountAtEntry`, `convertedCurrency` unchanged.
- Change label from `"at time"` to `"· entry rate"`.
- The live-rate fallback path (used when no `convertedAmountAtEntry` is stored) remains unchanged — this path now only applies to goals and savings.

### `components/canvas/MoneyNode.tsx` — no changes

The existing rendering logic is already correct once the store and formatters are fixed:
- Income/expense items have `convertedAmountAtEntry` → shows locked value with `· entry rate` suffix.
- Goals/savings have no stored conversion → uses `animatedRate` (wiggled live) → no suffix.

### `components/settings/SettingsModal.tsx` — wiggled rate

Import and call `useAnimatedRate(exchangeRate.usdToToman)`. Replace the raw `exchangeRate.usdToToman` reference in the "USD rate" label with the wiggled `displayed` value. The `fetchedAt` timestamp row is unchanged.

---

## Section 4 — Tests

New file: `tests/currencyConversion.test.ts`

| # | Scenario | Expected |
|---|---|---|
| 1 | `createLockedAmount(100_000_000, "TOMAN", 200_000)` | `convertedAmountAtEntry === 500` |
| 2 | Income item created at rate 200,000; rate changes to 300,000 | Stored `convertedAmountAtEntry` still 500 |
| 3 | Expense item created at rate 200,000; rate changes to 300,000 | Stored `convertedAmountAtEntry` still fixed |
| 4 | `createLiveAmount(100_000_000, "TOMAN")` | No `convertedAmountAtEntry` field |
| 5 | Savings item — `formatConvertedAmount` with live rate 300,000 | Shows live conversion, no `· entry rate` suffix |
| 6 | Goal item — `formatConvertedAmount` with live rate 300,000 | Shows live conversion, no `· entry rate` suffix |

---

## Files Touched

| File | Change |
|---|---|
| `types/money.ts` | Rename `exchangeRateSnapshot` → `exchangeRateAtEntry`, `convertedAmount` → `convertedAmountAtEntry` |
| `lib/currency.ts` | Replace `createMoneyAmount` with `createLockedAmount` + `createLiveAmount` |
| `lib/formatters.ts` | Update field names; change label to `· entry rate` |
| `lib/analytics.ts` | Update field name references |
| `lib/document.ts` | Add field-name migration in `applyDocument` |
| `store/moneyMapStore.ts` | Dispatch by type; backfill in `fetchExchangeRate` |
| `components/settings/SettingsModal.tsx` | Use `useAnimatedRate` for displayed rate |
| `tests/currencyConversion.test.ts` | New test file (6 cases) |

## Out of Scope

- Renaming `createdAt`/`updatedAt` to `entryCreatedAt`/`entryUpdatedAt` — existing fields serve this purpose.
- Changing the wiggler tick interval or delta range.
- Any Supabase schema changes — `MoneyAmount` is stored as JSON inside the document blob.
