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

// Suppress unused variable warning for rate2
void rate2;
