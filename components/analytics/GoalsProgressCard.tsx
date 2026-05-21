"use client";

import Image from "next/image";
import { formatAnalyticsAmount, getGoalImage, type AnalyticsSummary } from "@/lib/analytics";

export function GoalsProgressCard({ summary }: { summary: AnalyticsSummary }) {
  return (
    <section className="rounded-[30px] bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Goals Progress</h3>
          <p className="mt-1 text-[14px] font-medium text-[#8d919e]">Savings destinations with practical pacing.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {summary.goals.slice(0, 3).map((goal) => {
          const circumference = 2 * Math.PI * 22;
          const dash = (goal.progress / 100) * circumference;

          return (
            <article key={goal.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-[24px] bg-[#fbfaf7] p-3.5">
              <div className="grid size-14 place-items-center overflow-hidden rounded-[20px] bg-white shadow-[0_10px_24px_rgba(76,74,68,0.08)]">
                <Image src={getGoalImage(goal.category)} alt="" width={48} height={48} className="size-12 object-contain" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-[17px] font-semibold leading-none tracking-[-0.02em] text-[#2f333b]">{goal.title}</div>
                <div className="mt-2 text-[13px] font-medium text-[#8d919e]">
                  {formatAnalyticsAmount(goal.saved, summary.currency, { compact: true })} / {formatAnalyticsAmount(goal.target, summary.currency, { compact: true })}
                </div>
                <div className="mt-1 text-[13px] font-medium text-[#a16325]">
                  +{formatAnalyticsAmount(goal.monthlyProgress, summary.currency, { compact: true })} this month
                  <span className="text-[#b5a491]"> · ~{goal.monthsLeft} months left</span>
                </div>
              </div>

              <div className="relative grid size-14 place-items-center">
                <svg className="absolute inset-0 size-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#eee7da" strokeWidth="7" />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="#d6a45c"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                  />
                </svg>
                <span className="text-[13px] font-bold text-[#2f333b]">{goal.progress}%</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
