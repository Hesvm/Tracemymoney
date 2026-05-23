const KEY_PREFIX = "amt-suggestions:";
const MAX = 4;

function key(title: string) {
  return `${KEY_PREFIX}${title.toLowerCase().trim()}`;
}

export function getAmountSuggestions(title: string): number[] {
  if (typeof window === "undefined" || !title.trim()) return [];
  try {
    return JSON.parse(localStorage.getItem(key(title)) ?? "[]") as number[];
  } catch {
    return [];
  }
}

export function saveAmountSuggestion(title: string, amount: number): void {
  if (typeof window === "undefined" || !title.trim() || !amount) return;
  try {
    const existing = getAmountSuggestions(title);
    const updated = [amount, ...existing.filter((a) => a !== amount)].slice(0, MAX);
    localStorage.setItem(key(title), JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently skip
  }
}
