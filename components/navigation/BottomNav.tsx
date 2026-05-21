"use client";

import React from "react";
import { BarChart3, ChevronLeft, ChevronRight, Plus, Search, Settings } from "lucide-react";
import { formatMonthLabel } from "@/lib/months";
import { useMoneyMapStore } from "@/store/moneyMapStore";

const DockButton = React.forwardRef<HTMLButtonElement, {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}>(function DockButton({ children, label, onClick, className = "" }, ref) {
  return (
    <button
      ref={ref}
      className={`grid size-11 place-items-center rounded-full bg-white text-[#989ba8] shadow-dock transition hover:bg-[#f7f6f3] hover:text-[#626677] active:scale-95 ${className}`}
      onClick={onClick}
      aria-label={label}
      type="button"
    >
      {children}
    </button>
  );
});

export function BottomNav({
  onAddClick,
  onAnalyticsClick,
  onSettingsClick,
  onSearchClick,
  analyticsOpen,
  addButtonRef
}: {
  onAddClick: () => void;
  onAnalyticsClick: () => void;
  onSettingsClick: () => void;
  onSearchClick: () => void;
  analyticsOpen?: boolean;
  addButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const selectedMonth = useMoneyMapStore((state) => state.selectedMonth);
  const calendarSystem = useMoneyMapStore((state) => state.calendarSystem);
  const shiftSelectedMonth = useMoneyMapStore((state) => state.shiftSelectedMonth);
  const [monthName, year] = formatMonthLabel(selectedMonth, calendarSystem).split(" ");

  return (
    <nav className="fixed bottom-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" aria-label="Money map controls">
      <DockButton label="Add item" onClick={onAddClick} ref={addButtonRef}>
        <Plus className="size-6" strokeWidth={1.9} />
      </DockButton>
      <div className="flex h-11 items-center gap-1 rounded-full bg-white px-2 text-[#30333b] shadow-dock">
        <button className="grid size-6 place-items-center text-[#a0a3ae] transition hover:text-[#626677]" aria-label="Previous month" type="button" onClick={() => shiftSelectedMonth(-1)}>
          <ChevronLeft className="size-[18px]" strokeWidth={2.4} />
        </button>
        <div className="min-w-[86px] text-center text-[18px] leading-none">
          <span className="font-semibold">{monthName}</span>{" "}
          <span className="font-light text-[#a0a3ae]">{year}</span>
        </div>
        <button className="grid size-6 place-items-center text-[#a0a3ae] transition hover:text-[#626677]" aria-label="Next month" type="button" onClick={() => shiftSelectedMonth(1)}>
          <ChevronRight className="size-[18px]" strokeWidth={2.4} />
        </button>
      </div>
      <DockButton label="Analytics" onClick={onAnalyticsClick} className={analyticsOpen ? "bg-[#f3f0e9] text-[#626677]" : ""}>
        <BarChart3 className="size-5" strokeWidth={2.1} />
      </DockButton>
      <DockButton label="Settings" onClick={onSettingsClick}>
        <Settings className="size-5" strokeWidth={2.1} />
      </DockButton>
      <DockButton label="Search" onClick={onSearchClick}>
        <Search className="size-5" strokeWidth={2.1} />
      </DockButton>
    </nav>
  );
}
