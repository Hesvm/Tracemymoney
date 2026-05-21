const API_KEY = process.env.NEXT_PUBLIC_NAVASAN_API_KEY ?? "free4hjNTRd62AyJ6gzkIuuLQY8vZ4wz";
const NAVASAN_URL = `https://api.navasan.tech/latest/?api_key=${API_KEY}`;

type NavasanRate = {
  value?: string | number;
};

export async function fetchUsdToTomanRate(): Promise<number> {
  const response = await fetch(NAVASAN_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Navasan request failed with ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, NavasanRate | undefined>;
  const candidates = ["usd", "usd_sell", "dollar", "usdt", "usd_buy"];

  for (const key of candidates) {
    const raw = payload[key]?.value;
    const rate = typeof raw === "string" ? Number(raw.replace(/,/g, "")) : raw;
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      return rate;
    }
  }

  throw new Error("USD/Toman rate was not found in the Navasan response");
}
