"use client";

import Image from "next/image";
import type { AnalyticsCurrency } from "@/lib/analytics";

export function CurrencyPerspectiveToggle({
  value,
  onChange
}: {
  value: AnalyticsCurrency;
  onChange: (currency: AnalyticsCurrency) => void;
}) {
  return (
    <div className="inline-flex h-11 items-center gap-1 rounded-full bg-white px-1.5 shadow-dock" aria-label="Currency perspective">
      {[
        { value: "TOMAN" as const, label: "Toman", icon: "/currency/iran.svg" },
        { value: "USD" as const, label: "USD", icon: "/currency/us.svg" }
      ].map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex h-8 items-center gap-2 rounded-full px-3 text-[14px] font-semibold transition active:scale-95 ${
              active ? "bg-[#f3f0e9] text-[#2f333b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" : "text-[#8d919e] hover:text-[#626677]"
            }`}
            aria-pressed={active}
          >
            <Image src={option.icon} alt="" width={18} height={18} className="size-[18px] rounded-full" aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
