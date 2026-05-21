import type { Currency, GoalCategory, MoneyItem } from "@/types/money";

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
  if (amount.convertedCurrency === currency && typeof amount.convertedAmount === "number") return amount.convertedAmount;
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}

function targetInCurrency(item: MoneyItem, currency: AnalyticsCurrency, rate: number) {
  const amount = item.targetAmount;
  if (!amount) return 0;
  if (amount.currency === currency) return amount.amount;
  if (amount.convertedCurrency === currency && typeof amount.convertedAmount === "number") return amount.convertedAmount;
  return currency === "USD" ? amount.amount / rate : amount.amount * rate;
}

function sumByType(items: MoneyItem[], type: MoneyItem["type"], currency: AnalyticsCurrency, rate: number) {
  return items.reduce((total, item) => total + (item.type === type ? amountInCurrency(item, currency, rate) : 0), 0);
}

function fallbackGoals(currency: AnalyticsCurrency, rate: number): AnalyticsGoal[] {
  const targetToman = 300000000;
  const savedToman = 126000000;
  const monthlyToman = 12000000;
  const convert = (value: number) => (currency === "USD" ? value / rate : value);

  return [
    {
      id: "demo-dubai-trip",
      title: "Dubai Trip",
      category: "trip",
      progress: 42,
      saved: convert(savedToman),
      target: convert(targetToman),
      monthlyProgress: convert(monthlyToman),
      monthsLeft: 8
    }
  ];
}

function deriveGoals(items: MoneyItem[], currency: AnalyticsCurrency, rate: number, savingsTotal: number) {
  const goals = items.filter((item) => item.type === "goal");
  if (!goals.length) return fallbackGoals(currency, rate);

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

function deriveLeaks(items: MoneyItem[], currency: AnalyticsCurrency, rate: number, expenseTotal: number) {
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

  const derived = Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  if (derived.length >= 4) return derived.slice(0, 5);

  const base = expenseTotal || (currency === "USD" ? 6650 : 630000000);
  const defaults: MoneyLeak[] = [
    { label: "Rent", value: base * 0.42 },
    { label: "Food Delivery", value: base * 0.2 },
    { label: "Subscriptions", value: base * 0.13 },
    { label: "Coffee & Snacks", value: base * 0.1 },
    { label: "Others", value: base * 0.15 }
  ];

  return [...derived, ...defaults.filter((item) => !derived.some((entry) => entry.label === item.label))].slice(0, 5);
}

function deriveMonthlyIncome(currentIncome: number) {
  const base = currentIncome || 1;
  const multipliers = [0.72, 0.84, 0.79, 0.93, 0.88, 1];
  const labels = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return labels.map((label, index) => ({ label, value: base * multipliers[index] }));
}

export function getAnalyticsSummary(
  items: MoneyItem[],
  currency: AnalyticsCurrency,
  usdToToman: number | null
): AnalyticsSummary {
  const rate = usdToToman || FALLBACK_USD_TO_TOMAN;
  const incomeTotal = sumByType(items, "income", currency, rate) || (currency === "USD" ? 8900 : 840000000);
  const expenseTotal = sumByType(items, "expense", currency, rate) || (currency === "USD" ? 6650 : 630000000);
  const savingsTotal = sumByType(items, "savings", currency, rate) || (currency === "USD" ? 1335 : 126000000);
  const goalTotal = sumByType(items, "goal", currency, rate);
  const goals = deriveGoals(items, currency, rate, savingsTotal);
  const leaks = deriveLeaks(items, currency, rate, expenseTotal);
  const monthlyIncome = deriveMonthlyIncome(incomeTotal);
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
