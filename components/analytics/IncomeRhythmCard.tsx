"use client";

import { formatAnalyticsAmount, type AnalyticsSummary } from "@/lib/analytics";

export function IncomeRhythmCard({ summary }: { summary: AnalyticsSummary }) {
  const max = Math.max(...summary.monthlyIncome.map((item) => item.value), 1);

  return (
    <section className="rounded-[30px] bg-white p-5 shadow-soft">
      <h3 className="text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Income Rhythm</h3>
      <p className="mt-1 text-[14px] font-medium text-[#8d919e]">Last six months, kept intentionally simple.</p>

      <div className="mt-7 flex h-40 items-end gap-3 rounded-[24px] bg-[#fbfaf7] px-4 pb-4 pt-6">
        {summary.monthlyIncome.map((month) => (
          <div key={month.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-full bg-[#a8ceb0] shadow-[0_10px_24px_rgba(69,126,78,0.12)] transition-[height] duration-300 ease-out"
                style={{ height: `${Math.max(14, (month.value / max) * 100)}%` }}
                title={formatAnalyticsAmount(month.value, summary.currency, { compact: true })}
              />
            </div>
            <span className="text-[12px] font-semibold text-[#8d919e]">{month.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[14px] font-medium leading-[1.35] text-[#626677]">
        Your income is {Math.abs(summary.incomeVsAveragePct)}% {summary.incomeVsAveragePct >= 0 ? "higher" : "lower"} than the 6-month average of{" "}
        {formatAnalyticsAmount(summary.sixMonthAverage, summary.currency, { compact: true })}.
      </p>
    </section>
  );
}
