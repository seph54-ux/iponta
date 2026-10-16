import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, Receipt, Users, Image, ScanText, Clock, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Transaction, Category, PaymentMethod } from '../types';
import { formatPeso, formatDate, sortTransactionsByDateTime } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  paymentMethods,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('ALL');
  // Default sorting: Latest transaction date & time chosen by the user shown at top
  const [sortOrder, setSortOrder] = useState<'DATETIME_DESC' | 'DATETIME_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('DATETIME_DESC');

  // Filter and sort transactions strictly based on chosen transaction date & time
  const filteredAndSorted = useMemo(() => {
    const list = transactions.filter((t) => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
      if (filterPaymentMethod !== 'ALL' && t.paymentMethod !== filterPaymentMethod) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchPM = t.paymentMethod.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchPM) return false;
      }
      return true;
    });

    if (sortOrder === 'DATETIME_DESC') {
      return sortTransactionsByDateTime(list, 'desc');
    } else if (sortOrder === 'DATETIME_ASC') {
      return sortTransactionsByDateTime(list, 'asc');
    } else if (sortOrder === 'AMOUNT_DESC') {
      return [...list].sort((a, b) => b.amount - a.amount);
    } else if (sortOrder === 'AMOUNT_ASC') {
      return [...list].sort((a, b) => a.amount - b.amount);
    }
    return sortTransactionsByDateTime(list, 'desc');
  }, [transactions, filterType, filterCategory, filterPaymentMethod, searchTerm, sortOrder]);

  const toggleDateTimeSort = () => {
    setSortOrder((prev) => (prev === 'DATETIME_DESC' ? 'DATETIME_ASC' : 'DATETIME_DESC'));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Transactions & Income Records ({filteredAndSorted.length})
          </h2>
          <p className="text-xs text-slate-500">
            Sorted by transaction date & time chosen when added · Latest entries displayed at the top
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Sort Pill */}
          <button
            type="button"
            onClick={toggleDateTimeSort}
            className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Toggle sorting by chosen transaction date & time"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {sortOrder === 'DATETIME_DESC'
                ? 'Latest Date & Time First'
                : sortOrder === 'DATETIME_ASC'
                ? 'Oldest Date & Time First'
                : 'Custom Sort'}
            </span>
            {sortOrder === 'DATETIME_DESC' ? (
              <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            ) : sortOrder === 'DATETIME_ASC' ? (
              <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="py-2 px-3.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white dark:bg-[#1E293B] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Types (Income, Expenses, Transfers)</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="INCOME">Income Only</option>
            <option value="TRANSFER">Transfers Only</option>
          </select>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Accounts / Methods</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.name}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            title="Sort transactions order"
          >
            <option value="DATETIME_DESC">Latest Date & Time First (Default)</option>
            <option value="DATETIME_ASC">Oldest Date & Time First</option>
            <option value="AMOUNT_DESC">Amount: Highest First</option>
            <option value="AMOUNT_ASC">Amount: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredAndSorted.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No matching transactions found. Try adjusting filters or click "Add Record".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
                  <th
                    onClick={toggleDateTimeSort}
                    className="py-3 px-4 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 select-none transition-colors"
                    title="Click to toggle sorting by Date & Time"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Time</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold inline-flex items-center gap-0.5">
                        {sortOrder === 'DATETIME_DESC' ? (
                          <>
                            <ArrowDown className="w-2.5 h-2.5" />
                            <span>Latest</span>
                          </>
                        ) : sortOrder === 'DATETIME_ASC' ? (
                          <>
                            <ArrowUp className="w-2.5 h-2.5" />
                            <span>Oldest</span>
                          </>
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account / Flow</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Flags</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSorted.map((t) => {
                  const isIncome = t.type === 'INCOME';
                  const isTransfer = t.type === 'TRANSFER';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-white">{formatDate(t.date)}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.time || '12:00'}</span>
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{t.description}</p>
                        {t.notes && <p className="text-[10px] text-slate-400 line-clamp-1">{t.notes}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isTransfer
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : isIncome
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {isTransfer ? (
                          <span className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                            {t.paymentMethod} → {t.toAccount || 'Account'}
                          </span>
                        ) : (
                          t.paymentMethod
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {isTransfer ? (
                          <span className="text-sky-600 dark:text-sky-400">
                            ↔ {formatPeso(t.amount)}
                          </span>
                        ) : (
                          <span className={isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                            {isIncome ? '+' : '-'}{formatPeso(t.amount)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {t.isShared && (
                            <span className="p-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-600" title="Shared Household Expense">
                              <Users className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {t.receiptUrl && (
                            <span className="p-1 rounded bg-sky-50 dark:bg-sky-950 text-sky-600" title="Receipt Attached">
                              <Image className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
