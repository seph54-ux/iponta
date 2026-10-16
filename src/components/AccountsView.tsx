import React, { useState } from 'react';
import { Landmark, Wallet, CreditCard, DollarSign, Plus, Edit2, Trash2, Shield, Check, X, ArrowUpRight } from 'lucide-react';
import { FinancialAccount, AccountType } from '../types';
import { formatPeso } from '../utils/formatters';

interface AccountsViewProps {
  accounts: FinancialAccount[];
  onSaveAccount: (account: FinancialAccount) => void;
  onDeleteAccount: (id: string) => void;
  userId: string;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onSaveAccount,
  onDeleteAccount,
  userId,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState<number>(0); // Holds stored funds or used credit
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [accountNumberMasked, setAccountNumberMasked] = useState('');

  const isCreditType = type === 'CREDIT_CARD' || type === 'BNPL';

  // Liquid funds stored across Bank, E-Wallets & Cash
  const totalLiquidBalance = accounts
    .filter(a => a.type !== 'BNPL' && a.type !== 'CREDIT_CARD')
    .reduce((acc, a) => acc + a.balance, 0);

  // Total available credit across Credit Cards & BNPL
  const totalAvailableCredit = accounts
    .filter(a => a.type === 'BNPL' || a.type === 'CREDIT_CARD')
    .reduce((acc, a) => acc + Math.max(0, (a.creditLimit || 0) - a.balance), 0);

  const handleOpenEdit = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance);
    setCreditLimit(acc.creditLimit || 0);
    setAccountNumberMasked(acc.accountNumberMasked || '');
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setName('');
    setType('BANK');
    setBalance(0);
    setCreditLimit(0);
    setAccountNumberMasked('');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveAccount({
      id: editingAccount ? editingAccount.id : 'acc_' + Date.now(),
      userId,
      name: name.trim(),
      type,
      balance: isCreditType ? (editingAccount ? editingAccount.balance : 0) : Number(balance),
      creditLimit: isCreditType ? Number(creditLimit) : undefined,
      accountNumberMasked: accountNumberMasked.trim() || undefined,
    });

    setShowAddModal(false);
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'BANK': return <Landmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'E_WALLET': return <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'CASH': return <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'CREDIT_CARD': return <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'BNPL': return <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-bold">Money Accounts & Stored Balances</h2>
          </div>
          <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
            Customize where your money is stored (RCBC, GCash, Maya, Cash, Atome Credit, etc.). When you record transactions or transfers between accounts, stored balances and credit limits adjust dynamically!
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 rounded-2xl transition-all shadow-xs flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account / Wallet</span>
        </button>
      </div>

      {/* Overview Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Liquid Balance (Banks, E-Wallets & Cash)
          </span>
          <h3 className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {formatPeso(totalLiquidBalance)}
          </h3>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Available Credit & BNPL Lines
          </span>
          <h3 className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400">
            {formatPeso(totalAvailableCredit)}
          </h3>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isCredit = acc.type === 'CREDIT_CARD' || acc.type === 'BNPL';
          const availableCredit = Math.max(0, (acc.creditLimit || 0) - acc.balance);

          return (
            <div
              key={acc.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{acc.name}</h3>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {acc.type.replace('_', ' ')} {acc.accountNumberMasked ? `· ${acc.accountNumberMasked}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Edit Account"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteAccount(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {isCredit ? (
                  <>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Available Credit</span>
                    <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400">
                      {formatPeso(availableCredit)}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>Credit Limit: <strong className="font-mono">{formatPeso(acc.creditLimit || 0)}</strong></span>
                      {acc.balance > 0 && <span>Used: <strong className="font-mono text-rose-600">{formatPeso(acc.balance)}</strong></span>}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Stored Cash Balance</span>
                    <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {formatPeso(acc.balance)}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add/Edit Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAccount ? 'Edit Account' : 'Add New Account / Wallet'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account / Wallet Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCBC, GCash, Maya, Atome Credit, BDO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="BANK">Bank Account (e.g. RCBC, BPI, BDO, UnionBank)</option>
                  <option value="E_WALLET">E-Wallet (e.g. GCash, Maya, ShopeePay)</option>
                  <option value="CASH">Cash Wallet (Physical Cash)</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BNPL">Buy Now Pay Later / Credit Line (e.g. Atome)</option>
                </select>
              </div>

              {/* Show Stored Cash Balance ONLY for Liquid Accounts */}
              {!isCreditType ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stored Cash Balance (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                /* For Credit / BNPL Accounts, show Credit Limit field ONLY */
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 10000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Available credit will adjust dynamically as expenses are charged to this account.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number / ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. **** 1234"
                  value={accountNumberMasked}
                  onChange={(e) => setAccountNumberMasked(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all shadow-sm"
              >
                Save Account & Enable as Payment Method
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
