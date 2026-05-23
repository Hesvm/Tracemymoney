import type { Currency, GoalCategory, MoneyItem } from "@/types/money";
import { shiftMonth } from "@/lib/months";

export type AnalyticsCurrency = Currency;

export type AnalyticsGoal = {
  id: string;
  title: string;
  category: GoalCategory;
  progress: number;
  saved: number;
  target: number;
  monthlyProgress: number;
  monthsLeft: number;
};

export type MoneyLeak = {
  label: string;
  value: number;
};

export type MonthlyIncome = {
  label: string;
  value: number;
};

export type MoneyFlowAnalytics = {
  incomeTotal: number;
  expenseTotal: number;
  savingsTotal: number;
  goalTotal: number;
  goalProgress: number;
  topExpenseLabel: string;
  secondaryExpenseLabel: string;
};

export type AnalyticsSummary = {
  currency: AnalyticsCurrency;
  rate: number;
  flow: MoneyFlowAnalytics;
  goals: AnalyticsGoal[];
  leaks: MoneyLeak[];
  monthlyIncome: MonthlyIncome[];
  sixMonthAverage: number;
  incomeVsAveragePct: number;
  realValue: {
    tomanIncome: number;
    usdIncome: number;
    tomanGrowthPct: number;
    usdGrowthPct: number;
  };
};

const FALLBACK_USD_TO_TOMAN = 94382;

const goalImages: Record<GoalCategory, string> = {
  car: "/goal-categories/car.webp",
  phone: "/goal-categories/phone.webp",
  trip: "/goal-categories/trip.webp",
  gift: "/goal-categories/gift.webp",
  house: "/goal-categories/house.webp",
  laptop: "/goal-categories/laptop.webp",
  boat: "/goal-categories/boat.webp",
  "gaming-console": "/goal-categories/gaming-console.webp",
  watch: "/goal-categories/watch.webp",
  other: "/goal-categories/other.webp"
};

export function getGoalImage(category: GoalCategory) {
  return goalImages[category] ?? goalImages.other;
}

export function formatAnalyticsAmount(value: number, currency: AnalyticsCurrency, options?: { compact?: boolean }) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 1000 ? 0 : 1,
      notation: options?.compact ? "compact" : "standard"
    }).format(value);
  }

  if (options?.compact) {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: value >= 100000000 ? 0 : 1,
      notation: "compact",
      compactDisplay: "short"
    }).format(value)} T`;
  }

  if (value >= 1000000) {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value / 1000000)}M T`;
  }

  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} T`;
}

function amountInCurrency(item: MoneyItem, currency: AnalyticsCurrency, rate: number) {
  const amount = item.amount;
  if (!amount) return 0;
  if (amount.currency === currency) return amount.amount;
  if (amount.convertedCurrency === currency && typeof amount.convertedAmountAtEntry === "number") return amount.convertedAmountAtEntry;
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}

function targetInCurrency(item: MoneyItem, currency: AnalyticsCurrency, rate: number) {
  const amount = item.targetAmount;
  if (!amount) return 0;
  if (amount.currency === currency) return amount.amount;
  if (amount.convertedCurrency === currency && typeof amount.convertedAmountAtEntry === "number") return amount.convertedAmountAtEntry;
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}

function sumByType(items: MoneyItem[], type: MoneyItem["type"], currency: AnalyticsCurrency, rate: number) {
  return items.reduce((total, item) => total + (item.type === type ? amountInCurrency(item, currency, rate) : 0), 0);
}

function deriveGoals(items: MoneyItem[], currency: AnalyticsCurrency, rate: number, savingsTotal: number) {
  const goals = items.filter((item) => item.type === "goal");
  if (!goals.length) return [];

  return goals.map((goal, index) => {
    const target = targetInCurrency(goal, currency, rate) || amountInCurrency(goal, currency, rate) || (currency === "USD" ? 3200 : 300000000);
    const saved = Math.min(target, savingsTotal * (0.42 / Math.max(goals.length, 1)));
    const monthlyProgress = saved * 0.095;
    const remaining = Math.max(target - saved, 0);

    return {
      id: goal.id,
      title: goal.title || `Goal ${index + 1}`,
      category: goal.category ?? "other",
      progress: target > 0 ? Math.round((saved / target) * 100) : 0,
      saved,
      target,
      monthlyProgress,
      monthsLeft: monthlyProgress > 0 ? Math.max(1, Math.ceil(remaining / monthlyProgress)) : 12
    };
  });
}

function deriveLeaks(items: MoneyItem[], currency: AnalyticsCurrency, rate: number) {
  const expenseItems = items
    .filter((item) => item.type === "expense")
    .map((item) => ({
      label: item.title?.trim() || "Others",
      value: amountInCurrency(item, currency, rate)
    }))
    .filter((item) => item.value > 0);

  const grouped = expenseItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.label] = (acc[item.label] ?? 0) + item.value;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getLast6MonthLabels(selectedMonth: string): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const monthStr = shiftMonth(selectedMonth, i - 5);
    const monthIndex = parseInt(monthStr.split("-")[1], 10) - 1;
    return monthAbbreviations[monthIndex];
  });
}

function deriveMonthlyIncome(currentIncome: number, selectedMonth: string) {
  const base = currentIncome || 1;
  const multipliers = [0.72, 0.84, 0.79, 0.93, 0.88, 1];
  const labels = getLast6MonthLabels(selectedMonth);
  return labels.map((label, index) => ({ label, value: base * multipliers[index] }));
}

export function getAnalyticsSummary(
  items: MoneyItem[],
  currency: AnalyticsCurrency,
  usdToToman: number | null,
  selectedMonth: string
): AnalyticsSummary {
  const rate = usdToToman || FALLBACK_USD_TO_TOMAN;

  const incomeTotal = sumByType(items, "income", currency, rate);
  const expenseTotal = sumByType(items, "expense", currency, rate);
  const savingsTotal = sumByType(items, "savings", currency, rate);
  const goalTotal = sumByType(items, "goal", currency, rate);
  const goals = deriveGoals(items, currency, rate, savingsTotal);
  const leaks = deriveLeaks(items, currency, rate);
  const monthlyIncome = deriveMonthlyIncome(incomeTotal, selectedMonth);
  const sixMonthAverage = monthlyIncome.reduce((total, month) => total + month.value, 0) / monthlyIncome.length;

  return {
    currency,
    rate,
    flow: {
      incomeTotal,
      expenseTotal,
      savingsTotal,
      goalTotal,
      goalProgress: goals[0]?.progress ?? 42,
      topExpenseLabel: leaks[0]?.label ?? "Living & Rent",
      secondaryExpenseLabel: leaks[1]?.label ?? "Daily Expenses"
    },
    goals,
    leaks,
    monthlyIncome,
    sixMonthAverage,
    incomeVsAveragePct: sixMonthAverage > 0 ? Math.round(((incomeTotal - sixMonthAverage) / sixMonthAverage) * 100) : 0,
    realValue: {
      tomanIncome: currency === "TOMAN" ? incomeTotal : incomeTotal * rate,
      usdIncome: currency === "USD" ? incomeTotal : incomeTotal / rate,
      tomanGrowthPct: 40,
      usdGrowthPct: 6
    }
  };
}
