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
