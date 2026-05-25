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
    <header className="sticky top-0 z-10 bg-[#fbfaf7]/95 px-4 pb-3 pt-4 backdrop-blur sm:px-7 sm:pb-4 sm:pt-5">

      {/* ── Mobile layout (< sm): 3 stacked rows ── */}
      <div className="sm:hidden">
        {/* Row 1: title + close */}
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">
            Analytics
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white text-[#8e92a0] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
            aria-label="Close analytics"
          >
            <X className="size-4" strokeWidth={2.1} />
          </button>
        </div>
        {/* Row 2: currency toggle */}
        <div className="mt-3 flex justify-center">
          <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
        </div>
        {/* Row 3: month nav */}
        <div className="mt-2 flex justify-center">
          <div
            className="flex h-9 items-center gap-0.5 rounded-full bg-white px-1.5 text-[#626677] shadow-dock"
            aria-label={`Selected month ${monthLabel}`}
          >
            <button
              type="button"
              onClick={onPreviousMonth}
              className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" strokeWidth={2.4} />
            </button>
            <div className="min-w-[90px] text-center text-[12px] font-semibold">{monthLabel}</div>
            <button
              type="button"
              onClick={onNextMonth}
              className="grid size-6 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop layout (≥ sm): original 3-column grid ── */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-[27px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Analytics</h2>
        </div>
        <div className="justify-self-center">
          <CurrencyPerspectiveToggle value={currency} onChange={onCurrencyChange} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <div
            className="flex h-10 items-center gap-1 rounded-full bg-white px-2 text-[#626677] shadow-dock"
            aria-label={`Selected month ${monthLabel}`}
          >
            <button
              type="button"
              onClick={onPreviousMonth}
              className="grid size-7 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-[18px]" strokeWidth={2.4} />
            </button>
            <div className="min-w-[122px] text-center text-[14px] font-semibold">{monthLabel}</div>
            <button
              type="button"
              onClick={onNextMonth}
              className="grid size-7 place-items-center rounded-full text-[#a0a3ae] transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="size-[18px]" strokeWidth={2.4} />
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
      </div>

    </header>
  );
}
