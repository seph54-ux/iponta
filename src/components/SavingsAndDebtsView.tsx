import React, { useState } from 'react';
import { PiggyBank, DollarSign, Plus, Trash2, ArrowRightLeft, CheckCircle2, HandCoins, Wallet, X, RotateCcw } from 'lucide-react';
import { SavingsGoal, DebtLoan, FinancialAccount } from '../types';
import { formatPeso } from '../utils/formatters';

interface SavingsAndDebtsViewProps {
  savingsGoals: SavingsGoal[];
  debts: DebtLoan[];
  accounts?: FinancialAccount[];
  onAddSavingsGoal: (goal: SavingsGoal) => void;
  onUpdateGoalAmount: (goalId: string, addedAmount: number) => void;
  onDeleteSavingsGoal: (goalId: string) => void;
  onDepositToGoalWithTransaction?: (goal: SavingsGoal, amount: number, fromAccount: string, notes?: string) => void;
  onAddDebt: (debt: DebtLoan) => void;
  onDeleteDebt: (debtId: string) => void;
  onPayDebtWithTransaction?: (debt: DebtLoan, paymentAmount: number, fromAccount: string, notes?: string) => void;
  onCollectDebtWithTransaction?: (debt: DebtLoan, collectedAmount: number, toAccount: string, notes?: string) => void;
  onReopenDebt?: (debt: DebtLoan) => void;
  userId: string;
}

export const SavingsAndDebtsView: React.FC<SavingsAndDebtsViewProps> = ({
  savingsGoals,
  debts,
  accounts = [],
  onAddSavingsGoal,
  onUpdateGoalAmount,
  onDeleteSavingsGoal,
  onDepositToGoalWithTransaction,
  onAddDebt,
  onDeleteDebt,
  onPayDebtWithTransaction,
  onCollectDebtWithTransaction,
  onReopenDebt,
  userId,
}) => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);

  // Active goal for flexible deposit modal
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('1000');
  const [depositAccount, setDepositAccount] = useState<string>(accounts[0]?.name || 'GCash');
  const [depositNotes, setDepositNotes] = useState<string>('');

  // Active debt for payment / collection modal
  const [activeDebtPayment, setActiveDebtPayment] = useState<DebtLoan | null>(null);
  const [debtPayAmount, setDebtPayAmount] = useState<string>('');
  const [debtPayAccount, setDebtPayAccount] = useState<string>(accounts[0]?.name || 'GCash');
  const [debtPayNotes, setDebtPayNotes] = useState<string>('');

  // Savings Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState<number>(0);
  const [goalCurrentAmount, setGoalCurrentAmount] = useState<number>(0);

  // Debt Form State
  const [debtPartyName, setDebtPartyName] = useState('');
  const [debtType, setDebtType] = useState<'I_OWE' | 'OWED_TO_ME'>('I_OWE');
  const [debtOriginalAmount, setDebtOriginalAmount] = useState<number>(0);
  const [debtAmortization, setDebtAmortization] = useState<number>(0);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || goalTargetAmount <= 0) return;

    onAddSavingsGoal({
      id: 'sg_' + Date.now(),
      userId,
      title: goalTitle,
      targetAmount: goalTargetAmount,
      currentAmount: goalCurrentAmount,
      targetDate: '2026-12-31',
      monthlyTargetContribution: Math.round(goalTargetAmount / 6),
      iconName: 'Shield',
      colorHex: '#2E7D5B',
    });

    setGoalTitle('');
    setGoalTargetAmount(0);
    setGoalCurrentAmount(0);
    setShowAddGoal(false);
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtPartyName || debtOriginalAmount <= 0) return;

    onAddDebt({
      id: 'debt_' + Date.now(),
      userId,
      partyName: debtPartyName,
      type: debtType,
      originalAmount: debtOriginalAmount,
      remainingAmount: debtOriginalAmount,
      monthlyAmortization: debtAmortization > 0 ? debtAmortization : Math.round(debtOriginalAmount / 6),
    });

    setDebtPartyName('');
    setDebtOriginalAmount(0);
    setDebtAmortization(0);
    setShowAddDebt(false);
  };

  const handleOpenDepositModal = (goal: SavingsGoal) => {
    setActiveDepositGoal(goal);
    // Suggest remaining amount or default 1,000
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const suggested = remaining > 0 && remaining < 1000 ? remaining : 1000;
    setDepositAmount(String(suggested));
    setDepositAccount(accounts[0]?.name || 'GCash');
    setDepositNotes('');
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositGoal) return;
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid deposit amount greater than 0.');
      return;
    }

    if (onDepositToGoalWithTransaction) {
      onDepositToGoalWithTransaction(activeDepositGoal, num, depositAccount, depositNotes);
    } else {
      onUpdateGoalAmount(activeDepositGoal.id, num);
    }

    setActiveDepositGoal(null);
  };

  const handleOpenDebtModal = (debt: DebtLoan) => {
    setActiveDebtPayment(debt);
    // Pre-fill with remaining amount for full payment, or monthly amortization
    setDebtPayAmount(String(debt.remainingAmount));
    setDebtPayAccount(accounts[0]?.name || 'GCash');
    setDebtPayNotes('');
  };

  const handleConfirmDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDebtPayment) return;
    const num = parseFloat(debtPayAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    if (activeDebtPayment.type === 'I_OWE') {
      if (onPayDebtWithTransaction) {
        onPayDebtWithTransaction(activeDebtPayment, num, debtPayAccount, debtPayNotes);
      }
    } else {
      if (onCollectDebtWithTransaction) {
        onCollectDebtWithTransaction(activeDebtPayment, num, debtPayAccount, debtPayNotes);
      }
    }

    setActiveDebtPayment(null);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SAVINGS GOALS */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-600" />
              <span>Savings Goals & Emergency Reserves</span>
            </h2>
            <p className="text-xs text-slate-500">
              Emergency buffer, 13th month fund, travel goals, and Paluwagan
            </p>
          </div>

          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Savings Goal</span>
          </button>
        </div>

        {/* Add Goal Form */}
        {showAddGoal && (
          <form onSubmit={handleCreateGoal} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">New Target Goal</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Goal Title (e.g. Emergency Fund)"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                required
                placeholder="Target Total Amount (₱)"
                value={goalTargetAmount || ''}
                onChange={(e) => setGoalTargetAmount(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                placeholder="Current Starting Amount (₱)"
                value={goalCurrentAmount || ''}
                onChange={(e) => setGoalCurrentAmount(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-3 rounded-xl bg-emerald-700 text-white font-bold"
              >
                Save Goal
              </button>
            </div>
          </form>
        )}

        {/* Goals List */}
        {savingsGoals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active savings goals added yet. Click &quot;New Savings Goal&quot; above to begin tracking.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{goal.title}</h3>
                        <p className="text-[10px] text-slate-500">Target Date: {goal.targetDate || 'No deadline'}</p>
                      </div>

                      <button
                        onClick={() => onDeleteSavingsGoal(goal.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-sans">Current Progress:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatPeso(goal.currentAmount)} / {formatPeso(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{pct}% Accumulated</span>
                        <span>{remaining > 0 ? `${formatPeso(remaining)} remaining` : 'Target reached! 🎉'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Flexible Deposit Action with Transaction Flow */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenDepositModal(goal)}
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Deposit into Goal (Flexible Amount)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: DEBTS & LOANS (UTANG TRACKER) */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-sky-600" />
              <span>Debts & Loans Monitor (Utang Tracker)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Track SSS Salary Loans, Pag-IBIG Loans, Personal Utang owed or receivable with direct payment logging
            </p>
          </div>

          <button
            onClick={() => setShowAddDebt(!showAddDebt)}
            className="py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Debt / Loan</span>
          </button>
        </div>

        {/* Add Debt Form */}
        {showAddDebt && (
          <form onSubmit={handleCreateDebt} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">New Debt / Loan Entry</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                type="text"
                required
                placeholder="Party / Borrower / Lender Name"
                value={debtPartyName}
                onChange={(e) => setDebtPartyName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="I_OWE">Utang Ko / Liabilities (I Owe)</option>
                <option value="OWED_TO_ME">Pautang / Receivables (Owed to Me)</option>
              </select>

              <input
                type="number"
                required
                placeholder="Principal Amount (₱)"
                value={debtOriginalAmount || ''}
                onChange={(e) => setDebtOriginalAmount(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <input
                type="number"
                placeholder="Monthly Amortization (₱)"
                value={debtAmortization || ''}
                onChange={(e) => setDebtAmortization(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddDebt(false)}
                className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-3 rounded-xl bg-emerald-700 text-white font-bold"
              >
                Save Debt Entry
              </button>
            </div>
          </form>
        )}

        {/* Debts List */}
        {debts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active debts or loans recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((d) => {
              const isIowe = d.type === 'I_OWE';
              const isSettled = d.remainingAmount <= 0;

              return (
                <div
                  key={d.id}
                  className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                    isSettled
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isSettled
                                ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                                : isIowe
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            }`}
                          >
                            {isSettled
                              ? '✓ Settled / Fully Paid'
                              : isIowe
                              ? 'Liability (Utang Ko)'
                              : 'Receivable (Pautang)'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {d.partyName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSettled && onReopenDebt && (
                          <button
                            onClick={() => onReopenDebt(d)}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
                            title="Reopen Balance"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteDebt(d.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div>
                        <span className="text-slate-500 font-sans text-[11px] block">Principal / Total:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPeso(d.originalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[11px] block">Remaining Balance:</span>
                        <span className={`font-bold ${isSettled ? 'text-emerald-600' : isIowe ? 'text-rose-600' : 'text-sky-600'}`}>
                          {formatPeso(d.remainingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment / Collection Action */}
                  <div className="pt-2">
                    {isSettled ? (
                      <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fully Settled & Recorded in Transactions</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenDebtModal(d)}
                        className={`w-full py-2 px-3 text-xs font-bold text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          isIowe
                            ? 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600'
                            : 'bg-sky-600 hover:bg-sky-700'
                        }`}
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>{isIowe ? 'Mark as Paid / Magbayad' : 'Record Collection / Nasingil'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: FLEXIBLE SAVINGS GOAL DEPOSIT (PASSES THROUGH TRANSACTIONS) */}
      {/* ==================================================================== */}
      {activeDepositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Deposit to {activeDepositGoal.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Progress: {formatPeso(activeDepositGoal.currentAmount)} / {formatPeso(activeDepositGoal.targetAmount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDepositGoal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeposit} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount (₱) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter custom deposit amount"
                  className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* Quick Chips for Flexibility */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[500, 1000, 2500, 5000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setDepositAmount(String(chip))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                    >
                      +₱{chip.toLocaleString()}
                    </button>
                  ))}
                  {activeDepositGoal.targetAmount > activeDepositGoal.currentAmount && (
                    <button
                      type="button"
                      onClick={() => setDepositAmount(String(activeDepositGoal.targetAmount - activeDepositGoal.currentAmount))}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-200 transition-colors"
                    >
                      Reach Target (₱{(activeDepositGoal.targetAmount - activeDepositGoal.currentAmount).toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Deduct From Account</span>
                </label>
                <select
                  value={depositAccount}
                  onChange={(e) => setDepositAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatPeso(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="e.g. 15th payday allocation / savings buffer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  This deposit will automatically deduct funds from <strong>{depositAccount}</strong>, increase your savings goal progress, and log as a Transfer transaction on your dashboard.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDepositGoal(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-xs"
                >
                  Deposit & Record Transaction
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: DEBT PAYMENT / COLLECTION (PASSES THROUGH TRANSACTIONS) */}
      {/* ==================================================================== */}
      {activeDebtPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white ${
                  activeDebtPayment.type === 'I_OWE' ? 'bg-rose-600' : 'bg-sky-600'
                }`}>
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeDebtPayment.type === 'I_OWE' ? 'Pay Debt / Magbayad ng Utang' : 'Record Collection / Nasingil'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Party: {activeDebtPayment.partyName} (Remaining: {formatPeso(activeDebtPayment.remainingAmount)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDebtPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDebtPayment} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {activeDebtPayment.type === 'I_OWE' ? 'Payment Amount (₱)' : 'Collected Amount (₱)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={activeDebtPayment.remainingAmount}
                  required
                  value={debtPayAmount}
                  onChange={(e) => setDebtPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex flex-wrap gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDebtPayAmount(String(activeDebtPayment.remainingAmount))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-200 transition-colors"
                  >
                    Full Settlement ({formatPeso(activeDebtPayment.remainingAmount)})
                  </button>
                  {activeDebtPayment.monthlyAmortization && activeDebtPayment.monthlyAmortization < activeDebtPayment.remainingAmount && (
                    <button
                      type="button"
                      onClick={() => setDebtPayAmount(String(activeDebtPayment.monthlyAmortization))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                    >
                      Monthly Amortization ({formatPeso(activeDebtPayment.monthlyAmortization)})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeDebtPayment.type === 'I_OWE' ? 'Pay From Account' : 'Deposit Received To Account'}</span>
                </label>
                <select
                  value={debtPayAccount}
                  onChange={(e) => setDebtPayAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatPeso(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={debtPayNotes}
                  onChange={(e) => setDebtPayNotes(e.target.value)}
                  placeholder="e.g. Partial repayment / reference receipt"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {activeDebtPayment.type === 'I_OWE'
                    ? `This payment will record an Expense under 'Loan Repayments', reduce your remaining balance, and keep the debt card active as 'Fully Settled' once paid in full.`
                    : `This collection will record an Income under 'Loan Repayments' and add funds into ${debtPayAccount}.`}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDebtPayment(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-xs"
                >
                  {activeDebtPayment.type === 'I_OWE' ? 'Confirm Payment' : 'Confirm Collection'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
