"use client";

import { formatAnalyticsAmount, type AnalyticsSummary } from "@/lib/analytics";

export function MoneyLeaksCard({ summary }: { summary: AnalyticsSummary }) {
  const max = Math.max(...summary.leaks.map((item) => item.value), 1);

  return (
    <section className="rounded-[30px] bg-white p-5 shadow-soft">
      <h3 className="text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Money Leaks</h3>
      <p className="mt-1 text-[14px] font-medium text-[#8d919e]">The outgoing streams that deserve a second look.</p>

      <div className="mt-6 grid gap-4">
        {summary.leaks.map((item) => (
          <div key={item.label} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-[14px] font-semibold">
              <span className="truncate text-[#626677]">{item.label}</span>
              <span className="shrink-0 text-[#2f333b]">{formatAnalyticsAmount(item.value, summary.currency, { compact: true })}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#f1eee8]">
              <div
                className="h-full rounded-full bg-[#d7b990] transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
