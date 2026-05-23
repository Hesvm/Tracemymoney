"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { GoalsProgressCard } from "@/components/analytics/GoalsProgressCard";
import { IncomeRhythmCard } from "@/components/analytics/IncomeRhythmCard";
import { MoneyFlowReplay } from "@/components/analytics/MoneyFlowReplay";
import { MoneyLeaksCard } from "@/components/analytics/MoneyLeaksCard";
import { RealValueCard } from "@/components/analytics/RealValueCard";
import { getAnalyticsSummary, type AnalyticsCurrency } from "@/lib/analytics";
import { isItemInMonth } from "@/lib/months";
import { useMoneyMapStore } from "@/store/moneyMapStore";

export function AnalyticsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [analyticsCurrency, setAnalyticsCurrency] = useState<AnalyticsCurrency>("TOMAN");
  const items = useMoneyMapStore((state) => state.items);
  const exchangeRate = useMoneyMapStore((state) => state.exchangeRate.usdToToman);
  const selectedMonth = useMoneyMapStore((state) => state.selectedMonth);
  const calendarSystem = useMoneyMapStore((state) => state.calendarSystem);
  const shiftSelectedMonth = useMoneyMapStore((state) => state.shiftSelectedMonth);
  const visibleItems = useMemo(() => items.filter((item) => isItemInMonth(item, selectedMonth)), [items, selectedMonth]);
  const summary = useMemo(() => getAnalyticsSummary(visibleItems, analyticsCurrency, exchangeRate, selectedMonth), [analyticsCurrency, exchangeRate, selectedMonth, visibleItems]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="analytics-backdrop"
          className="fixed inset-0 z-30 grid place-items-center bg-[#7e7567]/16 px-3 py-4 backdrop-blur-[2px] sm:px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          onClick={onClose}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-hidden="true"
            tabIndex={-1}
            onMouseDown={onClose}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="analytics-title"
            className="relative z-10 flex h-[88vh] w-[92vw] max-w-[820px] flex-col overflow-hidden rounded-[36px] bg-[#fbfaf7] shadow-[0_34px_90px_rgba(76,74,68,0.22),0_2px_0_rgba(255,255,255,0.82)_inset]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div id="analytics-title" className="sr-only">
              Analytics
            </div>
            <AnalyticsHeader
              currency={analyticsCurrency}
              selectedMonth={selectedMonth}
              calendarSystem={calendarSystem}
              onPreviousMonth={() => shiftSelectedMonth(-1)}
              onNextMonth={() => shiftSelectedMonth(1)}
              onCurrencyChange={setAnalyticsCurrency}
              onClose={onClose}
            />

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-7">
              <div className="grid grid-cols-1 gap-4 pb-2 lg:grid-cols-2">
                <MoneyFlowReplay summary={summary} />
                <RealValueCard summary={summary} />
                <GoalsProgressCard summary={summary} />
                <MoneyLeaksCard summary={summary} />
                <IncomeRhythmCard summary={summary} />
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
