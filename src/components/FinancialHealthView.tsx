import React, { useState, useMemo } from 'react';
import {
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  CreditCard,
  Landmark,
  Sparkles,
  Sliders,
  DollarSign,
  Calendar,
  ShieldCheck,
  Plus,
  HelpCircle,
  Clock,
  Zap,
  Target,
  Scale,
  Gauge,
  Flame,
  Search,
  AlertCircle,
  ChevronRight,
  Check,
  Award,
} from 'lucide-react';
import {
  Transaction,
  RecurringBill,
  Installment,
  DebtLoan,
  SavingsGoal,
  BudgetLimit,
  BudgetCycle,
  Category,
  FinancialAccount,
} from '../types';
import {
  calculateFinancialHealthChecks,
  calculateComprehensiveHealthScore,
  calculate50_30_20Breakdown,
  calculateEmergencyRunwayScenario,
  calculateNetWorthSnapshot,
  calculateDebtPayoffTrajectory,
  calculateCashFlowVelocity,
  calculateBudgetStressAndLeaks,
  calculateEmergencySavingsLadder,
  calculateIncomeStabilityAndDebtRisk,
} from '../utils/financialCalculations';
import { formatPeso } from '../utils/formatters';

interface FinancialHealthViewProps {
  transactions: Transaction[];
  bills: RecurringBill[];
  installments: Installment[];
  debts: DebtLoan[];
  savingsGoals: SavingsGoal[];
  accounts?: FinancialAccount[];
  budgets?: BudgetLimit[];
  budgetCycles?: BudgetCycle[];
  categories?: Category[];
  onNavigateTab?: (tab: string) => void;
  onOpenPaydayWizard?: () => void;
  onOpenNewTransaction?: () => void;
}

export const FinancialHealthView: React.FC<FinancialHealthViewProps> = ({
  transactions,
  bills,
  installments,
  debts,
  savingsGoals,
  accounts = [],
  budgets = [],
  budgetCycles = [],
  categories = [],
  onNavigateTab,
  onOpenPaydayWizard,
  onOpenNewTransaction,
}) => {
  // Navigation tabs within Financial Health View
  const [activeSubTab, setActiveSubTab] = useState<
    'OVERVIEW' | 'CASHFLOW_PACING' | 'BUDGET_LEAKS' | 'SAVINGS_LADDER' | 'BUDGET_50_30_20' | 'RUNWAY_SIMULATOR' | 'DEBT_PAYOFF' | 'NET_WORTH' | 'CHECKPOINTS'
  >('OVERVIEW');

  // Interactive Runway Simulator Mode (Normal vs. Tipid Survival)
  const [isTipidSurvivalMode, setIsTipidSurvivalMode] = useState<boolean>(false);

  // Interactive Accelerated Debt Payoff Slider / Custom Value
  const [extraMonthlyDebtPayment, setExtraMonthlyDebtPayment] = useState<number>(1000);

  // Custom simulation target for cashflow pacing savings allocation
  const [simulatedSavingsTarget, setSimulatedSavingsTarget] = useState<number>(5000);

  // 1. Core Financial Aggregates
  const monthlyIncome = useMemo(() => {
    const total = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    return total > 0 ? total : 35000;
  }, [transactions]);

  const monthlyExpenses = useMemo(() => {
    const total = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    return total > 0 ? total : 18000;
  }, [transactions]);

  // Liquid Funds: Cash + Bank Accounts + E-Wallets
  const totalLiquidAccountBalance = useMemo(() => {
    const accBalance = accounts
      .filter((a) => a.type !== 'BNPL' && a.type !== 'CREDIT_CARD')
      .reduce((sum, a) => sum + a.balance, 0);
    if (accBalance > 0) return accBalance;
    const goalReserves = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    return goalReserves > 0 ? goalReserves : 15000;
  }, [accounts, savingsGoals]);

  // Fixed Monthly Commitments
  const totalFixedCommitments = useMemo(() => {
    const billCommitment = bills.reduce((sum, b) => sum + b.amount, 0);
    const instCommitment = installments.reduce((sum, i) => sum + i.monthlyPayment, 0);
    const debtCommitment = debts
      .filter((d) => d.type === 'I_OWE')
      .reduce((sum, d) => sum + (d.monthlyAmortization || 0), 0);
    return billCommitment + instCommitment + debtCommitment;
  }, [bills, installments, debts]);

  // Essential Living Expenses (Bills + Half of actual expenses for food/commute)
  const monthlyEssentialExpenses = useMemo(() => {
    return Math.max(1, totalFixedCommitments + monthlyExpenses * 0.5);
  }, [totalFixedCommitments, monthlyExpenses]);

  // Total Outstanding Liabilities (Installments + Loans)
  const totalLiabilities = useMemo(() => {
    const remInst = installments.reduce((sum, i) => {
      const remMonths = Math.max(0, i.totalMonths - i.paidMonths);
      return sum + remMonths * i.monthlyPayment;
    }, 0);
    const remDebts = debts
      .filter((d) => d.type === 'I_OWE')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
    return remInst + remDebts;
  }, [installments, debts]);

  // 2. Comprehensive Health Score & Tier
  const healthScoreResult = useMemo(() => {
    return calculateComprehensiveHealthScore({
      monthlyIncome,
      monthlyExpenses,
      totalLiquidFunds: totalLiquidAccountBalance,
      totalFixedCommitments,
      totalLiabilities,
      budgets,
      transactions,
    });
  }, [monthlyIncome, monthlyExpenses, totalLiquidAccountBalance, totalFixedCommitments, totalLiabilities, budgets, transactions]);

  // 3. The 6 Rule-Based Checkpoints
  const healthResults = useMemo(() => {
    return calculateFinancialHealthChecks({
      monthlyIncome,
      monthlyExpenses,
      monthlyRecurringBills: bills,
      monthlyInstallments: installments,
      debts,
      savingsGoals,
      liquidSavingsBalance: totalLiquidAccountBalance,
      budgets,
      transactions,
      categories,
    });
  }, [monthlyIncome, monthlyExpenses, bills, installments, debts, savingsGoals, totalLiquidAccountBalance, budgets, transactions, categories]);

  // 4. 50/30/20 Budget Breakdown Audit
  const budget503020 = useMemo(() => {
    return calculate50_30_20Breakdown(transactions, monthlyIncome);
  }, [transactions, monthlyIncome]);

  // 5. Emergency Runway Scenario
  const runwayScenario = useMemo(() => {
    return calculateEmergencyRunwayScenario(
      totalLiquidAccountBalance,
      monthlyExpenses,
      monthlyEssentialExpenses
    );
  }, [totalLiquidAccountBalance, monthlyExpenses, monthlyEssentialExpenses]);

  // 6. Net Worth & Solvency Snapshot
  const netWorthSnapshot = useMemo(() => {
    return calculateNetWorthSnapshot({
      accounts,
      savingsGoals,
      installments,
      debts,
    });
  }, [accounts, savingsGoals, installments, debts]);

  // 7. Debt Freedom Acceleration Trajectory
  const debtPayoff = useMemo(() => {
    const monthlyFinancing = totalFixedCommitments;
    return calculateDebtPayoffTrajectory(totalLiabilities, monthlyFinancing, extraMonthlyDebtPayment);
  }, [totalLiabilities, totalFixedCommitments, extraMonthlyDebtPayment]);

  // 8. NEW: Cash Flow Velocity & Safe Daily Spending Limit
  const cashFlowVelocity = useMemo(() => {
    return calculateCashFlowVelocity(transactions, monthlyIncome, totalFixedCommitments, simulatedSavingsTarget);
  }, [transactions, monthlyIncome, totalFixedCommitments, simulatedSavingsTarget]);

  // 9. NEW: Budget Stress & Tagas sa Bulsa (Leakage Radar)
  const budgetLeaks = useMemo(() => {
    return calculateBudgetStressAndLeaks(transactions, budgets);
  }, [transactions, budgets]);

  // 10. NEW: Emergency Savings Ladder & Milestone Matrix
  const savingsLadder = useMemo(() => {
    const monthlySavingsContrib = savingsGoals.reduce((sum, g) => sum + (g.monthlyTargetContribution || 0), 0) || 4000;
    return calculateEmergencySavingsLadder(totalLiquidAccountBalance, monthlyEssentialExpenses, monthlySavingsContrib);
  }, [totalLiquidAccountBalance, monthlyEssentialExpenses, savingsGoals]);

  // 11. NEW: Income Stability & Debt-to-Income Risk
  const incomeStability = useMemo(() => {
    return calculateIncomeStabilityAndDebtRisk(transactions, totalFixedCommitments);
  }, [transactions, totalFixedCommitments]);

  // Quick navigation helper
  const handleNav = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Hero Banner with Comprehensive Health Score */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 inline-block">
              Pangkalahatang Kalusugan ng Pera
            </span>
            <span className="text-xs font-semibold text-emerald-200/80">
              · Comprehensive Financial Diagnostic
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            IponTa Financial Health Engine
          </h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Personalized mathematical analysis of your budgeting control, daily cashflow velocity, micro-spending leaks, emergency runway, and debt obligations in the Philippine financial context.
          </p>
        </div>

        {/* Holistic Score Badge / Radial Metric */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-white/15 border border-white/20 text-center shadow-xs">
            <span className="text-3xl font-extrabold font-mono text-white leading-none">
              {healthScoreResult.score}
            </span>
            <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider mt-1">
              / 100 PTS
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-emerald-300">
                {healthScoreResult.tierLabel}
              </span>
              <span className="text-[11px] text-white/80 font-medium">
                ({healthScoreResult.tierEnglish})
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/80 max-w-xs leading-snug">
              {healthScoreResult.summary}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Pillars Quick Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Safe Daily Spend */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Safe Daily Limit</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatPeso(cashFlowVelocity.safeDailyLimit)}
          </p>
          <span className={`text-[10px] font-semibold ${
            cashFlowVelocity.velocityStatus === 'ON_TRACK' ? 'text-emerald-600 dark:text-emerald-400' :
            cashFlowVelocity.velocityStatus === 'CAUTION' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            Burn: {formatPeso(cashFlowVelocity.dailyAverageBurn)}/d
          </span>
        </div>

        {/* Metric 2: Emergency Runway */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Runway Buffer</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
            {healthScoreResult.subScores.emergencyRunway.value}
          </p>
          <span className={`text-[10px] font-semibold ${
            healthScoreResult.subScores.emergencyRunway.status === 'GOOD' ? 'text-emerald-600 dark:text-emerald-400' :
            healthScoreResult.subScores.emergencyRunway.status === 'FAIR' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            Target: 3–6 mos
          </span>
        </div>

        {/* Metric 3: Fixed Commitments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Commitments</span>
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
            {healthScoreResult.subScores.commitmentRatio.value}
          </p>
          <span className={`text-[10px] font-semibold ${
            healthScoreResult.subScores.commitmentRatio.status === 'GOOD' ? 'text-emerald-600 dark:text-emerald-400' :
            healthScoreResult.subScores.commitmentRatio.status === 'FAIR' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            Safety Cap: &le; 40%
          </span>
        </div>

        {/* Metric 4: Savings Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Savings Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
            {healthScoreResult.subScores.savingsRate.value}
          </p>
          <span className={`text-[10px] font-semibold ${
            healthScoreResult.subScores.savingsRate.status === 'GOOD' ? 'text-emerald-600 dark:text-emerald-400' :
            healthScoreResult.subScores.savingsRate.status === 'FAIR' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            Target: &ge; 20%
          </span>
        </div>

        {/* Metric 5: Budget Control */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Budget Control</span>
            <Wallet className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
            {healthScoreResult.subScores.budgetControl.value}
          </p>
          <span className={`text-[10px] font-semibold ${
            healthScoreResult.subScores.budgetControl.status === 'GOOD' ? 'text-emerald-600 dark:text-emerald-400' :
            healthScoreResult.subScores.budgetControl.status === 'FAIR' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {budgets.length} Monitored Caps
          </span>
        </div>

        {/* Metric 6: Net Liquid Solvency */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Solvency</span>
            <Scale className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatPeso(netWorthSnapshot.netWorth)}
          </p>
          <span className={`text-[10px] font-semibold ${
            netWorthSnapshot.solvencyGrade === 'SOLVENT' ? 'text-emerald-600 dark:text-emerald-400' :
            netWorthSnapshot.solvencyGrade === 'LEVERAGED' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {netWorthSnapshot.solvencyGrade === 'SOLVENT' ? 'Net Positive' : 'Leveraged'}
          </span>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs (Segmented Control) */}
      <div className="bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Diagnostic Hubs
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('CASHFLOW_PACING')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'CASHFLOW_PACING'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Daily Spend & Cashflow Velocity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('BUDGET_LEAKS')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'BUDGET_LEAKS'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Budget Stress & "Tagas sa Bulsa"</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SAVINGS_LADDER')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'SAVINGS_LADDER'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-500" />
          <span>Emergency Savings Ladder</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('BUDGET_50_30_20')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'BUDGET_50_30_20'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>50/30/20 Budget Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('RUNWAY_SIMULATOR')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'RUNWAY_SIMULATOR'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Runway Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('DEBT_PAYOFF')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'DEBT_PAYOFF'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Debt Accelerator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('NET_WORTH')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'NET_WORTH'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Net Solvency</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('CHECKPOINTS')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'CHECKPOINTS'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>6 Pillars</span>
        </button>
      </div>

      {/* 4. NEW FEATURE SECTION: Daily Spend & Cash Flow Velocity */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'CASHFLOW_PACING') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>Daily Spend & Cash Flow Velocity ("Araw-araw na Ligtas na Badyet")</span>
              </h2>
              <p className="text-xs text-slate-500">
                Calculates your exact daily spending ceiling based on your income, fixed commitments, and days remaining this month.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Day {cashFlowVelocity.currentDayOfMonth} of {cashFlowVelocity.daysInMonth}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {cashFlowVelocity.daysRemaining} days remaining
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Safe Daily Spend Cap Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Safe Daily Spend Limit
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Ceiling
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-900 dark:text-emerald-200">
                {formatPeso(cashFlowVelocity.safeDailyLimit)}
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 ml-1">/ araw</span>
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug">
                Hanggang dito lamang ang dapat mong gastusin bawat araw upang maabot ang iyong layuning mag-ipon.
              </p>
            </div>

            {/* Actual Daily Burn Pace Card */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              cashFlowVelocity.velocityStatus === 'ON_TRACK'
                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : cashFlowVelocity.velocityStatus === 'CAUTION'
                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Current Spending Pace
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cashFlowVelocity.velocityStatus === 'ON_TRACK' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  cashFlowVelocity.velocityStatus === 'CAUTION' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {cashFlowVelocity.velocityStatus === 'ON_TRACK' ? 'On Track' : cashFlowVelocity.velocityStatus === 'CAUTION' ? 'Warning' : 'Fast Burn'}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatPeso(cashFlowVelocity.dailyAverageBurn)}
                <span className="text-xs font-semibold text-slate-500 ml-1">/ araw</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {cashFlowVelocity.paceVarianceDaily > 0
                  ? `Lagpas ng ${formatPeso(cashFlowVelocity.paceVarianceDaily)}/araw kumpara sa iyong safe limit.`
                  : `Nasa ilalim ng safe cap ng ${formatPeso(Math.abs(cashFlowVelocity.paceVarianceDaily))}/araw.`}
              </p>
            </div>

            {/* Projected Month-End Cash Balance */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Projected Month-End Surplus
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Forecast</span>
              </div>
              <p className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                cashFlowVelocity.projectedSurplusOrDeficit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatPeso(cashFlowVelocity.projectedSurplusOrDeficit)}
              </p>
              <p className="text-[11px] text-slate-500 leading-snug">
                {cashFlowVelocity.projectedSurplusOrDeficit >= 0
                  ? 'Inaasahang matitirang malinis na sobrang pera matapos ang buwan.'
                  : 'Posibleng deficit kung mapapanatili ang kasalukuyang bilis ng paggastos.'}
              </p>
            </div>
          </div>

          {/* Advice Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Gabay sa Araw-araw na Gastusin: </strong>
              <span>{cashFlowVelocity.summaryAdvice}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. NEW FEATURE SECTION: Budget Stress & "Tagas sa Bulsa" (Expense Leakage Radar) */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'BUDGET_LEAKS') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Budget Stress & "Tagas sa Bulsa" (Micro-Expense Leakage Radar)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Detects over-budget caps and micro-spending leaks (food deliveries, milk tea, convenience store runs, flash sales) directly from your actual transactions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                {formatPeso(budgetLeaks.totalLeakAmount)}
              </span>
              <span className="text-[10px] text-slate-500">leaked this month</span>
            </div>
          </div>

          {/* Over-budget Warnings */}
          {budgetLeaks.overBudgetCategories.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Over-Budget Alert ({budgetLeaks.overBudgetCategories.length} Categories Exceeded Cap)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {budgetLeaks.overBudgetCategories.map((ob) => (
                  <div key={ob.category} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{ob.category}</p>
                    <p className="text-rose-600 dark:text-rose-400 font-mono font-semibold">
                      {formatPeso(ob.spent)} / {formatPeso(ob.limit)} (+{formatPeso(ob.overAmount)} over)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Micro-Spending Leaks Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Identified Micro-Spending Habits in Transactions
            </h3>

            {budgetLeaks.leaks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 text-center text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                <p className="font-bold">Walang natukoy na labis na tagas sa bulsa!</p>
                <p className="text-slate-500 dark:text-slate-400">Kontrolado ang mga micro-expenses at impulse orders sa iyong mga talaan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {budgetLeaks.leaks.map((leak) => (
                  <div
                    key={leak.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{leak.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{leak.monthlyFrequencyLabel}</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {formatPeso(leak.totalSpent)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Bawasan ng 25%:</span>
                        <strong className="font-mono text-emerald-600 dark:text-emerald-400">+{formatPeso(leak.potentialMonthlySaving25)} / mo</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Taunang maiipon:</span>
                        <strong className="font-mono text-slate-700 dark:text-slate-200">~{formatPeso(leak.potentialAnnualSaving25)} / yr</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MP2 & Digital Bank Wealth Growth Accelerator Note */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Potensyal na Kayamanan kung Ilalagak sa Pag-IBIG MP2 o Digital Bank:</span>
              </span>
              <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                Kung ang natipid na ~{formatPeso(budgetLeaks.annualLeakPotentialSavings)}/taon ay ilalagay sa 6% p.a. digital bank/MP2, aabot ito sa humigit-kumulang <strong>{formatPeso(budgetLeaks.annualLeakPotentialSavings * 5.6)}</strong> sa loob ng 5 taon!
              </p>
            </div>

            <button
              onClick={() => handleNav('savings')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Itabi sa Savings Goals
            </button>
          </div>
        </div>
      )}

      {/* 6. NEW FEATURE SECTION: Emergency Savings Ladder & Milestone Matrix */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'SAVINGS_LADDER') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Hagdan ng Ipon at Katatagan (Emergency Savings Ladder)</span>
              </h2>
              <p className="text-xs text-slate-500">
                The four gold-standard financial safety stages for Philippine households, calibrated to your real liquid funds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Kasalukuyang Antas:</span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {savingsLadder.currentLevelLabel}
              </span>
            </div>
          </div>

          {/* 4 Milestones Ladder Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {savingsLadder.milestones.map((m) => (
              <div
                key={m.level}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  m.isUnlocked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      m.isUnlocked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      Antas {m.level}
                    </span>

                    {m.isUnlocked && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Nakamit Na</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">{m.filipinoTitle}</h3>
                  <p className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                    {formatPeso(m.targetAmount)}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{m.description}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Katuparan:</span>
                    <span className="font-bold">{m.progressPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${m.isUnlocked ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, m.progressPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next milestone guidance */}
          {savingsLadder.gapToNextMilestone > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  Susunod na Layunin: {savingsLadder.nextMilestoneTitle} ({formatPeso(savingsLadder.nextMilestoneTarget)})
                </span>
                <p className="text-slate-500 text-[11px]">
                  Kailangan pa ng <strong>{formatPeso(savingsLadder.gapToNextMilestone)}</strong> upang ma-unlock. Sa kasalukuyang bilis ng pag-iipon, makakamit ito sa loob ng humigit-kumulang <strong>{savingsLadder.monthsToNextMilestone} buwan</strong>.
                </p>
              </div>

              <button
                onClick={() => handleNav('savings')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Magdeposito sa Savings
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. FEATURE SECTION: 50/30/20 Philippine Budget Breakdown Audit */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'BUDGET_50_30_20') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                <span>50 / 30 / 20 Philippine Budget Breakdown Audit</span>
              </h2>
              <p className="text-xs text-slate-500">
                Measures actual spending versus the standard gold-standard allocation for Philippine household stability.
              </p>
            </div>

            <button
              onClick={() => handleNav('budgets')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Manage Budget Caps</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Comparative Distribution Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Your Actual Spending Allocation:
              </span>
              <span className="font-mono text-slate-500">
                Base Income / Cashflow: <strong>{formatPeso(budget503020.totalIncome)}</strong>
              </span>
            </div>

            {/* Stacked Bar */}
            <div className="h-6 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex border border-slate-200/80 dark:border-slate-700">
              <div
                style={{ width: `${Math.min(100, budget503020.needsPercentage)}%` }}
                className="bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center transition-all truncate px-1"
                title={`Needs: ${budget503020.needsPercentage}%`}
              >
                Needs {budget503020.needsPercentage}%
              </div>
              <div
                style={{ width: `${Math.min(100 - budget503020.needsPercentage, budget503020.wantsPercentage)}%` }}
                className="bg-amber-500 text-slate-900 text-[10px] font-bold flex items-center justify-center transition-all truncate px-1"
                title={`Wants: ${budget503020.wantsPercentage}%`}
              >
                Wants {budget503020.wantsPercentage}%
              </div>
              <div
                style={{ width: `${Math.max(0, 100 - budget503020.needsPercentage - budget503020.wantsPercentage)}%` }}
                className="bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center transition-all truncate px-1"
                title={`Savings: ${budget503020.savingsPercentage}%`}
              >
                Savings {budget503020.savingsPercentage}%
              </div>
            </div>

            {/* Target Baseline Reference */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 gap-2">
              <span>Standard Guideline Reference:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                  <strong>50%</strong> Needs
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <strong>30%</strong> Wants
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <strong>20%</strong> Savings
                </span>
              </div>
            </div>
          </div>

          {/* 3 Comparison Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 dark:text-sky-300">Needs (Pangangailangan)</span>
                <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400">Target: 50%</span>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(budget503020.needsAmount)}
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p>Actual Share: <strong className="font-mono text-slate-800 dark:text-slate-200">{budget503020.needsPercentage}%</strong></p>
                <p className="text-[10px] text-slate-500">Rent, groceries, Meralco, commute & essentials</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Wants (Kagustuhan)</span>
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">Target: 30%</span>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(budget503020.wantsAmount)}
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p>Actual Share: <strong className="font-mono text-slate-800 dark:text-slate-200">{budget503020.wantsPercentage}%</strong></p>
                <p className="text-[10px] text-slate-500">Dining out, coffee, shopping & leisure</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Savings (Ipon & Hulugan)</span>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">Target: 20%</span>
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(budget503020.savingsAmount)}
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p>Actual Share: <strong className="font-mono text-slate-800 dark:text-slate-200">{budget503020.savingsPercentage}%</strong></p>
                <p className="text-[10px] text-slate-500">Emergency fund & goals accumulation</p>
              </div>
            </div>
          </div>

          {/* Actionable Guideline Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Audit Recommendation: </strong>
              <span>{budget503020.summaryAdvice}</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. FEATURE SECTION: Interactive Emergency Runway & Survival Stress-Tester */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'RUNWAY_SIMULATOR') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Emergency Runway & Income Loss Stress-Tester</span>
              </h2>
              <p className="text-xs text-slate-500">
                Simulates how long your household can survive if income stops today, based on current liquid balances.
              </p>
            </div>

            {/* Toggle Mode: Normal vs. Tipid Survival Mode */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsTipidSurvivalMode(false)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !isTipidSurvivalMode
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Normal Living Mode
              </button>
              <button
                type="button"
                onClick={() => setIsTipidSurvivalMode(true)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isTipidSurvivalMode
                    ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tipid Survival Mode</span>
              </button>
            </div>
          </div>

          {/* Runway Result Hero Box */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isTipidSurvivalMode
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isTipidSurvivalMode ? 'Bare-Bones Survival Runway (Needs & Essentials Only)' : 'Standard Living Runway (Current Spend Habits)'}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {isTipidSurvivalMode ? runwayScenario.bareBonesRunwayMonths : runwayScenario.normalRunwayMonths}
                  </h3>
                  <span className="text-base font-bold text-slate-500">Months</span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({isTipidSurvivalMode ? runwayScenario.bareBonesRunwayDays : runwayScenario.normalRunwayDays} Days)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your stored liquid cash of <strong className="font-mono text-slate-900 dark:text-white">{formatPeso(runwayScenario.totalLiquidFunds)}</strong> will sustain you until approximately:
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isTipidSurvivalMode ? runwayScenario.bareBonesSurvivalDateStr : runwayScenario.normalSurvivalDateStr}</span>
                </div>
              </div>

              {/* Monthly Burn Rate Display */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-right shrink-0 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Simulated Monthly Burn
                </span>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {formatPeso(isTipidSurvivalMode ? runwayScenario.monthlyEssentialExpenses : runwayScenario.monthlyTotalExpenses)} / mo
                </p>
                <p className="text-[10px] text-slate-500">
                  {isTipidSurvivalMode ? 'Discretionary wants cut to ₱0' : 'Including dining & shopping wants'}
                </p>
              </div>
            </div>

            {/* Target Buffer Progress Indicator */}
            <div className="pt-4 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Recommended Safety Buffer (3–6 months):</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Target: {formatPeso((isTipidSurvivalMode ? runwayScenario.monthlyEssentialExpenses : runwayScenario.monthlyTotalExpenses) * 3)} (3 mos)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (isTipidSurvivalMode ? runwayScenario.bareBonesRunwayMonths : runwayScenario.normalRunwayMonths) >= 3
                      ? 'bg-emerald-600'
                      : (isTipidSurvivalMode ? runwayScenario.bareBonesRunwayMonths : runwayScenario.normalRunwayMonths) >= 1
                      ? 'bg-amber-500'
                      : 'bg-rose-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (((isTipidSurvivalMode ? runwayScenario.bareBonesRunwayMonths : runwayScenario.normalRunwayMonths) / 3) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. FEATURE SECTION: Debt Freedom & Payoff Accelerator */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'DEBT_PAYOFF') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span>Debt Freedom & Installment Payoff Accelerator</span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualizes your timeline to zero debt and simulates how micro extra payments accelerate debt freedom.
              </p>
            </div>

            <button
              onClick={() => handleNav('bills')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>View Active Installments & Bills</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalLiabilities <= 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Congratulations! You Are 100% Debt-Free!
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 max-w-md mx-auto">
                You have no active consumer loans or BNPL installment amortizations. Keep building wealth through investments and high-yield savings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Outstanding Debt</span>
                  <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400">
                    {formatPeso(debtPayoff.totalLiability)}
                  </p>
                  <p className="text-[10px] text-slate-500">Installments + Personal Loans</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Monthly Outflow</span>
                  <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {formatPeso(debtPayoff.monthlyObligation)} / mo
                  </p>
                  <p className="text-[10px] text-slate-500">Committed monthly amortizations</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Standard Debt-Free Horizon</span>
                  <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {debtPayoff.monthsToDebtFreeStandard} Months
                  </p>
                  <p className="text-[10px] text-slate-500">At standard payment schedule</p>
                </div>
              </div>

              {/* Accelerated Payoff Simulator Bar */}
              <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Acceleration Simulator: Add Extra Monthly Payment</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {[500, 1000, 2000, 3000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setExtraMonthlyDebtPayment(amt)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          extraMonthlyDebtPayment === amt
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        +{formatPeso(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">New Accelerated Horizon</span>
                    <span className="text-base font-extrabold font-mono text-purple-900 dark:text-purple-300">
                      {debtPayoff.monthsToDebtFreeAccelerated} Months
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold ml-2">
                      ({debtPayoff.monthsSaved} months faster!)
                    </span>
                  </div>

                  {debtPayoff.interestSavedEst > 0 && (
                    <div className="sm:text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimated Financing Fees Saved</span>
                      <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                        ~{formatPeso(debtPayoff.interestSavedEst)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 10. FEATURE SECTION: Net Worth & Solvency Tracker */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'NET_WORTH') && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Net Liquid Solvency & Asset Allocation</span>
              </h2>
              <p className="text-xs text-slate-500">
                Clear balance sheet of all accessible financial assets minus outstanding financing liabilities.
              </p>
            </div>

            <button
              onClick={() => handleNav('accounts')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Manage Accounts & Wallets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Liquid Assets</span>
              <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatPeso(netWorthSnapshot.totalAssets)}
              </p>
              <p className="text-[10px] text-slate-500">Bank accounts, e-wallets, cash & savings goals</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Liabilities</span>
              <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">
                {formatPeso(netWorthSnapshot.totalLiabilities)}
              </p>
              <p className="text-[10px] text-slate-500">Remaining installments & debts owed</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Net Liquid Worth</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(netWorthSnapshot.netWorth)}
              </p>
              <p className="text-[10px] text-slate-500">Debt-to-Asset Ratio: {netWorthSnapshot.debtToAssetRatio}%</p>
            </div>
          </div>
        </div>
      )}

      {/* 11. FEATURE SECTION: The 6 Diagnostic Pillar Rule Cards */}
      {(activeSubTab === 'OVERVIEW' || activeSubTab === 'CHECKPOINTS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>6 Core Diagnostic Pillar Rules</span>
            </h2>
            <span className="text-xs text-slate-500">
              {healthResults.filter((r) => r.status === 'HEALTHY').length} of {healthResults.length} Checkpoints Passing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthResults.map((result) => {
              const isHealthy = result.status === 'HEALTHY';
              const isWarning = result.status === 'WARNING';

              return (
                <div
                  key={result.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 shadow-xs ${
                    isHealthy
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : isWarning
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isHealthy
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                            : isWarning
                            ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isHealthy ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {result.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {result.message}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">{result.metricLabel}</span>
                      <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{result.metricValue}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      Diagnostic Details:
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {result.details}
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white">Recommendation: </strong>
                      <span>{result.recommendation}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 12. Actionable Quick Launcher Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Ready to Take Action on Your Diagnostics?
          </h3>
          <p className="text-xs text-slate-500">
            Apply recommendations directly by planning your next payday or setting category caps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-center">
          {onOpenPaydayWizard && (
            <button
              onClick={onOpenPaydayWizard}
              className="py-2 px-3.5 text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Payday Budgeter</span>
            </button>
          )}

          <button
            onClick={() => handleNav('budgets')}
            className="py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Budget Cycles</span>
          </button>

          <button
            onClick={() => handleNav('savings')}
            className="py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Savings & Debts</span>
          </button>

          {onOpenNewTransaction && (
            <button
              onClick={onOpenNewTransaction}
              className="py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

// Helper SVG Icon for Pie Chart
function PieChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
