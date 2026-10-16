import React, { useState } from 'react';
import { Users, UserCheck, Shield, Plus, DollarSign, ArrowRightLeft, Lock, Edit2, Check } from 'lucide-react';
import { Transaction, HouseholdMember } from '../types';
import { formatPeso } from '../utils/formatters';
import { calculateHouseholdShares } from '../utils/financialCalculations';

interface HouseholdBudgetViewProps {
  transactions: Transaction[];
  members: HouseholdMember[];
  onSaveMembers: (members: HouseholdMember[]) => void;
  onAddSharedExpense: () => void;
}

export const HouseholdBudgetView: React.FC<HouseholdBudgetViewProps> = ({
  transactions,
  members,
  onSaveMembers,
  onAddSharedExpense,
}) => {
  const [partnerName, setPartnerName] = useState(members[1]?.name || 'Partner / Roommate');
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [splitRatio, setSplitRatio] = useState<number>(members[0]?.incomeContributionRatio || 0.5);

  const sharedTransactions = transactions.filter(t => t.isShared && t.type === 'EXPENSE');
  const shares = calculateHouseholdShares(sharedTransactions, splitRatio);

  const handleUpdatePartner = () => {
    const updated = [
      { ...members[0], incomeContributionRatio: splitRatio },
      { ...members[1], name: partnerName, incomeContributionRatio: 1 - splitRatio },
    ];
    onSaveMembers(updated);
    setIsEditingPartner(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Callout */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-bold">Shared Household Budgeting</h2>
          </div>
          <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
            Manage joint apartment rent, groceries, internet, and utilities with your partner or roommate. Personal non-shared transactions stay <strong className="text-emerald-200">100% private</strong>.
          </p>
        </div>

        <button
          onClick={onAddSharedExpense}
          className="py-2.5 px-4 text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Shared Expense</span>
        </button>
      </div>

      {/* Household Members & Fair Split Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Members & Split Controls */}
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Household Members
            </h3>
            <button
              onClick={() => setIsEditingPartner(!isEditingPartner)}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingPartner ? 'Done' : 'Edit'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                  You
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Primary Account</p>
                  <p className="text-[10px] text-slate-500">Share: {Math.round(splitRatio * 100)}%</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                You
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                  P2
                </div>
                <div>
                  {isEditingPartner ? (
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{partnerName}</p>
                  )}
                  <p className="text-[10px] text-slate-500">Share: {Math.round((1 - splitRatio) * 100)}%</p>
                </div>
              </div>

              {isEditingPartner && (
                <button
                  onClick={handleUpdatePartner}
                  className="p-1.5 rounded-lg bg-emerald-600 text-white"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Split Ratio: {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
            </label>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={splitRatio}
              onChange={(e) => setSplitRatio(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Shared Summary Cards */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Shared Household Expenses
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                {formatPeso(shares.totalSharedExpense)}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Includes apartment rent, Meralco electric bills, water, groceries, and internet.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Individual Expense Share Breakdown
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Your Share ({Math.round(splitRatio * 100)}%):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatPeso(shares.personAShare)}</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{partnerName}'s Share ({Math.round((1 - splitRatio) * 100)}%):</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{formatPeso(shares.personBShare)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Shared Transactions Table */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Shared Household Expenses Log ({sharedTransactions.length})
          </h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Private personal expenses are hidden</span>
          </span>
        </div>

        {sharedTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No shared expenses recorded yet. Click "Record Shared Expense" above to add rent or utilities!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3 text-right">Total Amount</th>
                  <th className="pb-3 text-right">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sharedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-3 text-slate-500 font-mono">{t.date}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{t.description}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{t.category}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{t.paymentMethod}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatPeso(t.amount)}</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPeso(t.amount * splitRatio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
