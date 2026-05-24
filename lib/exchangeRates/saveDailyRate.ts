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
