import {
  Transaction,
  BudgetLimit,
  RecurringBill,
  Installment,
  DebtLoan,
  SavingsGoal,
  HealthCheckResult,
  Category,
  FinancialAccount
} from '../types';

export function calculateNetBalance(transactions: Transaction[]): {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
    } else if (t.type === 'EXPENSE') {
      totalExpenses += t.amount;
    }
  }

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    savingsRate: Math.round(savingsRate * 10) / 10,
  };
}

export function calculateCategoryBreakdown(transactions: Transaction[]): Array<{
  category: string;
  totalAmount: number;
  percentage: number;
  count: number;
}> {
  const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  const categoryMap = new Map<string, { totalAmount: number; count: number }>();

  for (const t of expenseTransactions) {
    const current = categoryMap.get(t.category) || { totalAmount: 0, count: 0 };
    categoryMap.set(t.category, {
      totalAmount: current.totalAmount + t.amount,
      count: current.count + 1,
    });
  }

  const breakdown: Array<{ category: string; totalAmount: number; percentage: number; count: number }> = [];

  categoryMap.forEach((val, key) => {
    const percentage = totalExpense > 0 ? (val.totalAmount / totalExpense) * 100 : 0;
    breakdown.push({
      category: key,
      totalAmount: val.totalAmount,
      percentage: Math.round(percentage * 10) / 10,
      count: val.count,
    });
  });

  return breakdown.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function calculatePaydayDistribution(netIncome: number, ratios = {
  fixedBills: 0.50, // 50%
  savings: 0.20,    // 20%
  food: 0.15,       // 15%
  transport: 0.05,  // 5%
  discretionary: 0.10, // 10%
}): {
  fixedBills: number;
  savings: number;
  food: number;
  transport: number;
  discretionary: number;
  totalAllocated: number;
} {
  const fixedBills = Math.round(netIncome * ratios.fixedBills);
  const savings = Math.round(netIncome * ratios.savings);
  const food = Math.round(netIncome * ratios.food);
  const transport = Math.round(netIncome * ratios.transport);
  const discretionary = netIncome - (fixedBills + savings + food + transport);

  return {
    fixedBills,
    savings,
    food,
    transport,
    discretionary,
    totalAllocated: netIncome,
  };
}

export function calculateHouseholdShares(
  sharedTransactions: Transaction[],
  splitRatioPersonA: number = 0.5
): {
  totalSharedExpense: number;
  personAShare: number;
  personBShare: number;
} {
  const totalSharedExpense = sharedTransactions
    .filter(t => t.type === 'EXPENSE' && t.isShared)
    .reduce((acc, t) => acc + t.amount, 0);

  const personAShare = Math.round(totalSharedExpense * splitRatioPersonA);
  const personBShare = totalSharedExpense - personAShare;

  return {
    totalSharedExpense,
    personAShare,
    personBShare,
  };
}

export interface InstallmentCalculationResult {
  monthlyPayment: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  totalInterest: number;
  totalPayable: number;
}

/**
 * Calculates accurate monthly payment and interest breakdown for consumer installments and BNPL.
 * Supports:
 * - 0% interest (Principal / Months)
 * - Standard Monthly Add-on / Flat Rate (Standard for Shopee SPayLater, Lazada LazPayLater, TikTok PayLater, Credit Card installments)
 * - Annual Add-on Rate (r_annual / 12)
 * - Amortized / Diminishing Balance loans
 */
export function calculateInstallmentMonthlyPayment(
  principal: number,
  totalMonths: number,
  interestRatePercent: number = 0,
  rateType: 'MONTHLY' | 'ANNUAL' = 'MONTHLY',
  calculationType: 'ADD_ON' | 'AMORTIZED' = 'ADD_ON'
): InstallmentCalculationResult {
  if (principal <= 0 || totalMonths <= 0) {
    return {
      monthlyPayment: 0,
      monthlyPrincipal: 0,
      monthlyInterest: 0,
      totalInterest: 0,
      totalPayable: 0,
    };
  }

  const rate = Math.max(0, interestRatePercent || 0);

  // 0% Interest Promo
  if (rate === 0) {
    const monthly = Math.round((principal / totalMonths) * 100) / 100;
    return {
      monthlyPayment: monthly,
      monthlyPrincipal: monthly,
      monthlyInterest: 0,
      totalInterest: 0,
      totalPayable: principal,
    };
  }

  const monthlyRatePercent = rateType === 'ANNUAL' ? rate / 12 : rate;
  const monthlyRateDecimal = monthlyRatePercent / 100;

  if (calculationType === 'AMORTIZED') {
    // Diminishing Balance / Amortized: M = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
    const r = monthlyRateDecimal;
    const n = totalMonths;
    const factor = Math.pow(1 + r, n);
    const monthlyPayment = Math.round((principal * (r * factor) / (factor - 1)) * 100) / 100;
    const totalPayable = Math.round(monthlyPayment * n * 100) / 100;
    const totalInterest = Math.max(0, Math.round((totalPayable - principal) * 100) / 100);
    const monthlyInterest = Math.round((totalInterest / n) * 100) / 100;
    const monthlyPrincipal = Math.round((monthlyPayment - monthlyInterest) * 100) / 100;

    return {
      monthlyPayment,
      monthlyPrincipal,
      monthlyInterest,
      totalInterest,
      totalPayable,
    };
  } else {
    // Standard Add-on / Flat Monthly Rate (Shopee SPayLater, LazPayLater, TikTok, CC):
    // Monthly Principal = Principal / n
    // Monthly Interest = Principal * (monthlyRate% / 100)
    // Monthly Payment = Monthly Principal + Monthly Interest
    const monthlyPrincipal = Math.round((principal / totalMonths) * 100) / 100;
    const monthlyInterest = Math.round((principal * monthlyRateDecimal) * 100) / 100;
    const monthlyPayment = Math.round((monthlyPrincipal + monthlyInterest) * 100) / 100;
    const totalInterest = Math.round((monthlyInterest * totalMonths) * 100) / 100;
    const totalPayable = Math.round((principal + totalInterest) * 100) / 100;

    return {
      monthlyPayment,
      monthlyPrincipal,
      monthlyInterest,
      totalInterest,
      totalPayable,
    };
  }
}

export function calculateInstallmentRemaining(installment: Installment): {
  remainingMonths: number;
  remainingBalance: number;
  completionPercentage: number;
  totalInterest: number;
  totalPayable: number;
  monthlyInterest: number;
  monthlyPrincipal: number;
} {
  const remainingMonths = Math.max(0, installment.totalMonths - installment.paidMonths);
  const remainingBalance = remainingMonths * installment.monthlyPayment;
  const completionPercentage = installment.totalMonths > 0 
    ? Math.round((installment.paidMonths / installment.totalMonths) * 100) 
    : 0;

  const calc = calculateInstallmentMonthlyPayment(
    installment.totalAmount,
    installment.totalMonths,
    installment.interestRatePercent || 0,
    installment.interestRateType || 'MONTHLY',
    installment.interestCalculationType || 'ADD_ON'
  );

  return {
    remainingMonths,
    remainingBalance,
    completionPercentage,
    totalInterest: installment.totalInterestAmount ?? calc.totalInterest,
    totalPayable: installment.totalPayableAmount ?? calc.totalPayable,
    monthlyInterest: calc.monthlyInterest,
    monthlyPrincipal: calc.monthlyPrincipal,
  };
}

export function calculateFinancialHealthChecks(data: {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyRecurringBills: RecurringBill[];
  monthlyInstallments: Installment[];
  debts: DebtLoan[];
  savingsGoals: SavingsGoal[];
  liquidSavingsBalance: number;
  budgets?: BudgetLimit[];
  transactions?: Transaction[];
  categories?: Category[];
}): HealthCheckResult[] {
  const results: HealthCheckResult[] = [];
  const {
    monthlyIncome,
    monthlyExpenses,
    monthlyRecurringBills,
    monthlyInstallments,
    debts,
    liquidSavingsBalance,
    budgets = [],
    transactions = [],
  } = data;

  // Rule 1: Debt-to-Income Commitment Ratio
  const totalBillCommitment = monthlyRecurringBills.reduce((acc, b) => acc + b.amount, 0);
  const totalInstallmentCommitment = monthlyInstallments.reduce((acc, i) => acc + i.monthlyPayment, 0);
  const totalDebtCommitment = debts
    .filter(d => d.type === 'I_OWE')
    .reduce((acc, d) => acc + (d.monthlyAmortization || 0), 0);

  const totalFixedCommitments = totalBillCommitment + totalInstallmentCommitment + totalDebtCommitment;
  const commitmentRatio = monthlyIncome > 0 ? (totalFixedCommitments / monthlyIncome) * 100 : 0;

  if (commitmentRatio > 50) {
    results.push({
      id: 'rule_fixed_commitments',
      title: 'High Fixed Commitments Warning',
      score: 35,
      status: 'ALERT',
      message: `Your fixed commitments (bills, loans, installments) consume ${commitmentRatio.toFixed(1)}% of income.`,
      details: `Fixed commitments total ₱${totalFixedCommitments.toLocaleString()} / month against income of ₱${monthlyIncome.toLocaleString()}. Recommended maximum is 40%.`,
      recommendation: 'Avoid signing new installment or SPayLater commitments until existing obligations drop below 40%.',
      metricLabel: 'Commitment Ratio',
      metricValue: `${commitmentRatio.toFixed(1)}%`,
    });
  } else if (commitmentRatio > 40) {
    results.push({
      id: 'rule_fixed_commitments',
      title: 'Moderate Fixed Commitments',
      score: 65,
      status: 'WARNING',
      message: `Fixed obligations take ${commitmentRatio.toFixed(1)}% of income.`,
      details: 'You are close to the recommended 40% safety threshold.',
      recommendation: 'Prioritize paying off short-term installments to free up monthly cash flow.',
      metricLabel: 'Commitment Ratio',
      metricValue: `${commitmentRatio.toFixed(1)}%`,
    });
  } else {
    results.push({
      id: 'rule_fixed_commitments',
      title: 'Healthy Debt-to-Income Ratio',
      score: 95,
      status: 'HEALTHY',
      message: `Fixed commitments consume a comfortable ${commitmentRatio.toFixed(1)}% of monthly income.`,
      details: 'Well below the 40% threshold.',
      recommendation: 'Maintain this discipline and channel extra cash flow into Emergency Savings.',
      metricLabel: 'Commitment Ratio',
      metricValue: `${commitmentRatio.toFixed(1)}%`,
    });
  }

  // Rule 2: Emergency Fund Coverage (3 to 6 months of essential expenses)
  const monthlyEssentialExpenses = Math.max(1, totalFixedCommitments + (monthlyExpenses * 0.5));
  const monthsCovered = liquidSavingsBalance / monthlyEssentialExpenses;

  if (monthsCovered < 1) {
    results.push({
      id: 'rule_emergency_fund',
      title: 'Low Emergency Fund Buffer',
      score: 30,
      status: 'ALERT',
      message: `Your savings cover only ${monthsCovered.toFixed(1)} months of essential living costs.`,
      details: `Liquid savings: ₱${liquidSavingsBalance.toLocaleString()}. Essential monthly expenses: ₱${Math.round(monthlyEssentialExpenses).toLocaleString()}.`,
      recommendation: 'Direct 20% of every payday to your Emergency Fund goal before discretionary spending.',
      metricLabel: 'Fund Coverage',
      metricValue: `${monthsCovered.toFixed(1)} mos`,
    });
  } else if (monthsCovered < 3) {
    results.push({
      id: 'rule_emergency_fund',
      title: 'Building Emergency Buffer',
      score: 70,
      status: 'WARNING',
      message: `Emergency fund covers ${monthsCovered.toFixed(1)} months. Target is 3-6 months.`,
      details: 'Good progress! Keep building until you reach at least 3 full months.',
      recommendation: 'Set up automatic payday savings transfers to reach 3 months coverage.',
      metricLabel: 'Fund Coverage',
      metricValue: `${monthsCovered.toFixed(1)} mos`,
    });
  } else {
    results.push({
      id: 'rule_emergency_fund',
      title: 'Solid Emergency Reserve',
      score: 98,
      status: 'HEALTHY',
      message: `Emergency fund covers ${monthsCovered.toFixed(1)} months of essential expenses!`,
      details: 'Excellent financial cushion for unexpected medical, repair, or job transition needs.',
      recommendation: 'Consider investing surplus funds beyond 6 months into higher-yield savings or investments.',
      metricLabel: 'Fund Coverage',
      metricValue: `${monthsCovered.toFixed(1)} mos`,
    });
  }

  // Rule 3: Monthly Net Savings Rate (Target >= 20%)
  const netSavings = Math.max(0, monthlyIncome - monthlyExpenses);
  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;

  if (savingsRate >= 20) {
    results.push({
      id: 'rule_savings_rate',
      title: 'Strong Monthly Savings Rate',
      score: 95,
      status: 'HEALTHY',
      message: `You are saving ${savingsRate.toFixed(1)}% of your monthly earnings!`,
      details: `Net savings margin of ₱${Math.round(netSavings).toLocaleString()} monthly meets the Philippine benchmark of 20%+.`,
      recommendation: 'Keep automating savings into high-yield digital banks or emergency vaults on payday.',
      metricLabel: 'Savings Rate',
      metricValue: `${savingsRate.toFixed(1)}%`,
    });
  } else if (savingsRate >= 10) {
    results.push({
      id: 'rule_savings_rate',
      title: 'Moderate Savings Rate',
      score: 65,
      status: 'WARNING',
      message: `Saving ${savingsRate.toFixed(1)}% of earnings. Target is 20%.`,
      details: `Net positive cashflow of ₱${Math.round(netSavings).toLocaleString()} provides room for improvement.`,
      recommendation: 'Use the Payday Budgeter to earmark an additional 5-10% into savings before spending.',
      metricLabel: 'Savings Rate',
      metricValue: `${savingsRate.toFixed(1)}%`,
    });
  } else {
    results.push({
      id: 'rule_savings_rate',
      title: 'Tight Cashflow Margin',
      score: 25,
      status: 'ALERT',
      message: `Saving only ${savingsRate.toFixed(1)}% of monthly income.`,
      details: monthlyExpenses >= monthlyIncome
        ? `Monthly expenses (₱${monthlyExpenses.toLocaleString()}) meet or exceed income (₱${monthlyIncome.toLocaleString()}).`
        : `Net monthly margin is only ₱${Math.round(netSavings).toLocaleString()}.`,
      recommendation: 'Review discretionary spending and cut non-essential recurring subscriptions immediately.',
      metricLabel: 'Savings Rate',
      metricValue: `${savingsRate.toFixed(1)}%`,
    });
  }

  // Rule 4: Budget Adherence & Overspend Control
  if (budgets.length > 0) {
    let overspentCount = 0;
    budgets.forEach(b => {
      const catSpent = transactions
        .filter(t => t.type === 'EXPENSE' && t.category.toLowerCase() === b.categoryName.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      if (catSpent > b.limitAmount) overspentCount++;
    });

    if (overspentCount === 0) {
      results.push({
        id: 'rule_budget_control',
        title: 'Disciplined Budget Control',
        score: 96,
        status: 'HEALTHY',
        message: 'All monitored categories are within allocated limits!',
        details: `${budgets.length} budget categories actively tracking with zero breaches.`,
        recommendation: 'Review limits quarterly to optimize allocations as priorities evolve.',
        metricLabel: 'Breached Budgets',
        metricValue: '0 Breaches',
      });
    } else if (overspentCount === 1) {
      results.push({
        id: 'rule_budget_control',
        title: 'Minor Budget Overrun',
        score: 68,
        status: 'WARNING',
        message: '1 category has exceeded its allocated limit.',
        details: 'Check your Budget Cycles tab to identify and balance the overrun.',
        recommendation: 'Reallocate surplus funds from an under-utilized category to maintain balance.',
        metricLabel: 'Breached Budgets',
        metricValue: '1 Category',
      });
    } else {
      results.push({
        id: 'rule_budget_control',
        title: 'Multiple Category Overruns',
        score: 35,
        status: 'ALERT',
        message: `${overspentCount} categories have exceeded their spending caps.`,
        details: `Frequent budget overruns can deplete emergency reserves and increase reliance on credit.`,
        recommendation: 'Re-align category caps with actual living costs and freeze non-essential purchases.',
        metricLabel: 'Breached Budgets',
        metricValue: `${overspentCount} Breaches`,
      });
    }
  } else {
    results.push({
      id: 'rule_budget_control',
      title: 'No Active Budget Caps Set',
      score: 55,
      status: 'WARNING',
      message: 'You have not configured category budget limits yet.',
      details: 'Without set boundaries, spending leaks can go unnoticed throughout the month.',
      recommendation: 'Head to Budget Cycles to set realistic limits for Groceries, Dining, and Utilities.',
      metricLabel: 'Budget Caps',
      metricValue: 'Unconfigured',
    });
  }

  // Rule 5: Discretionary Wants vs. Needs Leakage
  const WANTS_KEYWORDS = ['dining', 'restaurant', 'food delivery', 'jollibee', 'grabfood', 'foodpanda', 'coffee', 'milk tea', 'shopping', 'gadgets', 'gaming', 'entertainment', 'netflix', 'hobbies', 'travel', 'leisure'];
  let wantsSpent = 0;
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    const isWant = WANTS_KEYWORDS.some(kw => t.category.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw));
    if (isWant) wantsSpent += t.amount;
  });
  const wantsRatio = monthlyExpenses > 0 ? (wantsSpent / monthlyExpenses) * 100 : 0;

  if (wantsRatio > 45) {
    results.push({
      id: 'rule_wants_leak',
      title: 'Discretionary Wants Overload',
      score: 40,
      status: 'ALERT',
      message: `Discretionary wants account for ${wantsRatio.toFixed(1)}% of your expenses.`,
      details: `₱${Math.round(wantsSpent).toLocaleString()} spent on dining out, shopping, and entertainment against ₱${monthlyExpenses.toLocaleString()} total expenses.`,
      recommendation: 'Adopt a "72-hour purchase pause" before non-essential online checkout orders.',
      metricLabel: 'Wants Ratio',
      metricValue: `${wantsRatio.toFixed(1)}%`,
    });
  } else if (wantsRatio > 30) {
    results.push({
      id: 'rule_wants_leak',
      title: 'Moderate Lifestyle Spending',
      score: 75,
      status: 'WARNING',
      message: `Wants take up ${wantsRatio.toFixed(1)}% of spending (ideal target is 30%).`,
      details: `Balanced lifestyle, but keep an eye on food deliveries and impulse shopping.`,
      recommendation: 'Earmark a dedicated weekly cash wallet or GCash sub-wallet for dining & fun.',
      metricLabel: 'Wants Ratio',
      metricValue: `${wantsRatio.toFixed(1)}%`,
    });
  } else {
    results.push({
      id: 'rule_wants_leak',
      title: 'Disciplined Wants Spending',
      score: 95,
      status: 'HEALTHY',
      message: `Wants are well-controlled at ${wantsRatio.toFixed(1)}% of total living costs.`,
      details: 'Well within the recommended 30% threshold of the 50/30/20 budget principle.',
      recommendation: 'You have room for occasional treats without compromising financial security.',
      metricLabel: 'Wants Ratio',
      metricValue: `${wantsRatio.toFixed(1)}%`,
    });
  }

  // Rule 6: BNPL & Active Installments Burden
  const activeInstallments = monthlyInstallments.filter(i => i.paidMonths < i.totalMonths);
  const totalInstallmentMonthly = activeInstallments.reduce((sum, i) => sum + i.monthlyPayment, 0);
  const installmentRatio = monthlyIncome > 0 ? (totalInstallmentMonthly / monthlyIncome) * 100 : 0;

  if (activeInstallments.length > 3 || installmentRatio > 25) {
    results.push({
      id: 'rule_bnpl_exposure',
      title: 'High BNPL & Installment Load',
      score: 35,
      status: 'ALERT',
      message: `${activeInstallments.length} active plans consuming ${installmentRatio.toFixed(1)}% of income.`,
      details: `Monthly installment obligation of ₱${totalInstallmentMonthly.toLocaleString()} ties down future cashflow.`,
      recommendation: 'Avoid new SPayLater or credit card amortizations until at least 2 active plans mature.',
      metricLabel: 'Active Plans',
      metricValue: `${activeInstallments.length} Plans`,
    });
  } else if (activeInstallments.length > 0) {
    results.push({
      id: 'rule_bnpl_exposure',
      title: 'Manageable Installments',
      score: 80,
      status: 'HEALTHY',
      message: `${activeInstallments.length} active plan(s) taking ${installmentRatio.toFixed(1)}% of income.`,
      details: `Manageable commitment of ₱${totalInstallmentMonthly.toLocaleString()} / month.`,
      recommendation: 'Continue paying on time to protect credit rating and avoid compounding fees.',
      metricLabel: 'Monthly BNPL',
      metricValue: `₱${totalInstallmentMonthly.toLocaleString()}`,
    });
  } else {
    results.push({
      id: 'rule_bnpl_exposure',
      title: 'Zero BNPL / Installment Debt',
      score: 100,
      status: 'HEALTHY',
      message: 'You have zero active installment or PayLater amortizations!',
      details: '100% of your future paychecks are free from consumer debt claims.',
      recommendation: 'Maintain zero BNPL habits and build sinking funds for gadget purchases instead.',
      metricLabel: 'BNPL Burden',
      metricValue: '₱0 / mo',
    });
  }

  return results;
}

export interface HealthScoreResult {
  score: number;
  tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'VULNERABLE';
  tierLabel: string;
  tierEnglish: string;
  tierColor: string;
  summary: string;
  subScores: {
    emergencyRunway: { score: number; max: number; label: string; value: string; status: 'GOOD' | 'FAIR' | 'POOR' };
    commitmentRatio: { score: number; max: number; label: string; value: string; status: 'GOOD' | 'FAIR' | 'POOR' };
    savingsRate: { score: number; max: number; label: string; value: string; status: 'GOOD' | 'FAIR' | 'POOR' };
    budgetControl: { score: number; max: number; label: string; value: string; status: 'GOOD' | 'FAIR' | 'POOR' };
    solvencyRatio: { score: number; max: number; label: string; value: string; status: 'GOOD' | 'FAIR' | 'POOR' };
  };
}

export function calculateComprehensiveHealthScore(data: {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalLiquidFunds: number;
  totalFixedCommitments: number;
  totalLiabilities: number;
  budgets: BudgetLimit[];
  transactions: Transaction[];
}): HealthScoreResult {
  const {
    monthlyIncome,
    monthlyExpenses,
    totalLiquidFunds,
    totalFixedCommitments,
    totalLiabilities,
    budgets,
    transactions,
  } = data;

  // 1. Emergency Runway (Max 25 pts)
  const monthlyEssential = Math.max(1, totalFixedCommitments + (monthlyExpenses * 0.5));
  const runwayMonths = totalLiquidFunds / monthlyEssential;
  let runwayScore = 0;
  if (runwayMonths >= 6) runwayScore = 25;
  else if (runwayMonths >= 3) runwayScore = 20;
  else if (runwayMonths >= 1) runwayScore = 12;
  else runwayScore = 5;

  // 2. Commitment Ratio (Max 25 pts)
  const commitmentPct = monthlyIncome > 0 ? (totalFixedCommitments / monthlyIncome) * 100 : 0;
  let commitmentScore = 0;
  if (commitmentPct <= 30) commitmentScore = 25;
  else if (commitmentPct <= 40) commitmentScore = 20;
  else if (commitmentPct <= 50) commitmentScore = 12;
  else commitmentScore = 5;

  // 3. Savings Rate (Max 20 pts)
  const netSavings = Math.max(0, monthlyIncome - monthlyExpenses);
  const savingsPct = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
  let savingsScore = 0;
  if (savingsPct >= 25) savingsScore = 20;
  else if (savingsPct >= 15) savingsScore = 16;
  else if (savingsPct >= 5) savingsScore = 10;
  else if (savingsPct > 0) savingsScore = 5;
  else savingsScore = 0;

  // 4. Budget Control (Max 15 pts)
  let budgetScore = 10; // Default baseline
  if (budgets.length > 0) {
    let breached = 0;
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.type === 'EXPENSE' && t.category.toLowerCase() === b.categoryName.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent > b.limitAmount) breached++;
    });
    if (breached === 0) budgetScore = 15;
    else if (breached === 1) budgetScore = 10;
    else budgetScore = 4;
  }

  // 5. Solvency Ratio (Max 15 pts)
  let solvencyScore = 0;
  if (totalLiabilities <= 0) {
    solvencyScore = 15;
  } else if (totalLiquidFunds >= totalLiabilities * 2) {
    solvencyScore = 15;
  } else if (totalLiquidFunds >= totalLiabilities) {
    solvencyScore = 11;
  } else {
    solvencyScore = 4;
  }

  const totalScore = Math.min(100, Math.round(runwayScore + commitmentScore + savingsScore + budgetScore + solvencyScore));

  let tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'VULNERABLE' = 'FAIR';
  let tierLabel = 'Katamtaman';
  let tierEnglish = 'Fair / Needs Optimization';
  let tierColor = 'text-amber-600 dark:text-amber-400';
  let summary = 'You have a functional financial foundation, but building your emergency cushion and trimming fixed commitments will boost resilience.';

  if (totalScore >= 85) {
    tier = 'EXCELLENT';
    tierLabel = 'Matatag';
    tierEnglish = 'Financially Resilient';
    tierColor = 'text-emerald-700 dark:text-emerald-400';
    summary = 'Excellent financial strength! Your savings runway, debt discipline, and cashflow margins provide robust peace of mind.';
  } else if (totalScore >= 70) {
    tier = 'GOOD';
    tierLabel = 'Mabuti';
    tierEnglish = 'Healthy & Stable';
    tierColor = 'text-teal-700 dark:text-teal-400';
    summary = 'Good financial posture! Your budget and commitments are balanced. Keep strengthening your liquid savings reserve.';
  } else if (totalScore < 50) {
    tier = 'VULNERABLE';
    tierLabel = 'Nanganganib';
    tierEnglish = 'High Financial Stress';
    tierColor = 'text-rose-600 dark:text-rose-400';
    summary = 'Your finances are vulnerable to unexpected disruptions. Prioritize freezing new debt and establishing a 1-month emergency buffer.';
  }

  return {
    score: totalScore,
    tier,
    tierLabel,
    tierEnglish,
    tierColor,
    summary,
    subScores: {
      emergencyRunway: {
        score: runwayScore,
        max: 25,
        label: 'Emergency Runway',
        value: `${runwayMonths.toFixed(1)} mos`,
        status: runwayScore >= 20 ? 'GOOD' : runwayScore >= 12 ? 'FAIR' : 'POOR',
      },
      commitmentRatio: {
        score: commitmentScore,
        max: 25,
        label: 'Fixed Commitments',
        value: `${commitmentPct.toFixed(1)}%`,
        status: commitmentScore >= 20 ? 'GOOD' : commitmentScore >= 12 ? 'FAIR' : 'POOR',
      },
      savingsRate: {
        score: savingsScore,
        max: 20,
        label: 'Savings Rate',
        value: `${savingsPct.toFixed(1)}%`,
        status: savingsScore >= 16 ? 'GOOD' : savingsScore >= 10 ? 'FAIR' : 'POOR',
      },
      budgetControl: {
        score: budgetScore,
        max: 15,
        label: 'Budget Discipline',
        value: budgets.length > 0 ? `${budgetScore}/15 pts` : 'No Caps Set',
        status: budgetScore >= 12 ? 'GOOD' : budgetScore >= 8 ? 'FAIR' : 'POOR',
      },
      solvencyRatio: {
        score: solvencyScore,
        max: 15,
        label: 'Asset / Debt Buffer',
        value: totalLiabilities > 0 ? `₱${Math.round(totalLiquidFunds).toLocaleString()} vs ₱${Math.round(totalLiabilities).toLocaleString()}` : 'Debt-Free',
        status: solvencyScore >= 12 ? 'GOOD' : solvencyScore >= 8 ? 'FAIR' : 'POOR',
      },
    },
  };
}

export interface BudgetDistributionAudit {
  totalIncome: number;
  totalExpenses: number;
  needsAmount: number;
  needsPercentage: number;
  wantsAmount: number;
  wantsPercentage: number;
  savingsAmount: number;
  savingsPercentage: number;
  targetNeedsPct: number;
  targetWantsPct: number;
  targetSavingsPct: number;
  summaryAdvice: string;
}

export function calculate50_30_20Breakdown(transactions: Transaction[], monthlyIncome: number): BudgetDistributionAudit {
  const NEEDS_KEYWORDS = [
    'utilities', 'meralco', 'electric', 'water', 'maynilad', 'manila water',
    'internet', 'converge', 'pldt', 'globe', 'smart', 'rent', 'housing',
    'mortgage', 'groceries', 'grocery', 'market', 'supermarket', 'puregold',
    'transport', 'gas', 'gasoline', 'petrol', 'commute', 'jeep', 'bus',
    'mrt', 'lrt', 'fare', 'toll', 'rfid', 'medicine', 'health', 'medical',
    'hospital', 'clinic', 'insurance', 'education', 'tuition', 'school',
    'loan', 'debt', 'tax', 'sss', 'pag-ibig', 'philhealth'
  ];

  let needsAmount = 0;
  let wantsAmount = 0;

  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    const text = `${t.category} ${t.description}`.toLowerCase();
    const isNeed = NEEDS_KEYWORDS.some(kw => text.includes(kw));
    if (isNeed) {
      needsAmount += t.amount;
    } else {
      wantsAmount += t.amount;
    }
  });

  const totalExpenses = needsAmount + wantsAmount;
  const baseIncome = Math.max(monthlyIncome, totalExpenses);
  const savingsAmount = Math.max(0, baseIncome - totalExpenses);

  const needsPercentage = baseIncome > 0 ? Math.round((needsAmount / baseIncome) * 100) : 0;
  const wantsPercentage = baseIncome > 0 ? Math.round((wantsAmount / baseIncome) * 100) : 0;
  const savingsPercentage = baseIncome > 0 ? Math.round((savingsAmount / baseIncome) * 100) : 0;

  let summaryAdvice = 'Your spending distribution aligns comfortably with the balanced 50/30/20 guideline.';
  if (needsPercentage > 60) {
    summaryAdvice = 'Needs consume over 60% of income. Focus on reducing utility waste and searching for lower fixed costs.';
  } else if (wantsPercentage > 35) {
    summaryAdvice = `Discretionary wants (${wantsPercentage}%) are crowding out savings. Reallocating 5-10% into savings will accelerate your goals.`;
  } else if (savingsPercentage < 15) {
    summaryAdvice = 'Your savings rate is below the 20% benchmark. Automate payday transfers to pay yourself first.';
  }

  return {
    totalIncome: baseIncome,
    totalExpenses,
    needsAmount,
    needsPercentage,
    wantsAmount,
    wantsPercentage,
    savingsAmount,
    savingsPercentage,
    targetNeedsPct: 50,
    targetWantsPct: 30,
    targetSavingsPct: 20,
    summaryAdvice,
  };
}

export interface EmergencyRunwayScenario {
  totalLiquidFunds: number;
  monthlyTotalExpenses: number;
  monthlyEssentialExpenses: number;
  normalRunwayMonths: number;
  normalRunwayDays: number;
  normalSurvivalDateStr: string;
  bareBonesRunwayMonths: number;
  bareBonesRunwayDays: number;
  bareBonesSurvivalDateStr: string;
  status: 'SAFE' | 'MODERATE' | 'CRITICAL';
  recommendation: string;
}

export function calculateEmergencyRunwayScenario(
  liquidFunds: number,
  totalExpenses: number,
  essentialExpenses: number
): EmergencyRunwayScenario {
  const monthlyTotal = Math.max(1, totalExpenses);
  const monthlyEssential = Math.max(1, essentialExpenses);

  const normalMonths = liquidFunds / monthlyTotal;
  const normalDays = Math.round(normalMonths * 30.4);

  const bareBonesMonths = liquidFunds / monthlyEssential;
  const bareBonesDays = Math.round(bareBonesMonths * 30.4);

  const now = new Date();
  const normalDate = new Date(now.getTime() + normalDays * 24 * 60 * 60 * 1000);
  const bareBonesDate = new Date(now.getTime() + bareBonesDays * 24 * 60 * 60 * 1000);

  const formatDateShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let status: 'SAFE' | 'MODERATE' | 'CRITICAL' = 'MODERATE';
  let recommendation = 'Aim to increase your cash buffer until it covers 3 full months of living costs.';

  if (normalMonths >= 3) {
    status = 'SAFE';
    recommendation = 'You have a healthy liquidity buffer. You can weather unexpected income gaps comfortably.';
  } else if (normalMonths < 1) {
    status = 'CRITICAL';
    recommendation = 'Immediate priority: Cut non-essential spending to tipid mode to extend your survival runway.';
  }

  return {
    totalLiquidFunds: liquidFunds,
    monthlyTotalExpenses: monthlyTotal,
    monthlyEssentialExpenses: monthlyEssential,
    normalRunwayMonths: Math.round(normalMonths * 10) / 10,
    normalRunwayDays: normalDays,
    normalSurvivalDateStr: formatDateShort(normalDate),
    bareBonesRunwayMonths: Math.round(bareBonesMonths * 10) / 10,
    bareBonesRunwayDays: bareBonesDays,
    bareBonesSurvivalDateStr: formatDateShort(bareBonesDate),
    status,
    recommendation,
  };
}

export interface NetWorthSnapshot {
  liquidAssets: number;
  goalSavings: number;
  totalAssets: number;
  installmentLiability: number;
  loanLiability: number;
  totalLiabilities: number;
  netWorth: number;
  debtToAssetRatio: number;
  solvencyGrade: 'SOLVENT' | 'LEVERAGED' | 'DEFICIT';
}

export function calculateNetWorthSnapshot(data: {
  accounts: FinancialAccount[];
  savingsGoals: SavingsGoal[];
  installments: Installment[];
  debts: DebtLoan[];
}): NetWorthSnapshot {
  const { accounts, savingsGoals, installments, debts } = data;

  const liquidAssets = accounts
    .filter(a => a.type !== 'CREDIT_CARD' && a.type !== 'BNPL')
    .reduce((sum, a) => sum + a.balance, 0);

  const goalSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalAssets = liquidAssets + goalSavings;

  const installmentLiability = installments.reduce((sum, i) => {
    const remMonths = Math.max(0, i.totalMonths - i.paidMonths);
    return sum + (remMonths * i.monthlyPayment);
  }, 0);

  const loanLiability = debts
    .filter(d => d.type === 'I_OWE')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalLiabilities = installmentLiability + loanLiability;
  const netWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : (totalLiabilities > 0 ? 100 : 0);

  let solvencyGrade: 'SOLVENT' | 'LEVERAGED' | 'DEFICIT' = 'SOLVENT';
  if (netWorth < 0) solvencyGrade = 'DEFICIT';
  else if (debtToAssetRatio > 50) solvencyGrade = 'LEVERAGED';

  return {
    liquidAssets,
    goalSavings,
    totalAssets,
    installmentLiability,
    loanLiability,
    totalLiabilities,
    netWorth,
    debtToAssetRatio,
    solvencyGrade,
  };
}

export interface DebtPayoffTrajectory {
  totalLiability: number;
  monthlyObligation: number;
  monthsToDebtFreeStandard: number;
  simulatedExtraPayment: number;
  monthsToDebtFreeAccelerated: number;
  monthsSaved: number;
  interestSavedEst: number;
}

export function calculateDebtPayoffTrajectory(
  totalLiability: number,
  monthlyObligation: number,
  simulatedExtraPayment: number = 1000
): DebtPayoffTrajectory {
  const baseMonthly = Math.max(1, monthlyObligation);
  const standardMonths = Math.ceil(totalLiability / baseMonthly);

  const acceleratedMonthly = baseMonthly + Math.max(0, simulatedExtraPayment);
  const acceleratedMonths = Math.ceil(totalLiability / acceleratedMonthly);

  const monthsSaved = Math.max(0, standardMonths - acceleratedMonths);
  // Rough estimate of 2.5% monthly financing interest saved per month cut
  const interestSavedEst = Math.round(totalLiability * 0.02 * monthsSaved);

  return {
    totalLiability,
    monthlyObligation: baseMonthly,
    monthsToDebtFreeStandard: standardMonths,
    simulatedExtraPayment,
    monthsToDebtFreeAccelerated: acceleratedMonths,
    monthsSaved,
    interestSavedEst,
  };
}

export interface CashFlowVelocity {
  currentDayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  monthToDateExpenses: number;
  dailyAverageBurn: number;
  monthlyIncome: number;
  fixedCommitments: number;
  savingsTarget: number;
  availableRemainingPool: number;
  safeDailyLimit: number;
  projectedMonthEndExpense: number;
  projectedSurplusOrDeficit: number;
  velocityStatus: 'ON_TRACK' | 'CAUTION' | 'FAST_BURN';
  paceVarianceDaily: number;
  summaryAdvice: string;
}

export function calculateCashFlowVelocity(
  transactions: Transaction[],
  monthlyIncome: number,
  fixedCommitments: number,
  savingsTarget: number = 0
): CashFlowVelocity {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDayOfMonth = Math.max(1, now.getDate());
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDayOfMonth + 1);

  const curMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(curMonthPrefix));

  const monthToDateExpenses = monthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyAverageBurn = Math.round(monthToDateExpenses / currentDayOfMonth);
  const availableRemainingPool = monthlyIncome - fixedCommitments - savingsTarget - monthToDateExpenses;
  const safeDailyLimit = Math.max(0, Math.round(availableRemainingPool / daysRemaining));

  const projectedMonthEndExpense = monthToDateExpenses + (dailyAverageBurn * (daysRemaining - 1));
  const projectedSurplusOrDeficit = monthlyIncome - fixedCommitments - savingsTarget - projectedMonthEndExpense;

  const paceVarianceDaily = dailyAverageBurn - safeDailyLimit;

  let velocityStatus: 'ON_TRACK' | 'CAUTION' | 'FAST_BURN' = 'ON_TRACK';
  let summaryAdvice = '';

  if (dailyAverageBurn > safeDailyLimit * 1.3 && availableRemainingPool > 0) {
    velocityStatus = 'FAST_BURN';
    summaryAdvice = `Mabilis ang takbo ng paggastos (₱${dailyAverageBurn}/araw). Kung magpapatuloy, maaari kang kapusin ng humigit-kumulang ₱${Math.abs(projectedSurplusOrDeficit).toLocaleString()} bago matapos ang buwan.`;
  } else if (dailyAverageBurn > safeDailyLimit || availableRemainingPool <= 0) {
    velocityStatus = 'CAUTION';
    summaryAdvice = `Kailangan ng kaunting pag-iingat sa araw-araw. Ang iyong safe daily spend cap ay ₱${safeDailyLimit}/araw upang makamit ang iyong buwanang ipon.`;
  } else {
    velocityStatus = 'ON_TRACK';
    summaryAdvice = `Nasa magandang takbo ang iyong cash flow! Ang iyong average na gastos ay ₱${dailyAverageBurn}/araw kumpara sa safe cap na ₱${safeDailyLimit}/araw.`;
  }

  return {
    currentDayOfMonth,
    daysInMonth,
    daysRemaining,
    monthToDateExpenses,
    dailyAverageBurn,
    monthlyIncome,
    fixedCommitments,
    savingsTarget,
    availableRemainingPool,
    safeDailyLimit,
    projectedMonthEndExpense,
    projectedSurplusOrDeficit,
    velocityStatus,
    paceVarianceDaily,
    summaryAdvice,
  };
}

export interface LeakageItem {
  id: string;
  name: string;
  category: string;
  totalSpent: number;
  transactionCount: number;
  monthlyFrequencyLabel: string;
  potentialMonthlySaving25: number;
  potentialAnnualSaving25: number;
}

export interface BudgetStressAndLeaks {
  totalLeakAmount: number;
  leakCount: number;
  leaks: LeakageItem[];
  overBudgetCategories: Array<{ category: string; spent: number; limit: number; overAmount: number }>;
  nearLimitCategories: Array<{ category: string; spent: number; limit: number; percentUsed: number }>;
  annualLeakPotentialSavings: number;
}

export function calculateBudgetStressAndLeaks(
  transactions: Transaction[],
  budgets: BudgetLimit[] = []
): BudgetStressAndLeaks {
  const now = new Date();
  const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = transactions.filter(t => t.type === 'EXPENSE' && (!t.date || t.date.startsWith(curMonthPrefix)));

  // 1. Budget Stress
  const spentByCat = new Map<string, number>();
  for (const t of monthExpenses) {
    spentByCat.set(t.category, (spentByCat.get(t.category) || 0) + t.amount);
  }

  const overBudgetCategories: Array<{ category: string; spent: number; limit: number; overAmount: number }> = [];
  const nearLimitCategories: Array<{ category: string; spent: number; limit: number; percentUsed: number }> = [];

  for (const b of budgets) {
    const spent = spentByCat.get(b.categoryName) || 0;
    const pct = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
    if (spent > b.limitAmount) {
      overBudgetCategories.push({
        category: b.categoryName,
        spent,
        limit: b.limitAmount,
        overAmount: spent - b.limitAmount,
      });
    } else if (pct >= 80) {
      nearLimitCategories.push({
        category: b.categoryName,
        spent,
        limit: b.limitAmount,
        percentUsed: Math.round(pct),
      });
    }
  }

  // 2. Micro-spending leak detection patterns
  const leakPatterns = [
    { id: 'leak_delivery', name: 'Food Delivery & Online Orders', keywords: ['grab', 'foodpanda', 'delivery', 'pickaroo'] },
    { id: 'leak_coffee', name: 'Milk Tea, Coffee & Merienda', keywords: ['coffee', 'starbucks', 'milktea', 'milk tea', 'boba', 'pickup', 'merienda', 'kopi', 'tea'] },
    { id: 'leak_convenience', name: 'Convenience Stores & Quick Marts', keywords: ['7-eleven', '711', 'ministop', 'lawson', 'alfamart', 'uncle john'] },
    { id: 'leak_gaming', name: 'Gaming, Digital Top-ups & In-app Buys', keywords: ['steam', 'mlbb', 'codm', 'roblox', 'genshin', 'valorant', 'game', 'sub'] },
    { id: 'leak_shopping', name: 'Impulse Online Shopping (Flash Sales)', keywords: ['shopee', 'lazada', 'tiktok shop', 'shein', 'zalora'] },
  ];

  const leaksMap = new Map<string, { total: number; count: number }>();

  for (const t of monthExpenses) {
    const text = `${t.description} ${t.category} ${t.notes || ''}`.toLowerCase();
    for (const pat of leakPatterns) {
      if (pat.keywords.some(k => text.includes(k))) {
        const cur = leaksMap.get(pat.id) || { total: 0, count: 0 };
        leaksMap.set(pat.id, { total: cur.total + t.amount, count: cur.count + 1 });
        break; // Match primary pattern
      }
    }
  }

  const leaks: LeakageItem[] = [];
  let totalLeakAmount = 0;
  let leakCount = 0;

  for (const pat of leakPatterns) {
    const stat = leaksMap.get(pat.id);
    if (stat && stat.total > 0) {
      totalLeakAmount += stat.total;
      leakCount += stat.count;
      const saving25 = Math.round(stat.total * 0.25);
      leaks.push({
        id: pat.id,
        name: pat.name,
        category: pat.id,
        totalSpent: stat.total,
        transactionCount: stat.count,
        monthlyFrequencyLabel: `${stat.count} purchase${stat.count > 1 ? 's' : ''}`,
        potentialMonthlySaving25: saving25,
        potentialAnnualSaving25: saving25 * 12,
      });
    }
  }

  return {
    totalLeakAmount,
    leakCount,
    leaks,
    overBudgetCategories,
    nearLimitCategories,
    annualLeakPotentialSavings: Math.round(totalLeakAmount * 0.25 * 12),
  };
}

export interface SavingsMilestone {
  level: number;
  title: string;
  filipinoTitle: string;
  targetAmount: number;
  description: string;
  isUnlocked: boolean;
  progressPercentage: number;
}

export interface EmergencySavingsLadder {
  currentLiquidSavings: number;
  monthlyEssentialSpend: number;
  currentLevel: number;
  currentLevelLabel: string;
  nextMilestoneTitle: string;
  nextMilestoneTarget: number;
  gapToNextMilestone: number;
  progressToNextMilestone: number;
  monthsToNextMilestone: number;
  milestones: SavingsMilestone[];
}

export function calculateEmergencySavingsLadder(
  currentLiquidSavings: number,
  monthlyEssentialSpend: number,
  monthlySavingsContribution: number = 3000
): EmergencySavingsLadder {
  const baseEssential = Math.max(5000, monthlyEssentialSpend);
  const starterBuffer = 15000;
  const oneMonthBuffer = baseEssential;
  const threeMonthBuffer = baseEssential * 3;
  const sixMonthBuffer = baseEssential * 6;

  const milestones: SavingsMilestone[] = [
    {
      level: 1,
      title: 'Starter Emergency Cushion',
      filipinoTitle: 'Pang-unang Reserba',
      targetAmount: starterBuffer,
      description: 'Proteksyon laban sa biglaang clinic checkup, gamot, o pagkumpuni ng motorsiklo/appliances nang hindi nangungutang.',
      isUnlocked: currentLiquidSavings >= starterBuffer,
      progressPercentage: Math.min(100, Math.round((currentLiquidSavings / starterBuffer) * 100)),
    },
    {
      level: 2,
      title: '1-Month Basic Needs Runway',
      filipinoTitle: '1-Buwang Sahod / Pangangailangan',
      targetAmount: oneMonthBuffer,
      description: 'Sapat upang mabayaran ang upa, kuryente, pagkain, at commute sa loob ng isang buong buwan.',
      isUnlocked: currentLiquidSavings >= oneMonthBuffer,
      progressPercentage: Math.min(100, Math.round((currentLiquidSavings / oneMonthBuffer) * 100)),
    },
    {
      level: 3,
      title: '3-Month Stability Runway (Gold Standard)',
      filipinoTitle: '3-Buwang Katatagan ng Pamilya',
      targetAmount: threeMonthBuffer,
      description: 'Ang pamantayang antas ng kaligtasan para sa mga empleyado at pamilyang Pilipino.',
      isUnlocked: currentLiquidSavings >= threeMonthBuffer,
      progressPercentage: Math.min(100, Math.round((currentLiquidSavings / threeMonthBuffer) * 100)),
    },
    {
      level: 4,
      title: '6-Month Career & Life Freedom',
      filipinoTitle: '6-Buwang Buong Kalayaan',
      targetAmount: sixMonthBuffer,
      description: 'Buong katahimikan ng isip kahit magpalit ng trabaho, mag-negosyo, o magkaroon ng matagalang pagkaantala ng kita.',
      isUnlocked: currentLiquidSavings >= sixMonthBuffer,
      progressPercentage: Math.min(100, Math.round((currentLiquidSavings / sixMonthBuffer) * 100)),
    },
  ];

  let currentLevel = 0;
  let currentLevelLabel = 'Nagsisimula pa lamang (Starting Up)';

  for (const m of milestones) {
    if (m.isUnlocked) {
      currentLevel = m.level;
      currentLevelLabel = `Antas ${m.level}: ${m.filipinoTitle}`;
    }
  }

  const nextMilestone = milestones.find(m => !m.isUnlocked) || milestones[milestones.length - 1];
  const gapToNextMilestone = Math.max(0, nextMilestone.targetAmount - currentLiquidSavings);
  const progressToNextMilestone = nextMilestone.progressPercentage;

  const validMonthlyContribution = Math.max(500, monthlySavingsContribution);
  const monthsToNextMilestone = gapToNextMilestone > 0 ? Math.ceil(gapToNextMilestone / validMonthlyContribution) : 0;

  return {
    currentLiquidSavings,
    monthlyEssentialSpend: baseEssential,
    currentLevel,
    currentLevelLabel,
    nextMilestoneTitle: nextMilestone.filipinoTitle,
    nextMilestoneTarget: nextMilestone.targetAmount,
    gapToNextMilestone,
    progressToNextMilestone,
    monthsToNextMilestone,
    milestones,
  };
}

export interface IncomeStabilityAndDebtRisk {
  totalIncome: number;
  primarySalary: number;
  secondaryIncome: number;
  diversificationRatio: number;
  debtToIncomeRatio: number;
  dtiStatus: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
  statusLabel: string;
  recommendation: string;
}

export function calculateIncomeStabilityAndDebtRisk(
  transactions: Transaction[],
  monthlyDebtObligations: number = 0
): IncomeStabilityAndDebtRisk {
  const incomes = transactions.filter(t => t.type === 'INCOME');
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0) || 35000;

  const primarySalary = incomes
    .filter(t => t.category.toLowerCase().includes('salary') || t.subcategory?.toLowerCase().includes('salary'))
    .reduce((sum, t) => sum + t.amount, 0) || (totalIncome * 0.85);

  const secondaryIncome = Math.max(0, totalIncome - primarySalary);
  const diversificationRatio = totalIncome > 0 ? Math.round((secondaryIncome / totalIncome) * 100) : 0;

  const dtiRatio = totalIncome > 0 ? Math.round((monthlyDebtObligations / totalIncome) * 100) : 0;

  let dtiStatus: 'HEALTHY' | 'MODERATE' | 'CRITICAL' = 'HEALTHY';
  let statusLabel = 'Optimal Debt-to-Income (< 20%)';
  let recommendation = 'Magaan at kontrolado ang mga buwanang bayarin. Magtabi sa high-yield savings (digital bank 4-6% p.a. o MP2).';

  if (dtiRatio > 35) {
    dtiStatus = 'CRITICAL';
    statusLabel = 'Mataas na Utang / Amortization (> 35%)';
    recommendation = 'Mahigit 35% ng iyong kita ay napupunta sa mga bayarin o BNPL. Ihinto muna ang pagkuha ng bagong hulugan at unahin ang debt snowball/avalanche.';
  } else if (dtiRatio >= 20) {
    dtiStatus = 'MODERATE';
    statusLabel = 'Katamtamang Amortization (20% – 35%)';
    recommendation = 'Kaya pang bayaran ngunit malapit na sa safety limit. Panatilihing mas mababa sa 30% ang kabuuang hulugan.';
  }

  return {
    totalIncome,
    primarySalary,
    secondaryIncome,
    diversificationRatio,
    debtToIncomeRatio: dtiRatio,
    dtiStatus,
    statusLabel,
    recommendation,
  };
}


