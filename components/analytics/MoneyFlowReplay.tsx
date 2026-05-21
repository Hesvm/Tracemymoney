"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { formatAnalyticsAmount, type AnalyticsSummary } from "@/lib/analytics";

type FlowNode = {
  id: string;
  color: string;
  valueLabel: string;
};

type FlowLink = {
  source: string;
  target: string;
  value: number;
  startColor: string;
  endColor: string;
};

const nodeColors: Record<string, string> = {
  Income: "#a8ceb0",
  Savings: "#d8b873",
  Goal: "#d9c4ae",
  "Daily Expenses": "#e0c8bc"
};

function compactValue(value: number) {
  return Math.max(1, Number(value.toFixed(2)));
}

export function MoneyFlowReplay({ summary }: { summary: AnalyticsSummary }) {
  const { currency, flow } = summary;
  const topExpenseLabel = flow.topExpenseLabel || "Rent";
  const secondaryExpenseLabel = flow.secondaryExpenseLabel || "Daily Expenses";
  const goalLabel = summary.goals[0]?.title || "Dubai Trip";
  const topExpenseValue = flow.expenseTotal * 0.62;
  const expenseRemainder = Math.max(flow.expenseTotal - flow.expenseTotal * 0.62, 0);
  const savingsTarget = Math.max(summary.goals[0]?.saved ?? flow.savingsTotal, 0);
  const sankeyData = {
    nodes: [
      { id: "Income", color: nodeColors.Income, valueLabel: formatAnalyticsAmount(flow.incomeTotal, currency, { compact: true }) },
      { id: topExpenseLabel, color: "#e7aeb7", valueLabel: formatAnalyticsAmount(topExpenseValue, currency, { compact: true }) },
      { id: secondaryExpenseLabel, color: nodeColors["Daily Expenses"], valueLabel: formatAnalyticsAmount(expenseRemainder, currency, { compact: true }) },
      { id: "Savings", color: nodeColors.Savings, valueLabel: formatAnalyticsAmount(flow.savingsTotal, currency, { compact: true }) },
      { id: goalLabel, color: nodeColors.Goal, valueLabel: formatAnalyticsAmount(savingsTarget || flow.savingsTotal, currency, { compact: true }) }
    ],
    links: [
      {
        source: "Income",
        target: topExpenseLabel,
        value: compactValue(topExpenseValue),
        startColor: nodeColors.Income,
        endColor: "#e7aeb7"
      },
      {
        source: "Income",
        target: secondaryExpenseLabel,
        value: compactValue(expenseRemainder),
        startColor: nodeColors.Income,
        endColor: nodeColors["Daily Expenses"]
      },
      {
        source: "Income",
        target: "Savings",
        value: compactValue(flow.savingsTotal),
        startColor: nodeColors.Income,
        endColor: nodeColors.Savings
      },
      {
        source: "Savings",
        target: goalLabel,
        value: compactValue(savingsTarget || flow.savingsTotal),
        startColor: nodeColors.Savings,
        endColor: nodeColors.Goal
      }
    ]
  } satisfies { nodes: FlowNode[]; links: FlowLink[] };

  return (
    <section className="rounded-[34px] bg-[#fffdf8] p-5 shadow-soft sm:p-6 lg:col-span-2">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[21px] font-semibold leading-none tracking-[-0.03em] text-[#2f333b]">Money Flow</h3>
          <p className="mt-1 text-[14px] font-medium text-[#8d919e]">A calm replay of where this month moved.</p>
        </div>
        <div className="rounded-full bg-[#f7f1e4] px-3 py-1.5 text-[13px] font-semibold text-[#a16325]">
          {formatAnalyticsAmount(flow.incomeTotal, currency, { compact: true })}
        </div>
      </div>

      <div className="h-[320px] overflow-hidden rounded-[28px] bg-[#fbfaf7] px-2 py-4 sm:h-[340px] sm:px-4">
        <ResponsiveSankey<FlowNode, FlowLink>
          data={sankeyData}
          margin={{ top: 20, right: 96, bottom: 20, left: 96 }}
          align="justify"
          sort="input"
          colors={{ datum: "color" }}
          nodeOpacity={0.95}
          nodeThickness={16}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderRadius={8}
          linkOpacity={0.42}
          linkHoverOpacity={0.58}
          linkContract={6}
          linkBlendMode="normal"
          enableLinkGradient
          enableLabels
          label={(node) => `${node.id} ${node.valueLabel}`}
          labelPosition="outside"
          labelPadding={12}
          labelTextColor="#626677"
          valueFormat={(value) => formatAnalyticsAmount(value, currency, { compact: true })}
          theme={{
            text: {
              fontFamily: "var(--font-sf-pro), system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              fill: "#626677",
              outlineWidth: 0
            },
            tooltip: {
              container: {
                background: "#fffdf8",
                color: "#2f333b",
                borderRadius: 14,
                boxShadow: "0 16px 38px rgba(76,74,68,0.12)",
                fontSize: 13,
                fontWeight: 700
              }
            }
          }}
          nodeTooltip={({ node }) => (
            <div className="rounded-[14px] bg-[#fffdf8] px-3 py-2 text-[13px] font-semibold text-[#2f333b] shadow-[0_16px_38px_rgba(76,74,68,0.12)]">
              {node.id}: {formatAnalyticsAmount(node.value, currency, { compact: true })}
            </div>
          )}
          linkTooltip={({ link }) => (
            <div className="rounded-[14px] bg-[#fffdf8] px-3 py-2 text-[13px] font-semibold text-[#2f333b] shadow-[0_16px_38px_rgba(76,74,68,0.12)]">
              {link.source.id} to {link.target.id}: {formatAnalyticsAmount(link.value, currency, { compact: true })}
            </div>
          )}
          animate={false}
          isInteractive
        />
      </div>
    </section>
  );
}
