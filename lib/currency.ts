import type { Currency, MoneyAmount } from "@/types/money";

export function createMoneyAmount(amount: number, currency: Currency, usdToToman: number | null): MoneyAmount {
  if (!Number.isFinite(amount)) {
    return { amount: 0, currency };
  }

  if (!usdToToman) {
    return { amount, currency };
  }

  if (currency === "USD") {
    return {
      amount,
      currency,
      convertedAmount: Math.round(amount * usdToToman),
      convertedCurrency: "TOMAN",
      exchangeRateSnapshot: usdToToman
    };
  }

  return {
    amount,
    currency,
    convertedAmount: Number((amount / usdToToman).toFixed(2)),
    convertedCurrency: "USD",
    exchangeRateSnapshot: usdToToman
  };
}
