import React, { useState, useMemo } from 'react';
import { CreditCard, Calendar, CheckCircle2, Plus, Trash2, Wallet, X, Edit2, Percent, Calculator, Info } from 'lucide-react';
import { RecurringBill, Installment, FinancialAccount } from '../types';
import { formatPeso } from '../utils/formatters';
import { calculateInstallmentRemaining, calculateInstallmentMonthlyPayment } from '../utils/financialCalculations';

interface BillsAndInstallmentsViewProps {
  bills: RecurringBill[];
  installments: Installment[];
  accounts?: FinancialAccount[];
  onToggleBillPaid: (billId: string) => void;
  onPayBillWithTransaction?: (bill: RecurringBill, amount: number, paymentMethod: string, date: string, notes?: string) => void;
  onAddBill: (bill: RecurringBill) => void;
  onDeleteBill: (billId: string) => void;
  onAddInstallment: (installment: Installment) => void;
  onIncrementInstallmentMonth: (installmentId: string) => void;
  onPayInstallmentWithTransaction?: (installment: Installment, amount: number, paymentMethod: string, date: string, notes?: string) => void;
  onDeleteInstallment: (installmentId: string) => void;
  userId: string;
}

export const BillsAndInstallmentsView: React.FC<BillsAndInstallmentsViewProps> = ({
  bills,
  installments,
  accounts = [],
  onToggleBillPaid,
  onPayBillWithTransaction,
  onAddBill,
  onDeleteBill,
  onAddInstallment,
  onIncrementInstallmentMonth,
  onPayInstallmentWithTransaction,
  onDeleteInstallment,
  userId,
}) => {
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddInstallment, setShowAddInstallment] = useState(false);

  // Active bill for payment modal
  const [activeBillPayment, setActiveBillPayment] = useState<RecurringBill | null>(null);
  const [billPayAmount, setBillPayAmount] = useState<string>('');
  const [billPayAccount, setBillPayAccount] = useState<string>('');
  const [billPayDate, setBillPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [billPayNotes, setBillPayNotes] = useState<string>('');

  // Active installment for payment modal
  const [activeInstPayment, setActiveInstPayment] = useState<Installment | null>(null);
  const [instPayAmount, setInstPayAmount] = useState<string>('');
  const [instPayAccount, setInstPayAccount] = useState<string>('');
  const [instPayDate, setInstPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [instPayNotes, setInstPayNotes] = useState<string>('');

  // Bill Form State
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState<number>(0);
  const [billDueDateDay, setBillDueDateDay] = useState<number>(15);
  const [billCategory, setBillCategory] = useState('Utilities & Monthly Bills');
  const [billPaymentMethod, setBillPaymentMethod] = useState(accounts[0]?.name || 'GCash');

  // Installment Form State & Editing State
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [merchantName, setMerchantName] = useState('Shopee SPayLater');
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalMonths, setTotalMonths] = useState<number>(6);
  const [interestRatePercent, setInterestRatePercent] = useState<string>('');
  const [interestRateType, setInterestRateType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [interestCalculationType, setInterestCalculationType] = useState<'ADD_ON' | 'AMORTIZED'>('ADD_ON');
  const [customMonthlyPayment, setCustomMonthlyPayment] = useState<string>('');
  const [isManualPaymentOverride, setIsManualPaymentOverride] = useState<boolean>(false);
  const [instPaymentMethod, setInstPaymentMethod] = useState(accounts[0]?.name || 'GCash');
  const [instNotes, setInstNotes] = useState<string>('');

  // Real-time calculation using accurate formula
  const computedCalculation = useMemo(() => {
    const rateNum = parseFloat(interestRatePercent);
    const validRate = !isNaN(rateNum) && rateNum >= 0 ? rateNum : 0;
    return calculateInstallmentMonthlyPayment(
      totalAmount,
      totalMonths,
      validRate,
      interestRateType,
      interestCalculationType
    );
  }, [totalAmount, totalMonths, interestRatePercent, interestRateType, interestCalculationType]);

  const effectiveMonthlyPayment = useMemo(() => {
    if (isManualPaymentOverride && customMonthlyPayment !== '') {
      const parsed = parseFloat(customMonthlyPayment);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return computedCalculation.monthlyPayment;
  }, [isManualPaymentOverride, customMonthlyPayment, computedCalculation.monthlyPayment]);

  const activeInstallments = useMemo(() => {
    return installments.filter(i => {
      const calc = calculateInstallmentRemaining(i);
      return calc.remainingMonths > 0 && i.paidMonths < i.totalMonths;
    });
  }, [installments]);

  const completedInstallments = useMemo(() => {
    return installments.filter(i => {
      const calc = calculateInstallmentRemaining(i);
      return calc.remainingMonths <= 0 || i.paidMonths >= i.totalMonths;
    });
  }, [installments]);

  const handleOpenAddInstallment = () => {
    setEditingInstallment(null);
    setMerchantName('Shopee SPayLater');
    setItemName('');
    setTotalAmount(0);
    setTotalMonths(6);
    setInterestRatePercent('');
    setInterestRateType('MONTHLY');
    setInterestCalculationType('ADD_ON');
    setCustomMonthlyPayment('');
    setIsManualPaymentOverride(false);
    setInstPaymentMethod(accounts[0]?.name || 'GCash');
    setInstNotes('');
    setShowAddInstallment(true);
  };

  const handleOpenEditInstallment = (inst: Installment) => {
    setEditingInstallment(inst);
    setMerchantName(inst.merchantName);
    setItemName(inst.itemName);
    setTotalAmount(inst.totalAmount);
    setTotalMonths(inst.totalMonths);
    setInterestRatePercent(inst.interestRatePercent !== undefined ? String(inst.interestRatePercent) : '');
    setInterestRateType(inst.interestRateType || 'MONTHLY');
    setInterestCalculationType(inst.interestCalculationType || 'ADD_ON');
    setCustomMonthlyPayment(String(inst.monthlyPayment));
    setIsManualPaymentOverride(true);
    setInstPaymentMethod(inst.paymentMethod);
    setInstNotes(inst.notes || '');
    setShowAddInstallment(true);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle || billAmount <= 0) return;

    onAddBill({
      id: 'bill_' + Date.now(),
      userId,
      title: billTitle,
      amount: billAmount,
      dueDateDay: billDueDateDay,
      category: billCategory,
      paymentMethod: billPaymentMethod,
      autoRemind: true,
      isPaidThisMonth: false,
    });

    setBillTitle('');
    setBillAmount(0);
    setShowAddBill(false);
  };

  const handleCreateInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || totalAmount <= 0 || totalMonths <= 0) return;

    const rateNum = parseFloat(interestRatePercent);
    const hasRate = !isNaN(rateNum) && rateNum >= 0;
    const finalRate = hasRate ? rateNum : undefined;

    const calc = calculateInstallmentMonthlyPayment(
      totalAmount,
      totalMonths,
      hasRate ? rateNum : 0,
      interestRateType,
      interestCalculationType
    );

    const manualVal = parseFloat(customMonthlyPayment);
    const finalMonthlyPayment = isManualPaymentOverride && !isNaN(manualVal) && manualVal > 0
      ? Math.round(manualVal * 100) / 100
      : calc.monthlyPayment;

    onAddInstallment({
      id: editingInstallment ? editingInstallment.id : 'inst_' + Date.now(),
      userId,
      merchantName,
      itemName: itemName.trim(),
      totalAmount,
      monthlyPayment: finalMonthlyPayment,
      totalMonths,
      paidMonths: editingInstallment ? editingInstallment.paidMonths : 0,
      startDate: editingInstallment ? editingInstallment.startDate : new Date().toISOString().split('T')[0],
      paymentMethod: instPaymentMethod,
      category: 'Installments & PayLater',
      interestRatePercent: finalRate,
      interestRateType: hasRate ? interestRateType : undefined,
      interestCalculationType: hasRate ? interestCalculationType : undefined,
      totalInterestAmount: hasRate ? calc.totalInterest : undefined,
      totalPayableAmount: hasRate ? calc.totalPayable : totalAmount,
      notes: instNotes.trim() || undefined,
    });

    setItemName('');
    setTotalAmount(0);
    setTotalMonths(6);
    setInterestRatePercent('');
    setCustomMonthlyPayment('');
    setIsManualPaymentOverride(false);
    setEditingInstallment(null);
    setShowAddInstallment(false);
  };

  const handleOpenBillModal = (bill: RecurringBill) => {
    setActiveBillPayment(bill);
    setBillPayAmount(String(bill.amount));
    // Pre-select bill payment method if it matches user account, or fallback to first account
    const matched = accounts.find(a => a.name.toLowerCase() === bill.paymentMethod.toLowerCase());
    setBillPayAccount(matched ? matched.name : accounts[0]?.name || 'GCash');
    setBillPayDate(new Date().toISOString().split('T')[0]);
    setBillPayNotes('');
  };

  const handleConfirmBillPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBillPayment) return;
    const num = parseFloat(billPayAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid bill amount.');
      return;
    }

    if (onPayBillWithTransaction) {
      onPayBillWithTransaction(activeBillPayment, num, billPayAccount, billPayDate, billPayNotes);
    } else {
      onToggleBillPaid(activeBillPayment.id);
    }

    setActiveBillPayment(null);
  };

  const handleOpenInstallmentModal = (inst: Installment) => {
    setActiveInstPayment(inst);
    setInstPayAmount(String(inst.monthlyPayment));
    const matched = accounts.find(a => a.name.toLowerCase() === inst.paymentMethod.toLowerCase());
    setInstPayAccount(matched ? matched.name : accounts[0]?.name || 'GCash');
    setInstPayDate(new Date().toISOString().split('T')[0]);
    setInstPayNotes('');
  };

  const handleConfirmInstallmentPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstPayment) return;
    const num = parseFloat(instPayAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid installment payment amount.');
      return;
    }

    if (onPayInstallmentWithTransaction) {
      onPayInstallmentWithTransaction(activeInstPayment, num, instPayAccount, instPayDate, instPayNotes);
    } else {
      onIncrementInstallmentMonth(activeInstPayment.id);
    }

    setActiveInstPayment(null);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: RECURRING BILLS */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Recurring Monthly Bills & Utilities</span>
            </h2>
            <p className="text-xs text-slate-500">
              Meralco, Maynilad, Converge Fiber, Rent, Netflix, and Postpaid plans with direct transaction recording
            </p>
          </div>

          <button
            onClick={() => setShowAddBill(!showAddBill)}
            className="py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Bill</span>
          </button>
        </div>

        {/* Add Bill Form */}
        {showAddBill && (
          <form onSubmit={handleCreateBill} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">New Monthly Bill Reminder</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                type="text"
                required
                placeholder="Bill Title (e.g. Meralco Electric)"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                required
                placeholder="Monthly Amount (₱)"
                value={billAmount || ''}
                onChange={(e) => setBillAmount(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                min="1"
                max="31"
                required
                placeholder="Due Day of Month (1-31)"
                value={billDueDateDay}
                onChange={(e) => setBillDueDateDay(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={billPaymentMethod}
                onChange={(e) => setBillPaymentMethod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddBill(false)}
                className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-3 rounded-xl bg-emerald-700 text-white font-bold"
              >
                Save Bill Reminder
              </button>
            </div>
          </form>
        )}

        {/* Bills Grid */}
        {bills.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No recurring bills added yet. Click &quot;Add Recurring Bill&quot; above to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                  bill.isPaidThisMonth
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{bill.title}</h3>
                      <p className="text-[10px] text-slate-500">Due every day {bill.dueDateDay} of month</p>
                    </div>

                    <button
                      onClick={() => onDeleteBill(bill.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {formatPeso(bill.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Via {bill.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  {bill.isPaidThisMonth ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Paid for this Month</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleBillPaid(bill.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                      >
                        Unmark
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenBillModal(bill)}
                      className="w-full py-1.5 px-3 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pay Bill & Record Transaction</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: INSTALLMENTS & PAYLATER */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span>Installment & PayLater Monitor</span>
            </h2>
            <p className="text-xs text-slate-500">
              Track accurate monthly payments with interest calculations for Shopee SPayLater, LazPayLater, TikTok, Atome, and Credit Card financing.
            </p>
          </div>

          <button
            onClick={() => {
              if (showAddInstallment) {
                setShowAddInstallment(false);
                setEditingInstallment(null);
              } else {
                handleOpenAddInstallment();
              }
            }}
            className="py-2 px-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Track New Installment</span>
          </button>
        </div>

        {/* Active Installments Financial Summary Bar */}
        {installments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Plans</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {activeInstallments.length} of {installments.length} Active
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Outflow</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400 text-sm">
                {formatPeso(activeInstallments.reduce((acc, i) => acc + i.monthlyPayment, 0))} / mo
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remaining Balance</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {formatPeso(activeInstallments.reduce((acc, i) => acc + calculateInstallmentRemaining(i).remainingBalance, 0))}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Interest in Plans</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {formatPeso(installments.reduce((acc, i) => acc + (calculateInstallmentRemaining(i).totalInterest || 0), 0))}
              </span>
            </div>
          </div>
        )}

        {/* Add / Edit Installment Form */}
        {showAddInstallment && (
          <form onSubmit={handleCreateInstallment} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {editingInstallment ? 'Edit Installment & Interest Rate' : 'New Installment / BNPL Plan'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Set loan terms, interest rates, and compute accurate monthly payments automatically
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddInstallment(false);
                  setEditingInstallment(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Financing Provider / Merchant <span className="text-rose-500">*</span>
                </label>
                <select
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Shopee SPayLater">Shopee SPayLater</option>
                  <option value="Lazada LazPayLater">Lazada LazPayLater</option>
                  <option value="TikTok PayLater">TikTok PayLater</option>
                  <option value="Atome Credit">Atome Credit</option>
                  <option value="Atome Cash Loan">Atome Cash Loan</option>
                  <option value="GLoan / GCash">GLoan / GCash</option>
                  <option value="Home Credit">Home Credit</option>
                  <option value="Credit Card 0% Installment">Credit Card 0% Installment</option>
                  <option value="Credit Card Installment (with interest)">Credit Card Installment (with interest)</option>
                  <option value="Store Financing">Store Financing</option>
                  <option value="Other BNPL / Installment">Other BNPL / Installment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item / Plan Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter Aircon, iPhone 16, Laptop"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deduct Payment From Account
                </label>
                <select
                  value={instPaymentMethod}
                  onChange={(e) => setInstPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({formatPeso(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cash Price / Principal Amount (₱) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 15000"
                    value={totalAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalAmount(val);
                      if (!isManualPaymentOverride) {
                        const nextCalc = calculateInstallmentMonthlyPayment(
                          val,
                          totalMonths,
                          parseFloat(interestRatePercent) || 0,
                          interestRateType,
                          interestCalculationType
                        );
                        setCustomMonthlyPayment(String(nextCalc.monthlyPayment));
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenure / Total Months <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  placeholder="e.g. 6 or 12"
                  value={totalMonths}
                  onChange={(e) => {
                    const months = Math.max(1, Number(e.target.value));
                    setTotalMonths(months);
                    if (!isManualPaymentOverride) {
                      const nextCalc = calculateInstallmentMonthlyPayment(
                        totalAmount,
                        months,
                        parseFloat(interestRatePercent) || 0,
                        interestRateType,
                        interestCalculationType
                      );
                      setCustomMonthlyPayment(String(nextCalc.monthlyPayment));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {editingInstallment && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Months Already Paid
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalMonths}
                    value={editingInstallment.paidMonths}
                    onChange={(e) => {
                      setEditingInstallment({
                        ...editingInstallment,
                        paidMonths: Math.min(totalMonths, Math.max(0, Number(e.target.value))),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              )}
            </div>

            {/* Interest Rate Configuration Section */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  <span>Optional Interest Rate & Financing Terms</span>
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                  Leave at 0 or empty for 0% interest promo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Interest Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0 for 0% (e.g. 2.95)"
                      value={interestRatePercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInterestRatePercent(val);
                        const rateNum = parseFloat(val) || 0;
                        const nextCalc = calculateInstallmentMonthlyPayment(
                          totalAmount,
                          totalMonths,
                          rateNum,
                          interestRateType,
                          interestCalculationType
                        );
                        if (!isManualPaymentOverride) {
                          setCustomMonthlyPayment(String(nextCalc.monthlyPayment));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Rate Frequency
                  </label>
                  <select
                    value={interestRateType}
                    onChange={(e) => {
                      const newType = e.target.value as 'MONTHLY' | 'ANNUAL';
                      setInterestRateType(newType);
                      const nextCalc = calculateInstallmentMonthlyPayment(
                        totalAmount,
                        totalMonths,
                        parseFloat(interestRatePercent) || 0,
                        newType,
                        interestCalculationType
                      );
                      if (!isManualPaymentOverride) {
                        setCustomMonthlyPayment(String(nextCalc.monthlyPayment));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="MONTHLY">% per month (Shopee SPayLater / LazPayLater / CC Add-on)</option>
                    <option value="ANNUAL">% per year (Annual APR)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Calculation Formula
                  </label>
                  <select
                    value={interestCalculationType}
                    onChange={(e) => {
                      const newMethod = e.target.value as 'ADD_ON' | 'AMORTIZED';
                      setInterestCalculationType(newMethod);
                      const nextCalc = calculateInstallmentMonthlyPayment(
                        totalAmount,
                        totalMonths,
                        parseFloat(interestRatePercent) || 0,
                        interestRateType,
                        newMethod
                      );
                      if (!isManualPaymentOverride) {
                        setCustomMonthlyPayment(String(nextCalc.monthlyPayment));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="ADD_ON">Add-on Flat Rate (Standard BNPL / SPayLater / CC)</option>
                    <option value="AMORTIZED">Diminishing / Amortized Balance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white/60 dark:bg-black/20 p-2 rounded-xl">
                <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Philippine Benchmark:</strong> Shopee SPayLater and LazPayLater charge a flat add-on rate of <strong>2.95% to 3.95% per month</strong>. For 0% interest promotions, keep the rate at <strong>0%</strong>.
                </span>
              </div>
            </div>

            {/* Accurate Monthly Payment Field with Sync/Override */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accurate Monthly Payment Needed (₱) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={isManualPaymentOverride ? customMonthlyPayment : (effectiveMonthlyPayment || '')}
                    onChange={(e) => {
                      setIsManualPaymentOverride(true);
                      setCustomMonthlyPayment(e.target.value);
                    }}
                    placeholder="Monthly Payment"
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>
                    {isManualPaymentOverride ? 'Customized statement payment' : 'Auto-calculated from formula'}
                  </span>
                  {isManualPaymentOverride && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualPaymentOverride(false);
                        setCustomMonthlyPayment(String(computedCalculation.monthlyPayment));
                      }}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                    >
                      Reset to Formula (₱{computedCalculation.monthlyPayment.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Live Real-Time Breakdown Widget */}
              {totalAmount > 0 && totalMonths > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Principal:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatPeso(computedCalculation.monthlyPrincipal)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Monthly Interest ({interestRatePercent ? `${interestRatePercent}%` : '0%'}):
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{formatPeso(computedCalculation.monthlyInterest)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-700/60 pt-1 text-[10px]">
                    <span className="text-slate-400">Total Repayment:</span>
                    <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">
                      {formatPeso(computedCalculation.totalPayable)} (Int: {formatPeso(computedCalculation.totalInterest)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddInstallment(false);
                  setEditingInstallment(null);
                }}
                className="py-2 px-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingInstallment ? 'Update Installment' : 'Save Installment'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Active Installments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Active Installment Plans</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                {activeInstallments.length} Ongoing
              </span>
            </h3>
            {activeInstallments.length > 0 && (
              <span className="text-[11px] text-slate-400">
                Active amortizations with remaining dues
              </span>
            )}
          </div>

          {activeInstallments.length === 0 ? (
            <div className="p-8 text-center text-xs rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {installments.length === 0
                  ? 'No installments tracked yet.'
                  : 'No active installments currently ongoing! 🎉'}
              </p>
              <p className="text-[11px] text-slate-400">
                {installments.length === 0
                  ? 'Click "Track New Installment" above to track BNPL or credit card amortization.'
                  : 'All your tracked plans have been fully settled and moved to the Completed section below.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeInstallments.map((inst) => {
                const calc = calculateInstallmentRemaining(inst);
                return (
                  <div
                    key={inst.id}
                    className="p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800/80"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                              {inst.merchantName}
                            </span>
                            {inst.interestRatePercent !== undefined && inst.interestRatePercent > 0 ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                <Percent className="w-2.5 h-2.5" />
                                <span>{inst.interestRatePercent}% {inst.interestRateType === 'ANNUAL' ? '/ yr APR' : '/ mo'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                0% Int.
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {inst.itemName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditInstallment(inst)}
                            className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg p-1.5 transition-colors cursor-pointer"
                            title="Edit Installment & Interest"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteInstallment(inst.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg p-1.5 transition-colors cursor-pointer"
                            title="Delete Installment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Monthly Payment:</span>
                          <p className="font-bold text-slate-900 dark:text-white">{formatPeso(inst.monthlyPayment)} / mo</p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Remaining Balance:</span>
                          <p className="font-bold text-purple-700 dark:text-purple-400">{formatPeso(calc.remainingBalance)}</p>
                        </div>
                      </div>

                      {/* Breakdown if interest is present */}
                      {inst.interestRatePercent !== undefined && inst.interestRatePercent > 0 && (
                        <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Principal: {formatPeso(calc.monthlyPrincipal)} / mo</span>
                            <span className="text-amber-700 dark:text-amber-400 font-medium">Interest: +{formatPeso(calc.monthlyInterest)} / mo</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 border-t border-purple-200/40 dark:border-purple-900/40 pt-1">
                            <span>Total Loan: {formatPeso(calc.totalPayable)}</span>
                            <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">Total Int: {formatPeso(calc.totalInterest)}</span>
                          </div>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Progress: {inst.paidMonths} / {inst.totalMonths} months paid</span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">{calc.completionPercentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${calc.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => handleOpenInstallmentModal(inst)}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Month {inst.paidMonths + 1} & Record Transaction</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed & Settled Installments Section (Placed Below Actives) */}
        {completedInstallments.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span>Completed & Settled Installments</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {completedInstallments.length} Fully Paid
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Amortization plans that have been fully paid off and settled
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedInstallments.map((inst) => {
                const calc = calculateInstallmentRemaining(inst);
                return (
                  <div
                    key={inst.id}
                    className="p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all bg-emerald-50/25 dark:bg-emerald-950/15 border-emerald-200/80 dark:border-emerald-800/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {inst.merchantName}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                            {inst.interestRatePercent !== undefined && inst.interestRatePercent > 0 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {inst.interestRatePercent}% {inst.interestRateType === 'ANNUAL' ? 'APR' : 'mo'}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {inst.itemName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditInstallment(inst)}
                            className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg p-1.5 transition-colors cursor-pointer"
                            title="Edit Installment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteInstallment(inst.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg p-1.5 transition-colors cursor-pointer"
                            title="Delete Installment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Total Settled:</span>
                          <p className="font-bold text-slate-900 dark:text-white">{formatPeso(calc.totalPayable)}</p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 font-sans block">Remaining Balance:</span>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">₱0.00</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>All {inst.totalMonths} of {inst.totalMonths} months paid</span>
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">100%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All {inst.totalMonths} Month/s Completed & Settled! 🎉</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: PAY BILL & RECORD TRANSACTION */}
      {/* ==================================================================== */}
      {activeBillPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-amber-50/60 dark:bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pay Bill: {activeBillPayment.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Due day: {activeBillPayment.dueDateDay} of this month
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveBillPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBillPayment} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bill Amount to Pay (₱) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={billPayAmount}
                  onChange={(e) => setBillPayAmount(e.target.value)}
                  placeholder="Enter bill amount"
                  className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Deduct From Account</span>
                </label>
                <select
                  value={billPayAccount}
                  onChange={(e) => setBillPayAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
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
                  Payment Date
                </label>
                <input
                  type="date"
                  value={billPayDate}
                  onChange={(e) => setBillPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Reference / Notes
                </label>
                <input
                  type="text"
                  value={billPayNotes}
                  onChange={(e) => setBillPayNotes(e.target.value)}
                  placeholder="e.g. Meralco OR# 44921 / Ref number"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This payment will automatically deduct from <strong>{billPayAccount}</strong>, mark this bill as Paid, and create an Expense transaction on your dashboard.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveBillPayment(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs"
                >
                  Pay & Record Transaction
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: PAY INSTALLMENT & RECORD TRANSACTION */}
      {/* ==================================================================== */}
      {activeInstPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-purple-50/60 dark:bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pay Installment: {activeInstPayment.itemName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeInstPayment.merchantName} &bull; Month {activeInstPayment.paidMonths + 1} of {activeInstPayment.totalMonths}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveInstPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInstallmentPayment} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amortization Amount to Pay (₱) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={instPayAmount}
                  onChange={(e) => setInstPayAmount(e.target.value)}
                  placeholder="Enter monthly payment"
                  className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-purple-600" />
                  <span>Deduct From Account</span>
                </label>
                <select
                  value={instPayAccount}
                  onChange={(e) => setInstPayAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
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
                  Payment Date
                </label>
                <input
                  type="date"
                  value={instPayDate}
                  onChange={(e) => setInstPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={instPayNotes}
                  onChange={(e) => setInstPayNotes(e.target.value)}
                  placeholder="e.g. SPayLater payment via GCash"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  This payment will deduct from <strong>{instPayAccount}</strong>, increment your paid months to {activeInstPayment.paidMonths + 1}, and log an Expense in Transactions.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveInstPayment(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs"
                >
                  Pay & Record Transaction
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
