import React, { useState } from 'react';
import {
  FileDown,
  Printer,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Wallet,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Transaction,
  BudgetLimit,
  RecurringBill,
  Installment,
  DebtLoan,
  FinancialAccount,
} from '../types';
import { formatPeso, formatDate } from '../utils/formatters';
import { calculateNetBalance, calculateCategoryBreakdown } from '../utils/financialCalculations';
import { exportFinancialReportPDF } from '../utils/pdfReportService';

export interface PDFReportGeneratorProps {
  userName: string;
  transactions: Transaction[];
  budgets: BudgetLimit[];
  bills: RecurringBill[];
  installments: Installment[];
  debts: DebtLoan[];
  accounts?: FinancialAccount[];
}

export const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({
  userName,
  transactions,
  budgets,
  bills,
  installments,
  debts,
  accounts = [],
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'current_month' | 'last_30_days' | 'all'>('all');

  // Filter transactions based on selected period
  const filteredTransactions = React.useMemo(() => {
    const now = new Date();
    if (periodFilter === 'current_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      return transactions.filter((t) => t.date && t.date.startsWith(prefix));
    }
    if (periodFilter === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return transactions.filter((t) => new Date(t.date) >= thirtyDaysAgo);
    }
    return transactions;
  }, [transactions, periodFilter]);

  const periodLabel = React.useMemo(() => {
    if (periodFilter === 'current_month') {
      const date = new Date();
      return `${date.toLocaleString('default', { month: 'long', year: 'numeric' })} Statement`;
    }
    if (periodFilter === 'last_30_days') {
      return 'Last 30 Days Statement';
    }
    return 'All-Time Financial Statement';
  }, [periodFilter]);

  const net = calculateNetBalance(filteredTransactions);
  const categoryBreakdown = calculateCategoryBreakdown(filteredTransactions);
  const totalBills = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalInstallments = installments.reduce((acc, i) => acc + (i.monthlyPayment || 0), 0);
  const totalAccounts = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setDownloadSuccess(null);

    try {
      // Export via robust vector jsPDF generator and Blob anchor download
      const filename = exportFinancialReportPDF({
        userName,
        transactions: filteredTransactions,
        budgets,
        bills,
        installments,
        debts,
        accounts,
        periodLabel,
      });

      setDownloadSuccess(filename);
      setTimeout(() => {
        setDownloadSuccess(null);
      }, 6000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setErrorMessage(
        err?.message || 'Failed to generate PDF statement. Please try again or check browser settings.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Header Card */}
      <div className="p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Receipt className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Financial Summary Statement
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Generate and download a clean, high-resolution vector PDF statement for your household files or loan documentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print preview directly"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Print Preview</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              type="button"
              className="py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Statement Period Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Statement Scope:</span>
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  periodFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Records ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('current_month')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  periodFilter === 'current_month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('last_30_days')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  periodFilter === 'last_30_days'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {filteredTransactions.length} records in current scope
          </div>
        </div>

        {/* Success Alert */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>PDF Downloaded:</strong> File <code>{downloadSuccess}</code> has been exported successfully to your downloads folder!
              </span>
            </div>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Printable Report Preview Canvas */}
      <div
        id="iponta-pdf-report-content"
        className="p-8 bg-white text-slate-900 rounded-3xl border border-slate-200 space-y-6 max-w-3xl mx-auto text-xs shadow-sm font-sans"
      >
        {/* Report Title Lockup */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-emerald-900 tracking-tight">IponTa</h1>
            <p className="text-[11px] text-emerald-700 font-semibold">Tara, Ipon Ta!</p>
            <p className="text-[10px] text-slate-500 font-medium">Personal & Household Financial Statement</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Financial Summary Statement</p>
            <p className="text-[11px] text-slate-500">Account: {userName || 'Pinoy User'}</p>
            <p className="text-[11px] text-slate-500">Date: {formatDate(new Date().toISOString())}</p>
            <p className="text-[10px] font-mono text-emerald-700 font-semibold">{periodLabel}</p>
          </div>
        </div>

        {/* Financial Disclaimer Header */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-snug">
          <strong>Notice:</strong> This statement is generated solely for personal tracking and organizational purposes by IponTa. IponTa is not a bank, transaction gateway, or financial institution.
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Income</p>
            <p className="text-base font-bold font-mono text-emerald-700">{formatPeso(net.totalIncome)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              {filteredTransactions.filter((t) => t.type === 'INCOME').length} income records
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Expenses</p>
            <p className="text-base font-bold font-mono text-rose-700">{formatPeso(net.totalExpenses)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              {filteredTransactions.filter((t) => t.type === 'EXPENSE').length} expense records
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Net Balance</p>
            <p
              className={`text-base font-bold font-mono ${
                net.netBalance >= 0 ? 'text-slate-900' : 'text-rose-700'
              }`}
            >
              {formatPeso(net.netBalance)}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              {net.totalIncome > 0
                ? `${((net.netBalance / net.totalIncome) * 100).toFixed(1)}% savings rate`
                : 'Cash flow balance'}
            </p>
          </div>
        </div>

        {/* Financial Accounts & Balances (if accounts present) */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Financial Accounts & Balances ({accounts.length})</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-slate-700">
                Total Liquid: {formatPeso(totalAccounts)}
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-1.5">Account Name</th>
                  <th className="py-1.5">Type</th>
                  <th className="py-1.5">Account / Ref Number</th>
                  <th className="py-1.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="py-1.5 font-medium">{acc.name}</td>
                    <td className="py-1.5 text-slate-500">{acc.type}</td>
                    <td className="py-1.5 text-slate-500 font-mono">{acc.accountNumberMasked || '—'}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                      {formatPeso(acc.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Category Expenses Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Top Expense Category Breakdown</span>
          </h4>
          {categoryBreakdown.length === 0 ? (
            <p className="text-slate-400 text-center py-3 bg-slate-50 rounded-xl">
              No expense records recorded in this statement scope.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2">Category</th>
                  <th className="py-2">Transactions</th>
                  <th className="py-2 text-right">Share (%)</th>
                  <th className="py-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.slice(0, 8).map((c) => (
                  <tr key={c.category}>
                    <td className="py-2 font-medium">{c.category}</td>
                    <td className="py-2 text-slate-500">{c.count} items</td>
                    <td className="py-2 text-right font-mono">{c.percentage.toFixed(1)}%</td>
                    <td className="py-2 text-right font-mono font-bold text-slate-900">
                      {formatPeso(c.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bills & Commitments Summary */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Recurring Bills & Active Obligations
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Recurring Monthly Bills ({bills.length}):</span>
              <p className="font-bold font-mono text-slate-900 mt-0.5">
                {formatPeso(totalBills)} / month
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {bills.filter((b) => b.isPaidThisMonth).length} marked as paid this cycle
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Active Installments ({installments.length}):</span>
              <p className="font-bold font-mono text-slate-900 mt-0.5">
                {formatPeso(totalInstallments)} / month
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {installments.length > 0 ? `${installments.length} ongoing amortization plans` : 'No active plans'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Transactions Preview (first 10) */}
        {filteredTransactions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Transaction Records
              </h4>
              <span className="text-[10px] text-slate-400">
                Showing top 10 of {filteredTransactions.length} records (full list included in PDF download)
              </span>
            </div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-1.5">Date</th>
                  <th className="py-1.5">Description</th>
                  <th className="py-1.5">Category</th>
                  <th className="py-1.5">Method</th>
                  <th className="py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td className="py-1.5 text-slate-500">{t.date}</td>
                    <td className="py-1.5 font-medium">{t.description || t.category}</td>
                    <td className="py-1.5 text-slate-500">{t.category}</td>
                    <td className="py-1.5 text-slate-500">{t.paymentMethod}</td>
                    <td
                      className={`py-1.5 text-right font-mono font-bold ${
                        t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {t.type === 'INCOME' ? '+' : '-'}
                      {formatPeso(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
          <span>IponTa Financial Organizer · Tara, Ipon Ta! · Exportable Document</span>
          <span>Official Statement Preview</span>
        </div>
      </div>
    </div>
  );
};
