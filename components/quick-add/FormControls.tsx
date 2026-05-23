"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  calendarPartsToIso,
  formatCalendarDate,
  getCalendarMonthLength,
  getCalendarWeekday,
  gregorianMonthNames,
  isoToCalendarParts,
  shamsiMonthNames,
  todayIsoDate
} from "@/lib/calendar";
import type { CalendarSystem, Currency, GoalCategory, RecurrenceType } from "@/types/money";

type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

const triggerClass =
  "flex h-12 w-full items-center justify-between rounded-full bg-[#fbfaf7] px-4 text-left text-[15px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition hover:bg-white focus-visible:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]";

export const recurrenceOptions: Array<DropdownOption<RecurrenceType>> = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

export const goalCategories: Array<{ value: GoalCategory; label: string; image: string }> = [
  { value: "car", label: "Car", image: "/goal-categories/car.webp" },
  { value: "phone", label: "Phone", image: "/goal-categories/phone-thiings-v2.webp" },
  { value: "trip", label: "Trip", image: "/goal-categories/trip.webp" },
  { value: "gift", label: "Gift", image: "/goal-categories/gift.webp" },
  { value: "house", label: "House", image: "/goal-categories/house.webp" },
  { value: "laptop", label: "Laptop", image: "/goal-categories/laptop.webp" },
  { value: "boat", label: "Boat", image: "/goal-categories/boat-thiings-v2.webp" },
  { value: "gaming-console", label: "Gaming Console", image: "/goal-categories/gaming-console-thiings-v2.webp" },
  { value: "watch", label: "Watch", image: "/goal-categories/watch-thiings-v2.webp" },
  { value: "other", label: "Other", image: "/goal-categories/other-thiings-v2.webp" }
];

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [onClose, open]);

  return ref;
}

export function StyledDropdown<T extends string>({
  value,
  options,
  onChange,
  label
}: {
  value: T;
  options: Array<DropdownOption<T>>;
  onChange: (value: T) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button className={triggerClass} type="button" aria-label={label} onClick={() => setOpen((current) => !current)}>
        <span>{selected.label}</span>
        <ChevronDown className={`size-4 text-[#9a9da9] transition ${open ? "rotate-180" : ""}`} strokeWidth={2.2} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-[22px] bg-white p-1.5 shadow-soft">
          {options.map((option) => (
            <button
              key={option.value}
              className={`flex h-10 w-full items-center justify-between rounded-full px-3 text-left text-[14px] transition ${
                option.value === value ? "bg-[#f1ede5] text-[#2f333b]" : "text-[#737786] hover:bg-[#fbfaf7]"
              }`}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {option.value === value && <Check className="size-4 text-[#8d8575]" strokeWidth={2.2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAmountDisplay(raw: string, currency: Currency) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "");
  const formattedInteger = integer ? Number(integer).toLocaleString("en-US") : "";

  if (currency === "TOMAN") return formattedInteger;
  if (decimalParts.length === 0) return formattedInteger;

  return `${formattedInteger || "0"}.${decimalParts.join("").slice(0, 2)}`;
}

function parseAmount(display: string, currency: Currency) {
  const cleaned = display.replace(/[^\d.]/g, "");
  const normalized = currency === "TOMAN" ? cleaned.split(".")[0] : cleaned;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function caretFromDigitCount(value: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seen += 1;
    if (seen >= digitCount) return index + 1;
  }
  return value.length;
}

export function AmountInput({
  currency,
  value,
  onValueChange,
  resetKey
}: {
  currency: Currency;
  value: number;
  onValueChange: (value: number) => void;
  resetKey: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(value ? formatAmountDisplay(String(value), currency) : "");
  }, [currency, resetKey, value]);

  return (
    <input
      ref={inputRef}
      className="h-12 rounded-full bg-[#fbfaf7] px-4 text-[15px] text-[#2f333b] shadow-[inset_0_0_0_1px_#ecebe7] outline-none transition placeholder:text-[#b1b1b8] hover:bg-white focus:bg-white focus:shadow-[inset_0_0_0_1px_#d7d1c4,0_0_0_4px_rgba(215,209,196,0.22)]"
      inputMode={currency === "USD" ? "decimal" : "numeric"}
      name="amountDisplay"
      placeholder="60,000,000"
      value={display}
      onChange={(event) => {
        const nextRaw = event.target.value;
        const caret = event.target.selectionStart ?? nextRaw.length;
        const digitsBeforeCaret = nextRaw.slice(0, caret).replace(/\D/g, "").length;
        const nextDisplay = formatAmountDisplay(nextRaw, currency);

        setDisplay(nextDisplay);
        onValueChange(parseAmount(nextDisplay, currency));

        window.requestAnimationFrame(() => {
          const nextCaret = caretFromDigitCount(nextDisplay, digitsBeforeCaret);
          inputRef.current?.setSelectionRange(nextCaret, nextCaret);
        });
      }}
      required
    />
  );
}

export function CurrencySegmentedToggle({ value, onChange }: { value: Currency; onChange: (currency: Currency) => void }) {
  const options: Array<{ value: Currency; label: string; image: string }> = [
    { value: "TOMAN", label: "Toman", image: "/currency/iran.svg" },
    { value: "USD", label: "USD", image: "/currency/us.svg" }
  ];

  return (
    <div className="grid h-12 grid-cols-2 rounded-full bg-[#fbfaf7] p-1 shadow-[inset_0_0_0_1px_#ecebe7]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`flex items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-semibold transition ${
            value === option.value ? "bg-white text-[#2f333b] shadow-[0_8px_18px_rgba(91,82,65,0.12)]" : "text-[#8c90a0] hover:text-[#626677]"
          }`}
          onClick={() => onChange(option.value)}
        >
          <Image className="size-5 rounded-full object-cover" src={option.image} width={20} height={20} alt="" aria-hidden="true" />
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StyledDatePicker({
  value,
  onChange,
  calendarSystem
}: {
  value: string;
  onChange: (isoDate: string) => void;
  calendarSystem: CalendarSystem;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => isoToCalendarParts(value || todayIsoDate(), calendarSystem));
  const ref = useOutsideClose(open, () => setOpen(false));
  const monthNames = calendarSystem === "shamsi" ? shamsiMonthNames : gregorianMonthNames;

  useEffect(() => {
    setView(isoToCalendarParts(value || todayIsoDate(), calendarSystem));
  }, [calendarSystem, value]);

  function shiftMonth(delta: number) {
    setView((current) => {
      const nextMonth = current.month + delta;
      if (nextMonth < 1) return { year: current.year - 1, month: 12, day: 1 };
      if (nextMonth > 12) return { year: current.year + 1, month: 1, day: 1 };
      return { ...current, month: nextMonth, day: 1 };
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button className={triggerClass} type="button" onClick={() => setOpen((current) => !current)}>
        <span>{formatCalendarDate(value, calendarSystem)}</span>
        <CalendarDays className="size-4 text-[#9a9da9]" strokeWidth={2.2} />
      </button>
      {open && (
        <StyledCalendarPopover
          calendarSystem={calendarSystem}
          monthNames={monthNames}
          selectedIso={value}
          view={view}
          onSelect={(isoDate) => {
            onChange(isoDate);
            setOpen(false);
          }}
          onPrevious={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />
      )}
    </div>
  );
}

export function StyledCalendarPopover({
  calendarSystem,
  monthNames,
  selectedIso,
  view,
  onSelect,
  onPrevious,
  onNext
}: {
  calendarSystem: CalendarSystem;
  monthNames: string[];
  selectedIso: string;
  view: { year: number; month: number; day: number };
  onSelect: (isoDate: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const days = useMemo(() => {
    const length = getCalendarMonthLength(view.year, view.month, calendarSystem);
    const firstWeekday = getCalendarWeekday({ year: view.year, month: view.month, day: 1 }, calendarSystem);
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length }, (_, index) => index + 1)
    ];
  }, [calendarSystem, view.month, view.year]);

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[292px] rounded-[26px] bg-white p-3 shadow-soft">
      <div className="mb-3 flex items-center justify-between px-1">
        <button className="grid size-8 place-items-center rounded-full text-[#9a9da9] transition hover:bg-[#f7f6f3] hover:text-[#626677]" type="button" onClick={onPrevious} aria-label="Previous month">
          <ChevronLeft className="size-4" strokeWidth={2.4} />
        </button>
        <div className="text-center text-[15px] font-semibold text-[#2f333b]">
          {monthNames[view.month - 1]} {view.year}
        </div>
        <button className="grid size-8 place-items-center rounded-full text-[#9a9da9] transition hover:bg-[#f7f6f3] hover:text-[#626677]" type="button" onClick={onNext} aria-label="Next month">
          <ChevronRight className="size-4" strokeWidth={2.4} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#a0a3ae]">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="size-9" />;
          const iso = calendarPartsToIso({ year: view.year, month: view.month, day }, calendarSystem);
          const selected = iso === selectedIso;

          return (
            <button
              key={iso}
              className={`grid size-9 place-items-center rounded-full text-[13px] font-medium transition ${
                selected ? "bg-[#2f333b] text-white shadow-[0_8px_18px_rgba(47,51,59,0.16)]" : "text-[#555b68] hover:bg-[#fbfaf7]"
              }`}
              type="button"
              onClick={() => onSelect(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GoalCategoryChips({
  value,
  onChange
}: {
  value: GoalCategory;
  onChange: (category: GoalCategory) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2" aria-label="Goal categories">
      {goalCategories.map((category) => (
        <button
          key={category.value}
          type="button"
          className={`grid size-12 place-items-center overflow-hidden rounded-full transition ${
            value === category.value
              ? "bg-white shadow-[inset_0_0_0_1px_#d8d1c4,0_8px_18px_rgba(91,82,65,0.10)]"
              : "bg-[#fbfaf7] shadow-[inset_0_0_0_1px_#ecebe7] hover:bg-white"
          }`}
          aria-label={category.label}
          onClick={() => onChange(category.value)}
        >
          <Image className="size-10 rounded-full object-cover" src={category.image} width={40} height={40} alt="" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
