"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CurrencyPerspectiveToggle } from "@/components/analytics/CurrencyPerspectiveToggle";
import { formatMonthLabel } from "@/lib/months";
import type { AnalyticsCurrency } from "@/lib/analytics";
import type { CalendarSystem } from "@/types/money";

export function AnalyticsHeader({
  currency,
  selectedMonth,
  calendarSystem,
  onPreviousMonth,
  onNextMonth,
  onCurrencyChange,
  onClose
}: {
  currency: AnalyticsCurrency;
  selectedMonth: string;
  calendarSystem: CalendarSystem;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrencyChange: (currency: AnalyticsCurrency) => void;
  onClose: () => void;
}) {
  const monthLabel = formatMonthLabel(selectedMonth, calendarSystem);

  return (
    <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-[#fbfaf7]/95 px-5 pb-4 pt-5 backdrop-blur sm:px-7">
      <div className="min-w-0">
        <h2 className="text-[20px] sm:text-[27px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Analytics</h2>
      </div>

      <div className="justify-self-center">
        <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="flex h-9 items-center gap-0.5 rounded-full bg-white px-1.5 text-[#626677] shadow-dock sm:h-10 sm:gap-1 sm:px-2" aria-label={`Selected month ${monthLabel}`}>
          <button
            type="button"
            onClick={onPreviousMonth}
            className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-7"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4 sm:size-[18px]" strokeWidth={2.4} />
          </button>
          <div className="min-w-[90px] text-center text-[12px] font-semibold sm:min-w-[122px] sm:text-[14px]">{monthLabel}</div>
          <button
            type="button"
            onClick={onNextMonth}
            className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 sm:size-7"
            aria-label="Next month"
          >
            <ChevronRight className="size-4 sm:size-[18px]" strokeWidth={2.4} />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-white text-[#8e92a0] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
          aria-label="Close analytics"
        >
          <X className="size-5" strokeWidth={2.1} />
        </button>
      </div>
    </header>
  );
}
