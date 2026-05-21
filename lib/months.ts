import { gregorianMonthNames, isoToCalendarParts } from "@/lib/calendar";
import type { CalendarSystem } from "@/types/money";

const fallbackMonth = "2026-05";
const shamsiMonthAbbreviations = ["FAR", "ORD", "KHO", "TIR", "MOR", "SHA", "MHR", "ABN", "AZR", "DEY", "BAH", "ESF"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeMonth(month: string | undefined | null) {
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;
  return fallbackMonth;
}

export function shiftMonth(month: string, delta: number) {
  const normalized = normalizeMonth(month);
  const [year, monthNumber] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1, 12));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function formatMonthLabel(month: string, calendarSystem: CalendarSystem) {
  const normalized = normalizeMonth(month);
  const parts = isoToCalendarParts(`${normalized}-01`, calendarSystem);
  const names = calendarSystem === "shamsi" ? shamsiMonthAbbreviations : gregorianMonthNames;
  return `${names[parts.month - 1]} ${parts.year}`;
}

export function isItemInMonth(item: { date?: string }, month: string) {
  if (!item.date) return false;
  return item.date.slice(0, 7) === normalizeMonth(month);
}
