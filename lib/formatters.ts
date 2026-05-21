import { formatCalendarDate } from "@/lib/calendar";
import type { CalendarSystem, MoneyAmount } from "@/types/money";

export function formatPrimaryAmount(amount?: MoneyAmount) {
  if (!amount) return "";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount.currency === "USD" ? 2 : 0
  }).format(amount.amount);

  return amount.currency === "USD" ? `$${formatted}` : `${formatted} T`;
}

export function formatConvertedAmount(amount?: MoneyAmount) {
  if (!amount?.convertedAmount || !amount.convertedCurrency) return "~ $300 at time";

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount.convertedCurrency === "USD" ? 2 : 0
  }).format(amount.convertedAmount);

  const value = amount.convertedCurrency === "USD" ? `$${formatted}` : `${formatted} T`;
  return `~ ${value} at time`;
}

export function formatDateLabel(date?: string, calendarSystem: CalendarSystem = "shamsi") {
  if (calendarSystem === "shamsi") return formatCalendarDate(date, "shamsi");
  if (!date) return "2026, may 20";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "2026, may 20";

  const month = parsed.toLocaleString("en-US", { month: "short" }).toLowerCase();
  return `${parsed.getFullYear()}, ${month} ${parsed.getDate()}`;
}
