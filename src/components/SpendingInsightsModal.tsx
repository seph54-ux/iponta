import React, { useState, useMemo } from 'react';
import { 
  X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Info, Calendar, ArrowUpRight, ArrowDownRight, Sparkles, 
  BarChart3, ChevronRight, Layers, DollarSign 
} from 'lucide-react';
import { Transaction, BudgetLimit } from '../types';
import { formatPeso } from '../utils/formatters';
import { 
  generateSpendingInsights, 
  AnalysisPeriod, 
  SpendingInsight 
} from '../utils/spendingInsights';

interface SpendingInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: BudgetLimit[];
}

export const SpendingInsightsModal: React.FC<SpendingInsightsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budgets,
}) => {
  const [period, setPeriod] = useState<AnalysisPeriod>('MONTHLY');
  const [showAll, setShowAll] = useState(false);

  // Available unique periods from existing transaction dates
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');

    if (period === 'MONTHLY') {
      set.add(`${curYear}-${curMonth}`);
      transactions.forEach(t => {
        if (t.date && t.date.length >= 7) set.add(t.date.substring(0, 7));
      });
      return Array.from(set).sort().reverse();
    } else if (period === 'QUARTERLY') {
      const curQ = Math.ceil((now.getMonth() + 1) / 3);
      set.add(`${curYear}-Q${curQ}`);
      transactions.forEach(t => {
        if (t.date && t.date.length >= 7) {
          const y = t.date.substring(0, 4);
          const m = parseInt(t.date.substring(5, 7), 10);
          set.add(`${y}-Q${Math.ceil(m / 3)}`);
        }
      });
      return Array.from(set).sort().reverse();
    } else {
      set.add(`${curYear}`);
      transactions.forEach(t => {
        if (t.date && t.date.length >= 4) set.add(t.date.substring(0, 4));
      });
      return Array.from(set).sort().reverse();
    }
  }, [transactions, period]);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');

  // Sync selected period key if period mode switches
  const activeKey = selectedPeriodKey && availablePeriods.includes(selectedPeriodKey)
    ? selectedPeriodKey
    : availablePeriods[0] || '';

  // Generate deterministic rule-based insights
  const { insights, summary, previousSummary } = useMemo(() => {
    return generateSpendingInsights(transactions, budgets, period, activeKey);
  }, [transactions, budgets, period, activeKey]);

  if (!isOpen) return null;

  // Format readable label for the period
  const formatPeriodHeader = (key: string) => {
    if (!key) return 'Current Period';
    if (period === 'MONTHLY') {
      const [y, m] = key.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (period === 'QUARTERLY') {
      const [y, q] = key.split('-');
      return `${q} ${y} (Quarterly)`;
    }
    return `Full Year ${key}`;
  };

  const displayedInsights = showAll ? insights : insights.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Automated Spending Insights
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Rule-Based Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data-driven spending patterns, budget anomalies, and category trend analysis without AI assumptions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Period Mode Toggle (Monthly / Quarterly / Yearly) */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-xs font-semibold">
            {(['MONTHLY', 'QUARTERLY', 'YEARLY'] as AnalysisPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setSelectedPeriodKey('');
                }}
                className={`py-1.5 px-3 rounded-lg capitalize transition-all ${
                  period === p
                    ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Timeline:
            </span>
            <select
              value={activeKey}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {availablePeriods.map((key) => (
                <option key={key} value={key}>
                  {formatPeriodHeader(key)}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          
          {/* Period Metric Summary Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Expenses
              </span>
              <p className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(summary.totalExpense)}
              </p>
              {previousSummary && previousSummary.totalExpense > 0 && (
                <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  {summary.totalExpense < previousSummary.totalExpense ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-bold">
                      <ArrowDownRight className="w-3 h-3" />
                      {Math.round(((previousSummary.totalExpense - summary.totalExpense) / previousSummary.totalExpense) * 100)}% drop
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center font-bold">
                      <ArrowUpRight className="w-3 h-3" />
                      {Math.round(((summary.totalExpense - previousSummary.totalExpense) / previousSummary.totalExpense) * 100)}% rise
                    </span>
                  )}
                  <span>vs prior</span>
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Income
              </span>
              <p className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatPeso(summary.totalIncome)}
              </p>
              <p className="text-[10px] text-slate-500">
                {summary.transactionCount} total records
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Net Savings
              </span>
              <p className={`text-base sm:text-lg font-bold font-mono ${
                summary.netSavings >= 0 ? 'text-sky-700 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatPeso(summary.netSavings)}
              </p>
              <p className="text-[10px] text-slate-500">
                Savings rate: <strong className="text-slate-800 dark:text-slate-200">{summary.savingsRate}%</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Top Spending
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {summary.topCategory ? summary.topCategory.name : 'None'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {summary.topCategory ? `${formatPeso(summary.topCategory.amount)} (${summary.topCategory.percentage}%)` : 'No expenses'}
              </p>
            </div>

          </div>

          {/* Section: Top Automated Insights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Generated Observations for {formatPeriodHeader(activeKey)}</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Showing {displayedInsights.length} of {insights.length} insights
              </span>
            </div>

            {/* Insight Cards */}
            <div className="space-y-2.5">
              {displayedInsights.map((insight) => {
                const isPositive = insight.type === 'POSITIVE';
                const isWarning = insight.type === 'WARNING';
                const isHighSeverity = insight.severity === 'HIGH';

                // Styles based on positive (green) vs warnings (yellow/red)
                let borderBgClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]';
                let iconColorClass = 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950';

                if (isPositive) {
                  borderBgClass = 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/30';
                  iconColorClass = 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50';
                } else if (isWarning) {
                  if (isHighSeverity) {
                    borderBgClass = 'border-rose-200 dark:border-rose-800/70 bg-rose-50/50 dark:bg-rose-950/30';
                    iconColorClass = 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50';
                  } else {
                    borderBgClass = 'border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/30';
                    iconColorClass = 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50';
                  }
                }

                return (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-2xl border transition-all ${borderBgClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconColorClass}`}>
                        {isPositive ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {insight.title}
                          </h4>
                          {insight.trend && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                              insight.trend === 'UP'
                                ? isPositive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
                                : isPositive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {insight.trend === 'UP' ? '↑' : '↓'} Trend
                            </span>
                          )}
                          {insight.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              {insight.category}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {insight.message}
                        </p>
                      </div>
                    </div>

                    {insight.metricValue && (
                      <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          {insight.metricLabel || 'Indicator'}
                        </span>
                        <span className={`font-mono font-bold text-xs ${
                          isPositive
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isWarning
                            ? isHighSeverity ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {insight.metricValue}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Toggle show all insights if > 5 */}
            {insights.length > 5 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors inline-flex items-center gap-1"
                >
                  <span>{showAll ? 'Show Top 5 Only' : `View All (${insights.length}) Observations`}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Insights recalculate in real-time on every transaction modification.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
