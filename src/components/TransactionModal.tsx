import React, { useState, useEffect } from 'react';
import { X, Save, ArrowRightLeft, Calculator, Calendar, Clock, DollarSign, Tag, Users, Wallet, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Transaction, TransactionType, Category, FinancialAccount, PaymentMethod, SavingsGoal } from '../types';
import { formatPeso } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Partial<Transaction>) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
  accounts?: FinancialAccount[];
  paymentMethods?: PaymentMethod[];
  savingsGoals?: SavingsGoal[];
}

// Safe arithmetic expression evaluator supporting +, -, *, /, %
function evaluateMathExpression(rawExpr: string): number | null {
  if (!rawExpr || !rawExpr.trim()) return null;
  let expr = rawExpr.trim().replace(/,/g, '');

  try {
    // Handle percentage patterns like: A + B% or A - B% or A * B%
    // e.g. 1000 - 10% -> 1000 - (1000 * 0.1)
    const percentPattern = /([0-9.]+)\s*([+\-*/])\s*([0-9.]+)%/;
    while (percentPattern.test(expr)) {
      expr = expr.replace(percentPattern, (_match, baseStr, op, pctStr) => {
        const base = parseFloat(baseStr);
        const pct = parseFloat(pctStr) / 100;
        if (op === '+' || op === '-') {
          return `${base} ${op} (${base * pct})`;
        } else {
          return `${base} ${op} ${pct}`;
        }
      });
    }

    // Handle standalone percentage e.g. "50%" -> "0.5"
    expr = expr.replace(/([0-9.]+)%/g, '($1 / 100)');

    // Sanitize to only allow numbers, parentheses, and arithmetic operators
    if (!/^[0-9+\-*/. ()]+$/.test(expr)) {
      return null;
    }

    // Evaluate expression safely
    const fn = new Function(`"use strict"; return (${expr});`);
    const result = fn();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  categories,
  accounts = [],
  paymentMethods = [],
  savingsGoals = [],
}) => {
  // Available accounts list: prioritize accounts prop, fallback to paymentMethods
  const availableAccounts = accounts.length > 0
    ? accounts
    : paymentMethods.map(pm => ({
        id: pm.id,
        userId: 'current',
        name: pm.name,
        type: pm.type,
        balance: 0,
      } as FinancialAccount));

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [showCalculator, setShowCalculator] = useState<boolean>(true);

  // Accounts & Category state
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  // Date and Time
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Description & Notes (Subcategory is removed and moved into notes/desc)
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);

  // Initialize or reset form
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'EXPENSE');
      setAmountStr(String(editingTransaction.amount));
      setCalcDisplay(String(editingTransaction.amount));
      setFromAccount(editingTransaction.paymentMethod || availableAccounts[0]?.name || 'Cash');
      setToAccount(editingTransaction.toAccount || (availableAccounts[1]?.name || availableAccounts[0]?.name || 'GCash'));
      setCategory(editingTransaction.category || '');
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setTime(editingTransaction.time || '12:00');
      setDescription(editingTransaction.description || '');
      setNotes(editingTransaction.notes || '');
      setIsShared(editingTransaction.isShared || false);
    } else {
      setType('EXPENSE');
      setAmountStr('');
      setCalcDisplay('0');
      const firstAcc = availableAccounts[0]?.name || 'RCBC Bank';
      const secondAcc = availableAccounts[1]?.name || 'GCash';
      setFromAccount(firstAcc);
      setToAccount(secondAcc);

      const defaultExpenseCat = categories.find(c => c.type === 'EXPENSE');
      setCategory(defaultExpenseCat?.name || 'Food & Dining Out');

      setDate(new Date().toISOString().split('T')[0]);
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setDescription('');
      setNotes('');
      setIsShared(false);
    }
  }, [editingTransaction, isOpen, accounts, paymentMethods]);

  if (!isOpen) return null;

  // Filter categories according to active transaction type
  const activeCategories = categories.filter(c => c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));

  // Handler when switching transaction types
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'INCOME') {
      const inc = categories.find(c => c.type === 'INCOME');
      setCategory(inc?.name || 'Salary & Wages');
    } else if (newType === 'EXPENSE') {
      const exp = categories.find(c => c.type === 'EXPENSE');
      setCategory(exp?.name || 'Food & Dining Out');
    } else if (newType === 'TRANSFER') {
      setCategory('Transfer');
      if (fromAccount === toAccount && availableAccounts.length > 1) {
        const other = availableAccounts.find(a => a.name !== fromAccount);
        if (other) setToAccount(other.name);
      }
    }
  };

  // Calculator button presses
  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('0');
      setAmountStr('0');
      return;
    }

    if (key === '⌫') {
      if (calcDisplay.length <= 1 || calcDisplay === 'Error') {
        setCalcDisplay('0');
        setAmountStr('0');
      } else {
        const next = calcDisplay.slice(0, -1);
        setCalcDisplay(next);
        const evalVal = evaluateMathExpression(next);
        if (evalVal !== null && evalVal >= 0) {
          setAmountStr(String(evalVal));
        }
      }
      return;
    }

    if (key === '=') {
      const evaluated = evaluateMathExpression(calcDisplay);
      if (evaluated !== null && evaluated >= 0) {
        setCalcDisplay(String(evaluated));
        setAmountStr(String(evaluated));
      } else {
        setCalcDisplay('Error');
      }
      return;
    }

    // If key is an operator
    const isOperator = ['+', '-', '*', '/', '%'].includes(key);

    let nextDisplay = calcDisplay;
    if (calcDisplay === '0' || calcDisplay === 'Error') {
      nextDisplay = isOperator ? `0${key}` : key;
    } else {
      // Avoid double operators like ++ or **
      const lastChar = calcDisplay.slice(-1);
      if (isOperator && ['+', '-', '*', '/'].includes(lastChar)) {
        nextDisplay = calcDisplay.slice(0, -1) + key;
      } else {
        nextDisplay = calcDisplay + key;
      }
    }

    setCalcDisplay(nextDisplay);

    // Auto-evaluate if possible when not ending with an operator
    const evaluated = evaluateMathExpression(nextDisplay);
    if (evaluated !== null && evaluated >= 0) {
      setAmountStr(String(evaluated));
    }
  };

  // Direct manual input in amount field
  const handleAmountInputChange = (val: string) => {
    setCalcDisplay(val);
    const evaluated = evaluateMathExpression(val);
    if (evaluated !== null && evaluated >= 0) {
      setAmountStr(String(evaluated));
    } else {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        setAmountStr(String(num));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = evaluateMathExpression(calcDisplay) ?? parseFloat(amountStr) ?? 0;

    if (finalAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    if (type === 'TRANSFER' && fromAccount === toAccount) {
      alert('Source and destination accounts must be different for a transfer.');
      return;
    }

    const isToSavingsGoal = type === 'TRANSFER' && (toAccount.startsWith('Goal: ') || toAccount.startsWith('🎯 '));
    const cleanGoalName = toAccount.replace(/^(Goal:\s*|🎯\s*)/, '');

    const defaultDesc = type === 'TRANSFER'
      ? (isToSavingsGoal ? `Savings Deposit: ${fromAccount} → ${cleanGoalName}` : `Transfer: ${fromAccount} → ${toAccount}`)
      : `${type === 'INCOME' ? 'Income' : 'Expense'} record`;

    onSave({
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      type,
      amount: finalAmount,
      category: type === 'TRANSFER' ? (isToSavingsGoal ? 'Savings & Investments' : 'Transfer') : (category || activeCategories[0]?.name || 'General'),
      paymentMethod: fromAccount || availableAccounts[0]?.name || 'Cash',
      toAccount: type === 'TRANSFER' ? toAccount : undefined,
      date,
      time,
      description: description.trim() || defaultDesc,
      notes: notes.trim() || undefined,
      isShared: type === 'EXPENSE' ? isShared : false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white font-bold text-xs ${
              type === 'EXPENSE' ? 'bg-rose-600' : type === 'INCOME' ? 'bg-emerald-700' : 'bg-sky-600'
            }`}>
              {type === 'TRANSFER' ? <ArrowRightLeft className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {editingTransaction ? 'Edit Record' : 'Record New Transaction'}
              </h2>
              <p className="text-[10px] text-slate-400">
                Accurate logging with instant calculator & account allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* 1. TRANSACTION TYPE BUTTONS: Expense, Income, Transfer */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('EXPENSE')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Expense (-)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('INCOME')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  type === 'INCOME'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Income (+)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('TRANSFER')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  type === 'TRANSFER'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* 2. AMOUNT FIELD WITH INTEGRATED CALCULATOR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Amount
              </label>
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  showCalculator
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showCalculator ? 'Hide Keypad' : 'Open Calculator'}</span>
              </button>
            </div>

            {/* Amount & Expression Display */}
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-lg font-bold text-slate-400">₱</span>
              <input
                type="text"
                required
                value={calcDisplay}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-xl font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Real-time Result preview if math was entered */}
            {calcDisplay !== amountStr && amountStr !== '' && (
              <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-end gap-1 px-1">
                <span>Calculated:</span>
                <span>₱{Number(amountStr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Simple Calculator Keypad */}
            {showCalculator && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="grid grid-cols-4 gap-1.5">
                  {/* Row 1 */}
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('C')}
                    className="p-2 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 transition-colors"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('⌫')}
                    className="p-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('%')}
                    className="p-2 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 transition-colors"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('/')}
                    className="p-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                  >
                    ÷
                  </button>

                  {/* Row 2 */}
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('7')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('8')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    8
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('9')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    9
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('*')}
                    className="p-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                  >
                    ×
                  </button>

                  {/* Row 3 */}
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('4')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    4
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('5')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('6')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('-')}
                    className="p-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                  >
                    −
                  </button>

                  {/* Row 4 */}
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('1')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('2')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('3')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('+')}
                    className="p-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                  >
                    +
                  </button>

                  {/* Row 5 */}
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('0')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('.')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('00')}
                    className="p-2.5 text-xs font-semibold rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    00
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcKeyPress('=')}
                    className="p-2 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
                  >
                    =
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. ACCOUNT & CATEGORY (OR FROM -> TO ACCOUNTS ON TRANSFER) */}
          {type === 'TRANSFER' ? (
            /* TRANSFER MODE: From Account & To Account */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
              <div>
                <label className="block text-[11px] font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-sky-600" />
                  <span>From Account (Source)</span>
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-sky-300 dark:border-sky-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatPeso(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-sky-600" />
                  <span>To Account / Destination</span>
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setToAccount(val);
                    if (val.startsWith('Goal: ') || val.startsWith('🎯 ')) {
                      setCategory('Savings & Investments');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-sky-300 dark:border-sky-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <optgroup label="Financial & Money Accounts">
                    {availableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.name} disabled={acc.name === fromAccount}>
                        {acc.name} {acc.name === fromAccount ? '(Source Account)' : `(${formatPeso(acc.balance)})`}
                      </option>
                    ))}
                  </optgroup>
                  {savingsGoals.length > 0 && (
                    <optgroup label="🎯 Savings Goals & Envelopes">
                      {savingsGoals.map((goal) => (
                        <option key={goal.id} value={`Goal: ${goal.title}`}>
                          🎯 {goal.title} ({formatPeso(goal.currentAmount)} / {formatPeso(goal.targetAmount)})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {toAccount.startsWith('Goal: ') && (
                  <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span>🎯</span>
                    <span>Transfers directly to savings goal and updates goal progress!</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* EXPENSE / INCOME MODE: Account & Category */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Account Selector (Shows all customized accounts) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Account</span>
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatPeso(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector (Filtered by Expense or Income) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Category</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 4. DATE AND TIME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Transaction Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 5. DESCRIPTION / PAYEE / TITLE */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Description / Store / Merchant
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'TRANSFER'
                  ? 'e.g. Moved cash to GCash for online bills'
                  : type === 'INCOME'
                  ? 'e.g. Cutoff Salary / Upwork payout / Allowance'
                  : 'e.g. Jollibee Dinner / Puregold groceries / Meralco'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 6. NOTES (Subcategories & Extra Details can be put here) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Notes (Subcategory details, tags, receipt info)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Fried chicken with peach mango pie, shared with siblings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 7. SHARED HOUSEHOLD EXPENSE TOGGLE (Only for Expenses) */}
          {type === 'EXPENSE' && (
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Shared Household Expense</span>
                </span>
                <p className="text-[10px] text-slate-500">
                  Splits amount with partner/roommate in Household Budget view
                </p>
              </div>

              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{editingTransaction ? 'Save Changes' : 'Record Transaction'}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
