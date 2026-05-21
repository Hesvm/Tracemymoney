"use client";

import { formatAnalyticsAmount, type AnalyticsSummary } from "@/lib/analytics";

export function RealValueCard({ summary }: { summary: AnalyticsSummary }) {
  return (
    <section className="rounded-[30px] bg-white p-5 shadow-soft">
      <h3 className="text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Real Value</h3>
      <p className="mt-1 text-[14px] font-medium text-[#8d919e]">Nominal money and real-value perspective in one place.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-[#fbfaf7] p-4">
          <div className="text-[13px] font-semibold text-[#8d919e]">Toman</div>
          <div className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.04em] text-[#2f333b]">
            {formatAnalyticsAmount(summary.realValue.tomanIncome, "TOMAN", { compact: true })}
          </div>
        </div>
        <div className="rounded-[24px] bg-[#fbfaf7] p-4">
          <div className="text-[13px] font-semibold text-[#8d919e]">USD</div>
          <div className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.04em] text-[#2f333b]">
            {formatAnalyticsAmount(summary.realValue.usdIncome, "USD")}
          </div>
        </div>
      </div>

      <p className="mt-5 rounded-[24px] bg-[#f7f6f3] p-4 text-[15px] font-medium leading-[1.35] text-[#626677]">
        Your income increased {summary.realValue.tomanGrowthPct}% in Toman, but only {summary.realValue.usdGrowthPct}% in USD value.
      </p>
    </section>
  );
}
