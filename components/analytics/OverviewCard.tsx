"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatAnalyticsAmount, type AnalyticsSummary } from "@/lib/analytics";
import { shamsiMonthAbbr, shiftMonth } from "@/lib/months";
import { isoToCalendarParts } from "@/lib/calendar";
import type { CalendarSystem } from "@/types/money";

type Timeframe = "1m" | "3m" | "6m" | "1y";
const TIMEFRAME_COUNT: Record<Timeframe, number> = { "1m": 2, "3m": 3, "6m": 6, "1y": 12 };
const GREGORIAN_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const VW = 400;
const CHART_TOP = 6;
const CHART_BOTTOM = 64;
const CHART_H = CHART_BOTTOM - CHART_TOP;

function getMonthLabels(selectedMonth: string, n: number, calendarSystem: CalendarSystem): string[] {
  return Array.from({ length: n }, (_, i) => {
    const iso = shiftMonth(selectedMonth, i - (n - 1));
    if (calendarSystem === "shamsi") {
      const parts = isoToCalendarParts(`${iso}-01`, "shamsi");
      return shamsiMonthAbbr[parts.month - 1];
    }
    return GREGORIAN_ABBR[parseInt(iso.split("-")[1], 10) - 1];
  });
}

function buildLinePath(values: number[], min: number, max: number): string {
  const span = max - min || 1;
  const n = values.length;
  const segW = VW / n;
  const pts = values.map((v, i) => ({
    x: segW * (i + 0.5),
    y: CHART_TOP + (1 - (v - min) / span) * CHART_H
  }));
  return pts.reduce((path, pt, i) => {
    if (i === 0) return `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpX = (prev.x + (pt.x - prev.x) * 0.5).toFixed(1);
    return `${path} C${cpX},${prev.y.toFixed(1)} ${cpX},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");
}

function buildAreaPath(values: number[], min: number, max: number): string {
  return `${buildLinePath(values, min, max)} L${VW},${CHART_BOTTOM} L0,${CHART_BOTTOM} Z`;
}

export function OverviewCard({
  summary,
  calendarSystem,
  selectedMonth
}: {
  summary: AnalyticsSummary;
  calendarSystem: CalendarSystem;
  selectedMonth: string;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("6m");
  const n = TIMEFRAME_COUNT[timeframe];

  const incomeVals = summary.overviewTrend.income.slice(-n).map((m) => m.value);
  const expenseVals = summary.overviewTrend.expense.slice(-n).map((m) => m.value);
  const labels = getMonthLabels(selectedMonth, n, calendarSystem);

  const allVals = [...incomeVals, ...expenseVals];
  const min = Math.min(...allVals) * 0.85;
  const max = Math.max(...allVals) * 1.08;

  const incomeLinePath = buildLinePath(incomeVals, min, max);
  const incomeArea = buildAreaPath(incomeVals, min, max);
  const expenseLinePath = buildLinePath(expenseVals, min, max);
  const expenseArea = buildAreaPath(expenseVals, min, max);

  const net = summary.flow.incomeTotal - summary.flow.expenseTotal;
  const netPositive = net >= 0;

  const segW = VW / n;
  const dividerXs = Array.from({ length: n - 1 }, (_, i) => segW * (i + 1));

  const chartKey = `${timeframe}-${summary.flow.incomeTotal}-${summary.flow.expenseTotal}`;

  return (
    <section className="rounded-[34px] bg-[#fffdf8] p-5 shadow-soft sm:p-6 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[21px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Overview</h3>
        <div className="flex gap-1.5">
          {(["1m", "3m", "6m", "1y"] as Timeframe[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors duration-150 ${
                timeframe === t ? "bg-[#2f333b] text-white" : "bg-[#f4f2ee] text-[#9a958d] hover:bg-[#ede9e3]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <motion.div
          key={`income-${summary.flow.incomeTotal}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-[16px] bg-[#f7f6f3] p-3"
        >
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#a09b94]">Income</div>
          <div className="text-[18px] font-bold leading-none tracking-[-0.04em] text-[#2f333b]">
            {formatAnalyticsAmount(summary.flow.incomeTotal, summary.currency, { compact: true })}
          </div>
        </motion.div>

        <motion.div
          key={`expense-${summary.flow.expenseTotal}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-[16px] bg-[#f7f6f3] p-3"
        >
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#a09b94]">Expenses</div>
          <div className="text-[18px] font-bold leading-none tracking-[-0.04em] text-[#2f333b]">
            {formatAnalyticsAmount(summary.flow.expenseTotal, summary.currency, { compact: true })}
          </div>
        </motion.div>

        <motion.div
          key={`net-${net}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-[16px] bg-[#f7f6f3] p-3"
        >
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#a09b94]">Net</div>
          <div
            className="text-[18px] font-bold leading-none tracking-[-0.04em]"
            style={{ color: netPositive ? "#5a9e6a" : "#c47060" }}
          >
            {netPositive ? "+" : "−"}
            {formatAnalyticsAmount(Math.abs(net), summary.currency, { compact: true })}
          </div>
        </motion.div>
      </div>

      <div className="overflow-hidden rounded-[18px] bg-[#fbfaf7] px-1 pb-1 pt-2">
        <svg
          viewBox={`0 0 ${VW} 80`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height: 96 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ov-income-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a8ceb0" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#a8ceb0" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="ov-expense-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7aeb7" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#e7aeb7" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {dividerXs.map((x) => (
            <line
              key={x}
              x1={x}
              y1={CHART_TOP}
              x2={x}
              y2={CHART_BOTTOM}
              stroke="#d8d4cc"
              strokeWidth="1"
              strokeDasharray="3,4"
            />
          ))}

          {labels.map((label, i) => (
            <text
              key={label + i}
              x={segW * (i + 0.5)}
              y={78}
              textAnchor="middle"
              fontSize="8"
              fill="#b5b0aa"
              fontFamily="var(--font-sf-pro), system-ui, sans-serif"
              fontWeight="600"
            >
              {label}
            </text>
          ))}

          <motion.path
            key={`ia-${chartKey}`}
            d={incomeArea}
            fill="url(#ov-income-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />

          <motion.path
            key={`il-${chartKey}`}
            d={incomeLinePath}
            fill="none"
            stroke="#a8ceb0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />

          <motion.path
            key={`ea-${chartKey}`}
            d={expenseArea}
            fill="url(#ov-expense-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          />

          <motion.path
            key={`el-${chartKey}`}
            d={expenseLinePath}
            fill="none"
            stroke="#e7aeb7"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          />
        </svg>
      </div>

      <div className="mt-2.5 flex items-center gap-3.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9a958d]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#a8ceb0]" />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9a958d]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#e7aeb7]" />
          Expenses
        </span>
      </div>
    </section>
  );
}
