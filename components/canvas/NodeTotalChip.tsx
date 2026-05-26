"use client";

import { formatAnalyticsAmount } from "@/lib/analytics";
import type { Currency, MoneyNodeType } from "@/types/money";

const tintClasses: Record<MoneyNodeType, string> = {
  income:  "bg-[rgba(232,246,221,0.9)] text-[#2d7f36] border-[#2d7f36]/10",
  expense: "bg-[rgba(249,221,226,0.9)] text-[#d9344f] border-[#d9344f]/10",
  savings: "bg-[rgba(255,241,215,0.9)] text-[#a16325] border-[#a16325]/10",
  goal:    "bg-[rgba(255,241,215,0.9)] text-[#a16325] border-[#a16325]/10",
  bucket:  "bg-[rgba(247,246,243,0.9)] text-[#6b6860] border-black/[0.06]",
};

interface NodeTotalChipProps {
  total: number;
  currency: Currency;
  nodeType: MoneyNodeType;
  secondaryTotal?: number;
  secondaryCurrency?: Currency;
}

export function NodeTotalChip({
  total,
  currency,
  nodeType,
  secondaryTotal,
  secondaryCurrency,
}: NodeTotalChipProps) {
  if (total === 0) return null;

  const sign = nodeType === "expense" ? "-" : "";
  const label = `${sign}${formatAnalyticsAmount(total, currency, { compact: true })}`;

  const secondaryLabel =
    secondaryTotal != null && secondaryTotal > 0 && secondaryCurrency
      ? `≈ ${formatAnalyticsAmount(secondaryTotal, secondaryCurrency, { compact: true })}`
      : "Secondary value unavailable";

  return (
    <div className="nodrag relative hidden md:flex group/chip">
      <span
        className={`inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold leading-none select-none cursor-default ${tintClasses[nodeType]}`}
      >
        {label}
      </span>
      {/* Desktop-only CSS hover tooltip — no portal, no JS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/chip:opacity-100 z-50"
      >
        <div className="whitespace-nowrap rounded-full bg-[#fafaf7] px-3 py-1 text-[11px] font-medium text-[#4a4740] shadow-[0_4px_16px_rgba(0,0,0,0.10)] border border-black/[0.06]">
          {secondaryLabel}
        </div>
      </div>
    </div>
  );
}
