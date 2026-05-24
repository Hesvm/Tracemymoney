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
