import { Transaction, BudgetLimit } from '../types';

export type InsightType = 'POSITIVE' | 'WARNING' | 'NEUTRAL';
export type AnalysisPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface SpendingInsight {
  id: string;
  type: InsightType; // POSITIVE (green), WARNING (yellow/red), NEUTRAL (blue)
  title: string;
  message: string;
  metricLabel?: string;
  metricValue?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  trendPercent?: number;
  category?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PeriodSummary {
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  topCategory: { name: string; amount: number; percentage: number } | null;
  transactionCount: number;
}

// Helper to get Year-Month key "YYYY-MM"
export function getYearMonth(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.substring(0, 7);
}

// Helper to get Year-Quarter key "YYYY-Q1"
export function getYearQuarter(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return '';
  const year = dateStr.substring(0, 4);
  const month = parseInt(dateStr.substring(5, 7), 10);
  const q = Math.ceil(month / 3);
  return `${year}-Q${q}`;
}

// Helper to get Year key "YYYY"
export function getYear(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.substring(0, 4);
}

// Generate deterministic rule-based spending insights without AI
export function generateSpendingInsights(
  transactions: Transaction[],
  budgets: BudgetLimit[],
  period: AnalysisPeriod = 'MONTHLY',
  targetPeriodKey?: string // e.g. "2026-10" or "2026-Q4" or "2026"
): {
  insights: SpendingInsight[];
  summary: PeriodSummary;
  previousSummary: PeriodSummary | null;
} {
  const expenseTx = transactions.filter(t => t.type === 'EXPENSE');
  const incomeTx = transactions.filter(t => t.type === 'INCOME');

  // Determine current and previous period keys
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentQuarterKey = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  const currentYearKey = `${now.getFullYear()}`;

  let activePeriodKey = targetPeriodKey;
  if (!activePeriodKey) {
    if (period === 'MONTHLY') activePeriodKey = currentMonthKey;
    else if (period === 'QUARTERLY') activePeriodKey = currentQuarterKey;
    else activePeriodKey = currentYearKey;
  }

  // Calculate previous period key
  let prevPeriodKey = '';
  if (period === 'MONTHLY') {
    const [yStr, mStr] = activePeriodKey.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    prevPeriodKey = `${y}-${String(m).padStart(2, '0')}`;
  } else if (period === 'QUARTERLY') {
    const [yStr, qStr] = activePeriodKey.split('-Q');
    let y = parseInt(yStr, 10);
    let q = parseInt(qStr, 10) - 1;
    if (q === 0) {
      q = 4;
      y -= 1;
    }
    prevPeriodKey = `${y}-Q${q}`;
  } else {
    const y = parseInt(activePeriodKey, 10) - 1;
    prevPeriodKey = `${y}`;
  }

  // Filter transactions for active and previous periods
  const filterByPeriod = (txList: Transaction[], key: string) => {
    return txList.filter(t => {
      if (!t.date) return false;
      if (period === 'MONTHLY') return getYearMonth(t.date) === key;
      if (period === 'QUARTERLY') return getYearQuarter(t.date) === key;
      return getYear(t.date) === key;
    });
  };

  const currExpense = filterByPeriod(expenseTx, activePeriodKey);
  const prevExpense = filterByPeriod(expenseTx, prevPeriodKey);
  const currIncome = filterByPeriod(incomeTx, activePeriodKey);
  const prevIncome = filterByPeriod(incomeTx, prevPeriodKey);

  const totalCurrExpense = currExpense.reduce((sum, t) => sum + t.amount, 0);
  const totalPrevExpense = prevExpense.reduce((sum, t) => sum + t.amount, 0);
  const totalCurrIncome = currIncome.reduce((sum, t) => sum + t.amount, 0);
  const totalPrevIncome = prevIncome.reduce((sum, t) => sum + t.amount, 0);

  const currNetSavings = totalCurrIncome - totalCurrExpense;
  const prevNetSavings = totalPrevIncome - totalPrevExpense;
  const currSavingsRate = totalCurrIncome > 0 ? (currNetSavings / totalCurrIncome) * 100 : 0;

  // Category maps for current and previous periods
  const currCatTotals = new Map<string, number>();
  currExpense.forEach(t => {
    currCatTotals.set(t.category, (currCatTotals.get(t.category) || 0) + t.amount);
  });

  const prevCatTotals = new Map<string, number>();
  prevExpense.forEach(t => {
    prevCatTotals.set(t.category, (prevCatTotals.get(t.category) || 0) + t.amount);
  });

  // Find top category
  let topCategory: { name: string; amount: number; percentage: number } | null = null;
  for (const [name, amt] of currCatTotals.entries()) {
    if (!topCategory || amt > topCategory.amount) {
      const percentage = totalCurrExpense > 0 ? Math.round((amt / totalCurrExpense) * 100) : 0;
      topCategory = { name, amount: amt, percentage };
    }
  }

  const periodUnit = period === 'MONTHLY' ? 'month' : period === 'QUARTERLY' ? 'quarter' : 'year';

  const insights: SpendingInsight[] = [];

  // RULE 1: Total Spending Comparison vs Previous Period
  if (totalPrevExpense > 0 && totalCurrExpense > 0) {
    const diff = totalCurrExpense - totalPrevExpense;
    const pct = Math.round((Math.abs(diff) / totalPrevExpense) * 100);

    if (diff < 0) {
      // Positive insight: expenses dropped
      insights.push({
        id: 'total_spending_down',
        type: 'POSITIVE',
        title: `Overall Spending Decreased by ${pct}%`,
        message: `Total spending is down by ₱${Math.abs(diff).toLocaleString()} compared to last ${periodUnit} (₱${totalCurrExpense.toLocaleString()} vs ₱${totalPrevExpense.toLocaleString()}). Excellent financial discipline!`,
        trend: 'DOWN',
        trendPercent: -pct,
        metricLabel: 'Spending Trend',
        metricValue: `-${pct}% (Saved ₱${Math.abs(diff).toLocaleString()})`,
        severity: 'LOW',
      });
    } else if (diff > 0 && pct >= 5) {
      // Warning insight: expenses rose
      insights.push({
        id: 'total_spending_up',
        type: 'WARNING',
        title: `Overall Spending Rose by ${pct}%`,
        message: `Total spending increased by ₱${diff.toLocaleString()} (+${pct}%) compared to last ${periodUnit}. Review discretionary purchases to balance cash flow.`,
        trend: 'UP',
        trendPercent: pct,
        metricLabel: 'Spending Increase',
        metricValue: `+${pct}% (+₱${diff.toLocaleString()})`,
        severity: pct > 25 ? 'HIGH' : 'MEDIUM',
      });
    }
  }

  // RULE 2: Category with Largest Increase & Largest Decrease
  let largestIncrease: { name: string; diff: number; pct: number } | null = null;
  let largestDecrease: { name: string; diff: number; pct: number } | null = null;

  for (const [catName, currAmt] of currCatTotals.entries()) {
    const prevAmt = prevCatTotals.get(catName) || 0;
    if (prevAmt > 0) {
      const diff = currAmt - prevAmt;
      const pct = Math.round((diff / prevAmt) * 100);

      if (diff > 0 && (!largestIncrease || diff > largestIncrease.diff)) {
        largestIncrease = { name: catName, diff, pct };
      } else if (diff < 0 && (!largestDecrease || Math.abs(diff) > Math.abs(largestDecrease.diff))) {
        largestDecrease = { name: catName, diff, pct: Math.abs(pct) };
      }
    } else if (currAmt > 500) {
      // Brand new category spending that didn't exist in previous period
      if (!largestIncrease || currAmt > largestIncrease.diff) {
        largestIncrease = { name: catName, diff: currAmt, pct: 100 };
      }
    }
  }

  if (largestIncrease && largestIncrease.diff >= 500) {
    insights.push({
      id: `cat_increase_${largestIncrease.name}`,
      type: 'WARNING',
      title: `${largestIncrease.name} Spending Surged`,
      message: `${largestIncrease.name} expenses increased by ₱${largestIncrease.diff.toLocaleString()} (+${largestIncrease.pct}%) compared to last ${periodUnit}.`,
      trend: 'UP',
      trendPercent: largestIncrease.pct,
      category: largestIncrease.name,
      metricLabel: 'Category Spike',
      metricValue: `+₱${largestIncrease.diff.toLocaleString()} (+${largestIncrease.pct}%)`,
      severity: largestIncrease.pct > 40 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (largestDecrease && Math.abs(largestDecrease.diff) >= 300) {
    insights.push({
      id: `cat_decrease_${largestDecrease.name}`,
      type: 'POSITIVE',
      title: `${largestDecrease.name} Reduced by ${largestDecrease.pct}%`,
      message: `${largestDecrease.name} spending dropped by ₱${Math.abs(largestDecrease.diff).toLocaleString()} (-${largestDecrease.pct}%) compared to last ${periodUnit}. Great cutback!`,
      trend: 'DOWN',
      trendPercent: -largestDecrease.pct,
      category: largestDecrease.name,
      metricLabel: 'Category Savings',
      metricValue: `-₱${Math.abs(largestDecrease.diff).toLocaleString()} (-${largestDecrease.pct}%)`,
      severity: 'LOW',
    });
  }

  // RULE 3: Highest Spending Category & Multi-month Dominance
  if (topCategory && totalCurrExpense > 0) {
    // Check if it was also top category in previous 2 periods
    let consecutiveCount = 1;
    if (prevExpense.length > 0) {
      let prevTop: { name: string; amount: number } | null = null;
      for (const [name, amt] of prevCatTotals.entries()) {
        if (!prevTop || amt > prevTop.amount) {
          prevTop = { name, amount: amt };
        }
      }
      if (prevTop && prevTop.name === topCategory.name) {
        consecutiveCount = 2;
      }
    }

    if (consecutiveCount >= 2) {
      insights.push({
        id: 'top_category_streak',
        type: topCategory.percentage > 40 ? 'WARNING' : 'NEUTRAL',
        title: `${topCategory.name} is Your #1 Expense for Multiple ${periodUnit}s`,
        message: `${topCategory.name} continues to be your highest expense category (${topCategory.percentage}% of all expenses, totaling ₱${topCategory.amount.toLocaleString()}).`,
        category: topCategory.name,
        metricLabel: 'Expense Share',
        metricValue: `${topCategory.percentage}% of total`,
        severity: topCategory.percentage > 40 ? 'HIGH' : 'LOW',
      });
    } else {
      insights.push({
        id: 'top_category_current',
        type: 'NEUTRAL',
        title: `Top Spending: ${topCategory.name}`,
        message: `${topCategory.name} took the largest portion of your budget this ${periodUnit} at ₱${topCategory.amount.toLocaleString()} (${topCategory.percentage}% of total).`,
        category: topCategory.name,
        metricLabel: 'Top Category',
        metricValue: `₱${topCategory.amount.toLocaleString()} (${topCategory.percentage}%)`,
        severity: 'LOW',
      });
    }
  }

  // RULE 4: Net Savings & Cash Flow Growth
  if (totalCurrIncome > 0) {
    if (totalPrevIncome > 0 && currNetSavings > prevNetSavings) {
      const savingsDelta = currNetSavings - prevNetSavings;
      insights.push({
        id: 'savings_improved',
        type: 'POSITIVE',
        title: `Net Savings Improved by ₱${savingsDelta.toLocaleString()}`,
        message: `Your retained savings improved this ${periodUnit} (₱${currNetSavings.toLocaleString()} retained vs ₱${prevNetSavings.toLocaleString()} prior). Your current savings rate is ${Math.round(currSavingsRate)}%.`,
        trend: 'UP',
        metricLabel: 'Savings Boost',
        metricValue: `+₱${savingsDelta.toLocaleString()}`,
        severity: 'LOW',
      });
    } else if (currNetSavings < 0) {
      // Overspending income!
      const deficit = Math.abs(currNetSavings);
      insights.push({
        id: 'deficit_alert',
        type: 'WARNING',
        title: 'Spending Exceeded Total Income',
        message: `Total expenses (₱${totalCurrExpense.toLocaleString()}) surpassed total income (₱${totalCurrIncome.toLocaleString()}) by ₱${deficit.toLocaleString()}. Consider delaying non-urgent purchases.`,
        trend: 'UP',
        metricLabel: 'Cash Deficit',
        metricValue: `-₱${deficit.toLocaleString()}`,
        severity: 'HIGH',
      });
    } else if (currSavingsRate >= 20) {
      insights.push({
        id: 'healthy_savings_rate',
        type: 'POSITIVE',
        title: `Healthy Savings Rate of ${Math.round(currSavingsRate)}%`,
        message: `You successfully saved ${Math.round(currSavingsRate)}% of your earnings this ${periodUnit} (₱${currNetSavings.toLocaleString()}), surpassing the 20% personal finance benchmark.`,
        metricLabel: 'Savings Rate',
        metricValue: `${Math.round(currSavingsRate)}%`,
        severity: 'LOW',
      });
    }
  }

  // RULE 5: Budget Overspending & Adherence Checks
  budgets.forEach(b => {
    const spentInCat = currCatTotals.get(b.categoryName) || 0;
    if (b.limitAmount > 0) {
      const budgetPct = Math.round((spentInCat / b.limitAmount) * 100);

      if (spentInCat > b.limitAmount) {
        const excess = spentInCat - b.limitAmount;
        const overPct = budgetPct - 100;
        insights.push({
          id: `budget_exceeded_${b.categoryId}`,
          type: 'WARNING',
          title: `Exceeded ${b.categoryName} Budget by ${overPct}%`,
          message: `You spent ₱${spentInCat.toLocaleString()} against your ₱${b.limitAmount.toLocaleString()} limit (₱${excess.toLocaleString()} over limit).`,
          trend: 'UP',
          trendPercent: overPct,
          category: b.categoryName,
          metricLabel: 'Budget Overage',
          metricValue: `+${overPct}% (₱${excess.toLocaleString()} over)`,
          severity: overPct > 20 ? 'HIGH' : 'MEDIUM',
        });
      } else if (budgetPct >= 85 && budgetPct <= 100) {
        const remaining = b.limitAmount - spentInCat;
        insights.push({
          id: `budget_warning_${b.categoryId}`,
          type: 'WARNING',
          title: `Near Limit: ${b.categoryName} (${budgetPct}%)`,
          message: `You have consumed ${budgetPct}% of your ${b.categoryName} budget. Only ₱${remaining.toLocaleString()} remains available.`,
          category: b.categoryName,
          metricLabel: 'Budget Used',
          metricValue: `${budgetPct}% (₱${remaining.toLocaleString()} left)`,
          severity: 'MEDIUM',
        });
      }
    }
  });

  // RULE 6: Discretionary vs Essential Spending Ratio
  const essentialCategories = ['Groceries & Wet Market', 'Utilities & Monthly Bills', 'Rent & Housing', 'Healthcare & Medicines', 'Transportation & Fuel'];
  let essentialTotal = 0;
  let discretionaryTotal = 0;

  for (const [name, amt] of currCatTotals.entries()) {
    if (essentialCategories.some(cat => name.toLowerCase().includes(cat.toLowerCase()))) {
      essentialTotal += amt;
    } else {
      discretionaryTotal += amt;
    }
  }

  if (totalCurrExpense > 0 && discretionaryTotal > essentialTotal && discretionaryTotal > 3000) {
    const discPct = Math.round((discretionaryTotal / totalCurrExpense) * 100);
    insights.push({
      id: 'high_discretionary',
      type: 'WARNING',
      title: `Discretionary Spending Outpaced Essentials (${discPct}%)`,
      message: `Non-essential lifestyle spending (₱${discretionaryTotal.toLocaleString()}) exceeded your core household essentials (₱${essentialTotal.toLocaleString()}).`,
      metricLabel: 'Discretionary Share',
      metricValue: `${discPct}% of total`,
      severity: 'MEDIUM',
    });
  }

  // If no transactions found yet in this period
  if (insights.length === 0) {
    insights.push({
      id: 'no_data',
      type: 'NEUTRAL',
      title: 'Awaiting Sufficient Spending Data',
      message: `Record a few more expenses or switch periods to generate automated trend analyses and savings insights.`,
      severity: 'LOW',
    });
  }

  // Sort: Warnings/High severity first, then Positives, then Neutral
  insights.sort((a, b) => {
    const scoreA = a.severity === 'HIGH' ? 3 : a.type === 'WARNING' ? 2 : a.type === 'POSITIVE' ? 1 : 0;
    const scoreB = b.severity === 'HIGH' ? 3 : b.type === 'WARNING' ? 2 : b.type === 'POSITIVE' ? 1 : 0;
    return scoreB - scoreA;
  });

  return {
    insights,
    summary: {
      periodLabel: activePeriodKey,
      totalIncome: totalCurrIncome,
      totalExpense: totalCurrExpense,
      netSavings: currNetSavings,
      savingsRate: Math.round(currSavingsRate),
      topCategory,
      transactionCount: currExpense.length + currIncome.length,
    },
    previousSummary: totalPrevExpense > 0 || totalPrevIncome > 0 ? {
      periodLabel: prevPeriodKey,
      totalIncome: totalPrevIncome,
      totalExpense: totalPrevExpense,
      netSavings: prevNetSavings,
      savingsRate: totalPrevIncome > 0 ? Math.round((prevNetSavings / totalPrevIncome) * 100) : 0,
      topCategory: null,
      transactionCount: prevExpense.length + prevIncome.length,
    } : null,
  };
}
