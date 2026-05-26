import { gregorianMonthNames, isoToCalendarParts } from "@/lib/calendar";
import type { CalendarSystem } from "@/types/money";

const fallbackMonth = "2026-05";
const shamsiMonthAbbreviations = ["FAR", "ORD", "KHO", "TIR", "MOR", "SHA", "MHR", "ABN", "AZR", "DEY", "BAH", "ESF"];
export const shamsiMonthAbbr = ["Far", "Ord", "Kho", "Tir", "Mor", "Sha", "Mhr", "Abn", "Azr", "Dey", "Bah", "Esf"];

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

export function isItemInMonth(item: { date?: string; recurrence?: string }, month: string) {
  if (!item.date) return false;
  const itemMonth = item.date.slice(0, 7);
  const targetMonth = normalizeMonth(month);

  if (!item.recurrence || item.recurrence === "none") {
    return itemMonth === targetMonth;
  }

  // recurring items appear in every applicable month on or after creation
  if (item.recurrence === "monthly" || item.recurrence === "daily" || item.recurrence === "weekly") {
    return targetMonth >= itemMonth;
  }

  if (item.recurrence === "yearly") {
    const [itemYear, itemMth] = itemMonth.split("-");
    const [targetYear, targetMth] = targetMonth.split("-");
    return targetMth === itemMth && targetYear >= itemYear;
  }

  return itemMonth === targetMonth;
}

export function formatShortDate(isoDate: string | undefined, calendarSystem: CalendarSystem): string {
  if (!isoDate) return "";
  const parts = isoToCalendarParts(isoDate, calendarSystem);
  if (calendarSystem === "shamsi") {
    return `${shamsiMonthAbbr[parts.month - 1]} ${parts.day}`;
  }
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.toLocaleString("en-US", { month: "short" })} ${parsed.getDate()}`;
}
