import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Calendar, CreditCard, Sparkles, AlertCircle, ArrowUpRight, ShieldCheck, Plus, Landmark, DollarSign, RotateCcw, Flame, PieChart } from 'lucide-react';
import { Transaction, RecurringBill, Installment, SavingsGoal, BudgetLimit, FinancialAccount, BudgetCycle } from '../types';
import { formatPeso } from '../utils/formatters';
import { calculateNetBalance, calculateCategoryBreakdown } from '../utils/financialCalculations';
import { CategoryPieChart } from './CategoryPieChart';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: FinancialAccount[];
  bills: RecurringBill[];
  installments: Installment[];
  savingsGoals: SavingsGoal[];
  budgets: BudgetLimit[];
  budgetCycles?: BudgetCycle[];
  onOpenNewTransaction: () => void;
  onOpenPaydayWizard: () => void;
  onOpenSpendingInsights?: () => void;
  onOpenExpenseHeatmap?: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenResetConfirmation?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  bills,
  installments,
  savingsGoals,
  budgets,
  budgetCycles = [],
  onOpenNewTransaction,
  onOpenPaydayWizard,
  onOpenSpendingInsights,
  onOpenExpenseHeatmap,
  onNavigateTab,
  onOpenResetConfirmation,
}) => {
  const net = calculateNetBalance(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);

  // Current month key (YYYY-MM)
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  }, []);

  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  });

  // Collect available expense months from transaction records
  const availableExpenseMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions, currentMonthKey]);

  // Expenses for the selected month
  const monthExpenseTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'EXPENSE' && t.date && t.date.startsWith(selectedExpenseMonth)
    );
  }, [transactions, selectedExpenseMonth]);

  const monthCategoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(monthExpenseTransactions);
  }, [monthExpenseTransactions]);

  const monthTotalExpense = useMemo(() => {
    return monthExpenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [monthExpenseTransactions]);

  // Liquid Balance from Bank, E-Wallets & Cash
  const totalLiquidAccountBalance = accounts
    .filter(a => a.type !== 'BNPL' && a.type !== 'CREDIT_CARD')
    .reduce((acc, a) => acc + a.balance, 0);

  // Upcoming unpaid bills
  const unpaidBills = bills.filter(b => !b.isPaidThisMonth);

  // Active installments
  const activeInstallmentsCount = installments.length;
  const totalMonthlyInstallmentPayment = installments.reduce((acc, i) => acc + i.monthlyPayment, 0);

  // Total savings accumulated
  const totalSavings = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Hero & Quick Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6 w-full max-w-full overflow-hidden">
        <div className="space-y-1 min-w-0 max-w-xl flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 inline-block">
            Filipino Household Financial Overview
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
            Mabuhay! Here's your financial status.
          </h1>
          <p className="text-xs text-emerald-100/90 line-clamp-2 sm:line-clamp-none max-w-lg">
            Track income allocations (RCBC, GCash, Maya, Cash), expenses, payday budgets, recurring bills, and PayLater installments with ease.
          </p>
        </div>

        {/* Action Buttons in Compact 2x2 / 3x2 Grid System */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={onOpenPaydayWizard}
            className="py-2 px-3 text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Payday Budgeter</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="py-2 px-3 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Add Record</span>
          </button>

          {onOpenSpendingInsights && (
            <button
              onClick={onOpenSpendingInsights}
              className="py-2 px-3 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Automated rule-based spending insights"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="truncate">Insights</span>
            </button>
          )}

          {onOpenExpenseHeatmap && (
            <button
              onClick={onOpenExpenseHeatmap}
              className="py-2 px-3 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Daily spending calendar heatmap"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">Heatmap</span>
            </button>
          )}

          {onOpenResetConfirmation && (
            <button
              onClick={onOpenResetConfirmation}
              className="py-2 px-3 text-xs font-semibold text-rose-100 hover:text-white bg-rose-900/40 hover:bg-rose-900/70 border border-rose-400/30 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1"
              title="Reset records to zero for fresh start"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate">Reset Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Net Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stored Liquid Balance Across Accounts */}
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Stored Funds</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {formatPeso(totalLiquidAccountBalance)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Across Banks, E-Wallets & Cash Wallets
            </p>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {formatPeso(net.totalIncome)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Salary, Freelance, Remittances
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
              {formatPeso(net.totalExpenses)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Bills, Food, Rent, Transport
            </p>
          </div>
        </div>

        {/* Total Savings Reserve */}
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Savings Reserve</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400">
              {formatPeso(totalSavings)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Emergency & Goal Accumulation
            </p>
          </div>
        </div>

      </div>

      {/* SECTION: Money Storage Containers / Accounts Row */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Where Your Money Is Stored</span>
            </h3>
            <p className="text-xs text-slate-500">
              Allocated cash balances & available credit lines across your accounts (RCBC, GCash, Maya, Cash, Atome)
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('accounts')}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Manage Accounts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {accounts.map((acc) => {
            const isCredit = acc.type === 'CREDIT_CARD' || acc.type === 'BNPL';
            const displayVal = isCredit
              ? Math.max(0, (acc.creditLimit || 0) - acc.balance)
              : acc.balance;

            return (
              <div
                key={acc.id}
                onClick={() => onNavigateTab('accounts')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 hover:border-emerald-400 transition-all cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                  {acc.name}
                </span>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
                  {formatPeso(displayVal)}
                </p>
                <p className="text-[9px] text-slate-400 capitalize truncate">
                  {isCredit ? 'Avail. Credit' : acc.type.replace('_', ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Tracking Chart & Category Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Budget Overview Chart Card */}
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Budget Health</span>
            </h3>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Budgets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {budgets.length === 0 && budgetCycles.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-slate-500">
                No active budget cycles configured yet.
              </p>
              <button
                onClick={() => onNavigateTab('budgets')}
                className="py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Set Budget Cycles</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Budget Progress */}
              {(() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
                const curMonthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

                // Find active cycle covering today, or fallback to first
                const activeCycle = budgetCycles.find(c => c.startDate <= todayStr && c.endDate >= todayStr) || budgetCycles[0] || null;

                // Target budget items
                const cycleBudgets = activeCycle
                  ? budgets.filter(b => b.cycleId === activeCycle.id || (!b.cycleId && b.month && activeCycle.startDate.startsWith(b.month)))
                  : budgets.filter(b => b.period === 'MONTHLY' && (!b.month || b.month === curMonthKey));

                const totalLimit = cycleBudgets.reduce((acc, b) => acc + b.limitAmount, 0);

                // Spending within window
                const spentMap = new Map<string, number>();
                transactions.forEach(t => {
                  if (t.type !== 'EXPENSE') return;
                  if (activeCycle) {
                    if (t.date >= activeCycle.startDate && t.date <= activeCycle.endDate) {
                      spentMap.set(t.category, (spentMap.get(t.category) || 0) + t.amount);
                    }
                  } else if (t.date.startsWith(curMonthKey)) {
                    spentMap.set(t.category, (spentMap.get(t.category) || 0) + t.amount);
                  }
                });

                const totalSpent = cycleBudgets.reduce((acc, b) => acc + (spentMap.get(b.categoryName) || 0), 0);
                const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
                const isOver = totalSpent > totalLimit;

                // Days calculation
                let daysRemaining = 0;
                if (activeCycle) {
                  const end = new Date(activeCycle.endDate);
                  const today = new Date(todayStr);
                  const msPerDay = 1000 * 60 * 60 * 24;
                  daysRemaining = Math.max(0, Math.round((end.getTime() - today.getTime()) / msPerDay) + 1);
                } else {
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  daysRemaining = Math.max(0, lastDay - now.getDate() + 1);
                }

                const safeDaily = daysRemaining > 0 && totalLimit > totalSpent ? (totalLimit - totalSpent) / daysRemaining : 0;

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]">
                          {activeCycle ? activeCycle.name : 'Total Month Budget'}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatPeso(totalSpent)} / {formatPeso(totalLimit)}
                        </span>
                      </div>

                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-rose-600' : overallPct >= 85 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(100, overallPct)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`font-semibold ${isOver ? 'text-rose-600' : 'text-slate-500'}`}>
                          {overallPct}% consumed
                        </span>
                        <span className="text-slate-400 font-mono">
                          {totalLimit >= totalSpent ? `${formatPeso(totalLimit - totalSpent)} left` : `+${formatPeso(totalSpent - totalLimit)} over`}
                        </span>
                      </div>
                    </div>

                    {/* Daily Safe Spending & Cutoff Days Mini Alert */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Safe Daily Budget</span>
                        <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          {formatPeso(safeDaily)} / day
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Next Cutoff / End</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {daysRemaining} days left
                        </span>
                      </div>
                    </div>

                    {/* Top Active Budget Bars */}
                    <div className="space-y-2.5 pt-1">
                      {cycleBudgets.slice(0, 3).map(b => {
                        const catSpent = spentMap.get(b.categoryName) || 0;
                        const pct = b.limitAmount > 0 ? Math.round((catSpent / b.limitAmount) * 100) : 0;
                        const catOver = catSpent > b.limitAmount;

                        return (
                          <div key={b.id} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                {b.categoryName}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                {formatPeso(catSpent)} / {formatPeso(b.limitAmount)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${catOver ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Category Expense Breakdown & Circle Pie Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Spending by Category</span>
              </h3>
              <p className="text-xs text-slate-500">
                Visual circular breakdown of expenditure for the active month
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Transactions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CategoryPieChart
            categories={monthCategoryBreakdown}
            totalExpense={monthTotalExpense}
            selectedMonth={selectedExpenseMonth}
            availableMonths={availableExpenseMonths}
            onSelectMonth={setSelectedExpenseMonth}
            onOpenNewTransaction={onOpenNewTransaction}
          />
        </div>

        {/* Side Alert Widget: Upcoming Bills & Installments */}
        <div className="space-y-4">
          
          {/* Unpaid Bills Box */}
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Upcoming Due Bills ({unpaidBills.length})</span>
              </span>
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            {unpaidBills.length === 0 ? (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>All monthly bills marked as paid!</span>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {unpaidBills.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{bill.title}</p>
                      <p className="text-[10px] text-slate-500">Due on day {bill.dueDateDay} of month</p>
                    </div>
                    <span className="font-mono font-bold text-amber-900 dark:text-amber-300">
                      {formatPeso(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Installment Summary Box */}
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>Installments & PayLater</span>
              </span>
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                View
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{activeInstallmentsCount} Active Items</p>
                <p className="text-[10px] text-slate-500">Monthly Commitment</p>
              </div>
              <span className="font-mono font-bold text-purple-900 dark:text-purple-300">
                {formatPeso(totalMonthlyInstallmentPayment)} / mo
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
