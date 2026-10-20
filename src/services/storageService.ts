import {
  Transaction,
  Category,
  PaymentMethod,
  BudgetLimit,
  SavingsGoal,
  RecurringBill,
  Installment,
  DebtLoan,
  PaydayAllocation,
  HouseholdMember,
  AuditLog,
  FinancialAccount,
  BudgetCycle
} from '../types';
import { supabaseDbService, AllUserData } from './supabaseService';
import { sortTransactionsByDateTime } from '../utils/formatters';

const STORAGE_PREFIX = 'iponta_';
const LEGACY_STORAGE_PREFIX = 'balanse_ph_';

// Clean, Generalized Default PH Categories
export const DEFAULT_CATEGORIES: Category[] = [
  // INCOME CATEGORIES
  {
    id: 'cat_salary',
    name: 'Salary & Wages',
    type: 'INCOME',
    iconName: 'Briefcase',
    colorHex: '#16A34A',
    subcategories: ['Base Salary', '13th Month & Bonuses', 'Overtime Pay'],
    description: 'Regular compensation, salary deposits, and employment wages'
  },
  {
    id: 'cat_freelance',
    name: 'Freelance & Side Hustles',
    type: 'INCOME',
    iconName: 'Laptop',
    colorHex: '#0D9488',
    subcategories: ['Client Projects', 'Consulting', 'Online Services'],
    description: 'Independent contract gigs, remote freelance earnings, and side hustles'
  },
  {
    id: 'cat_business',
    name: 'Business & Sales',
    type: 'INCOME',
    iconName: 'Store',
    colorHex: '#1D4ED8',
    subcategories: ['Retail Sales', 'Sari-Sari Store', 'Online Selling'],
    description: 'Enterprise revenue, commerce, e-commerce, and merchant sales'
  },
  {
    id: 'cat_investments',
    name: 'Investments & Dividends',
    type: 'INCOME',
    iconName: 'TrendingUp',
    colorHex: '#65A30D',
    subcategories: ['MP2 Dividends', 'Time Deposit Interest', 'Stocks & Mutual Funds'],
    description: 'Passive income, government savings dividends, and interest payouts'
  },
  {
    id: 'cat_remittance',
    name: 'Remittances & Allowances',
    type: 'INCOME',
    iconName: 'Send',
    colorHex: '#9333EA',
    subcategories: ['OFW Remittance', 'Family Allowance', 'Support Aid'],
    description: 'Money sent by overseas workers, family allowances, and financial gifts'
  },
  {
    id: 'cat_bonus',
    name: 'Bonuses & Grants',
    type: 'INCOME',
    iconName: 'Sparkles',
    colorHex: '#FBBF24',
    subcategories: ['Performance Bonus', 'Government Subsidies', 'Tax Refund'],
    description: 'Incentives, holiday gratuities, and monetary awards'
  },
  {
    id: 'cat_other_inc',
    name: 'Other Income',
    type: 'INCOME',
    iconName: 'DollarSign',
    colorHex: '#34D399',
    subcategories: ['Cashback', 'Reimbursements', 'Asset Sales'],
    description: 'Miscellaneous proceeds, cashbacks, and incidental revenues'
  },

  // EXPENSE CATEGORIES
  {
    id: 'cat_food',
    name: 'Food & Dining Out',
    type: 'EXPENSE',
    iconName: 'Utensils',
    colorHex: '#EA580C',
    subcategories: ['Fast Food', 'Carinderia / Local Eatery', 'Street Food / Merienda', 'Dine-in Restaurants', 'Food Delivery', 'Groceries & Ingredients', 'Snacks & Bakery'],
    description: 'Meals, food deliveries, street food, fast food, and social dining'
  },
  {
    id: 'cat_groceries',
    name: 'Groceries & Wet Market',
    type: 'EXPENSE',
    iconName: 'ShoppingCart',
    colorHex: '#059669',
    subcategories: ['Rice & Staples', 'Supermarket Supplies', 'Wet Market / Palengke', 'Household Supplies & Cleaning'],
    description: 'Weekly market supplies, rice, meat, veggies, and supermarket essentials'
  },
  {
    id: 'cat_utilities',
    name: 'Utilities & Monthly Bills',
    type: 'EXPENSE',
    iconName: 'Zap',
    colorHex: '#F59E0B',
    subcategories: ['Electricity Bill', 'Water Bill', 'Internet & Fiber', 'Mobile Load & Postpaid Plan'],
    description: 'Meralco electricity, water providers, fiber Wi-Fi, and telco bills'
  },
  {
    id: 'cat_housing',
    name: 'Rent & Housing',
    type: 'EXPENSE',
    iconName: 'Home',
    colorHex: '#2563EB',
    subcategories: ['House / Apartment Rent', 'Condo Association Dues', 'Home Maintenance & Repairs'],
    description: 'Apartment rent, lease payments, HOA dues, and house maintenance'
  },
  {
    id: 'cat_transport',
    name: 'Transportation & Fuel',
    type: 'EXPENSE',
    iconName: 'Car',
    colorHex: '#7C3AED',
    subcategories: ['Jeepney / Modern Jeep', 'Tricycle / Multicab', 'Bus / MRT / LRT', 'Ride-Hailing', 'Gasoline & Fuel', 'Toll & Parking'],
    description: 'Daily commuting fares, gas/fuel, expressway tolls, and vehicle maintenance'
  },
  {
    id: 'cat_health',
    name: 'Healthcare & Medicines',
    type: 'EXPENSE',
    iconName: 'Activity',
    colorHex: '#E11D48',
    subcategories: ['Pharmacy & Medicines', 'Doctor / Clinic Consult', 'HMO & Medical Insurance'],
    description: 'Pharmacy medications, medical consultations, dental, and health wellness'
  },
  {
    id: 'cat_installments',
    name: 'Installments & PayLater',
    type: 'EXPENSE',
    iconName: 'CreditCard',
    colorHex: '#4F46E5',
    subcategories: ['Shopee SPayLater', 'Lazada LazPayLater', 'TikTok PayLater', 'Atome Credit', 'Atome Cash Loan', 'GLoan / GCash', 'Credit Card Amortization', 'Home Credit'],
    description: 'BNPL installments, Buy-Now-Pay-Later dues, and financing plans'
  },
  {
    id: 'cat_debt',
    name: 'Loan Repayments',
    type: 'EXPENSE',
    iconName: 'Landmark',
    colorHex: '#475569',
    subcategories: ['Government Loan (SSS/Pag-IBIG)', 'Bank Loan', 'Personal Borrowings'],
    description: 'Amortization for SSS/Pag-IBIG salary loans, personal debts, and bank credit'
  },
  {
    id: 'cat_personal',
    name: 'Personal & Shopping',
    type: 'EXPENSE',
    iconName: 'ShoppingBag',
    colorHex: '#EC4899',
    subcategories: ['Apparel & Accessories', 'Personal Care & Grooming', 'Subscriptions & Streaming', 'Hobbies & Gifts'],
    description: 'Clothing, personal grooming, online shopping, and digital subscriptions'
  },
  {
    id: 'cat_education',
    name: 'Education & Learning',
    type: 'EXPENSE',
    iconName: 'GraduationCap',
    colorHex: '#06B6D4',
    subcategories: ['Tuition Fees', 'Books & School Supplies', 'Courses & Certifications'],
    description: 'School fees, supplies, review centers, and educational materials'
  },
  {
    id: 'cat_savings',
    name: 'Savings & Investments',
    type: 'EXPENSE',
    iconName: 'PiggyBank',
    colorHex: '#84CC16',
    subcategories: ['Emergency Reserve', 'Paluwagan / Savings Group', 'Time Deposit / MP2'],
    description: 'Fund transfers to emergency deposits, high-yield accounts, or savings goals'
  },
];

// Default Accounts / Storage Containers
export const DEFAULT_ACCOUNTS: FinancialAccount[] = [
  { id: 'acc_rcbc', userId: 'default', name: 'RCBC Bank', type: 'BANK', balance: 15000, accountNumberMasked: '**** 8892', isDefault: true },
  { id: 'acc_gcash', userId: 'default', name: 'GCash', type: 'E_WALLET', balance: 2850, isDefault: false },
  { id: 'acc_maya', userId: 'default', name: 'Maya Wallet', type: 'E_WALLET', balance: 1200, isDefault: false },
  { id: 'acc_bpi', userId: 'default', name: 'BPI Checking', type: 'BANK', balance: 8500, isDefault: false },
  { id: 'acc_cash', userId: 'default', name: 'Cash Wallet', type: 'CASH', balance: 1450, isDefault: false },
  { id: 'acc_atome', userId: 'default', name: 'Atome Credit', type: 'BNPL', balance: 0, creditLimit: 10000, isDefault: false },
];

function getKey(userId: string, keyName: string): string {
  return `${STORAGE_PREFIX}${userId}_${keyName}`;
}

export interface OfflineSyncItem {
  id: string;
  table: string;
  operation: 'UPSERT' | 'DELETE';
  payload?: any;
  timestamp: string;
}

export class StorageService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId || 'anonymous_user';
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(getKey(this.userId, key)) || localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${this.userId}_${key}`);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(getKey(this.userId, key), JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  // OFFLINE SYNCHRONIZATION QUEUE & STATUS
  getOfflineSyncQueue(): OfflineSyncItem[] {
    return this.get<OfflineSyncItem[]>('offline_sync_queue', []);
  }

  addToSyncQueue(table: string, operation: 'UPSERT' | 'DELETE', payload?: any): void {
    const queue = this.getOfflineSyncQueue();
    const item: OfflineSyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      table,
      operation,
      payload,
      timestamp: new Date().toISOString(),
    };
    queue.push(item);
    this.set('offline_sync_queue', queue);
    this.set('has_pending_sync', true);
    this.notifySyncStatus(false, queue.length);
  }

  clearSyncQueue(): void {
    this.set('offline_sync_queue', []);
    this.set('has_pending_sync', false);
    this.notifySyncStatus(false, 0);
  }

  hasPendingSync(): boolean {
    return this.get<boolean>('has_pending_sync', false) || this.getOfflineSyncQueue().length > 0;
  }

  getPendingSyncCount(): number {
    return this.getOfflineSyncQueue().length;
  }

  getLastSyncedAt(): string | null {
    return this.get<string | null>('last_synced_at', null);
  }

  setLastSyncedAt(timestamp: string): void {
    this.set('last_synced_at', timestamp);
  }

  notifySyncStatus(isSyncing: boolean, count?: number): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('iponta-sync-status', {
          detail: {
            isSyncing,
            pendingCount: typeof count === 'number' ? count : this.getPendingSyncCount(),
            lastSyncedAt: this.getLastSyncedAt(),
            userId: this.userId,
          },
        })
      );
    }
  }

  async syncPendingChanges(force: boolean = false): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    if (!isOnline) {
      return {
        success: false,
        syncedCount: this.getPendingSyncCount(),
        message: 'Device is offline. Changes are saved locally and will auto-sync when reconnected.',
      };
    }

    const pendingCount = this.getPendingSyncCount();
    if (!force && pendingCount === 0 && !this.hasPendingSync()) {
      return { success: true, syncedCount: 0, message: 'Already up to date' };
    }

    this.notifySyncStatus(true, pendingCount);

    try {
      const result = await this.pushAllLocalDataToSupabase();
      if (result.success) {
        this.clearSyncQueue();
        const now = new Date().toISOString();
        this.setLastSyncedAt(now);
        this.notifySyncStatus(false, 0);
        return { success: true, syncedCount: pendingCount, message: 'All offline changes synchronized successfully!' };
      } else {
        // If Supabase is unconfigured, mark local state as clear and complete
        this.clearSyncQueue();
        this.notifySyncStatus(false, 0);
        return { success: true, syncedCount: pendingCount, message: 'Local offline state up to date.' };
      }
    } catch (err: any) {
      console.warn('syncPendingChanges error:', err);
      this.notifySyncStatus(false, pendingCount);
      return { success: false, syncedCount: pendingCount, message: err?.message || 'Sync error' };
    }
  }

  isCleanStart(): boolean {
    return this.get<boolean>('is_clean_start', false);
  }

  markCleanStart(): void {
    this.set('is_clean_start', true);
  }

  // ACCOUNTS / MONEY STORAGE CONTAINERS
  getAccounts(): FinancialAccount[] {
    const list = this.get<FinancialAccount[]>('financial_accounts', []);
    if (list.length === 0 && !this.isCleanStart()) {
      const seeded = DEFAULT_ACCOUNTS.map(a => ({ ...a, userId: this.userId }));
      this.set('financial_accounts', seeded);
      return seeded;
    }
    return list;
  }

  saveAccount(account: FinancialAccount): FinancialAccount {
    const list = this.getAccounts();
    const idx = list.findIndex(a => a.id === account.id || a.name.toLowerCase() === account.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...account };
      this.addAuditLog('UPDATE', 'ACCOUNT', account.id, `Updated account: ${account.name}`, 'User');
    } else {
      list.push(account);
      this.addAuditLog('CREATE', 'ACCOUNT', account.id, `Created new account: ${account.name}`, 'User');
    }
    this.set('financial_accounts', list);
    this.addToSyncQueue('financial_accounts', 'UPSERT', account);
    supabaseDbService.upsertAccount(this.userId, account);
    return account;
  }

  deleteAccount(id: string): void {
    const list = this.getAccounts().filter(a => a.id !== id);
    this.set('financial_accounts', list);
    this.addAuditLog('DELETE', 'ACCOUNT', id, 'Deleted account container', 'User');
    this.addToSyncQueue('financial_accounts', 'DELETE', { id });
    supabaseDbService.deleteAccount(this.userId, id);
  }

  // Adjust account balance (liquid vs credit)
  private adjustAccountBalance(
    account: FinancialAccount,
    txType: 'INCOME' | 'EXPENSE',
    amount: number,
    isRevert: boolean = false
  ): void {
    const isCreditAccount = account.type === 'CREDIT_CARD' || account.type === 'BNPL';

    if (!isCreditAccount) {
      // Liquid Account: Income adds cash, Expense subtracts cash
      if (txType === 'INCOME') {
        account.balance += isRevert ? -amount : amount;
      } else {
        account.balance += isRevert ? amount : -amount;
      }
    } else {
      // Credit / BNPL Account: balance stores USED credit
      // Expense increases used credit (reduces available credit)
      // Income / Payment decreases used credit (restores available credit)
      if (txType === 'INCOME') {
        account.balance += isRevert ? amount : -amount;
      } else {
        account.balance += isRevert ? -amount : amount;
      }
      // Ensure balance doesn't go below 0 for used credit
      if (account.balance < 0) account.balance = 0;
    }
  }

  // Helper to adjust savings goal currentAmount on transaction impacts
  private adjustSavingsGoalBalance(
    targetName: string,
    amount: number,
    operation: 'DEPOSIT' | 'WITHDRAW'
  ): void {
    if (!targetName) return;
    const goals = this.getSavingsGoals();
    const cleanName = targetName.replace(/^(🎯\s*|Goal:\s*|Savings Goal:\s*)/i, '').trim().toLowerCase();
    const goalIndex = goals.findIndex(
      g => g.title.toLowerCase() === cleanName || 
           g.id.toLowerCase() === targetName.toLowerCase() ||
           targetName.toLowerCase().includes(g.title.toLowerCase())
    );

    if (goalIndex >= 0) {
      const goal = goals[goalIndex];
      if (operation === 'DEPOSIT') {
        goal.currentAmount += amount;
      } else {
        goal.currentAmount = Math.max(0, goal.currentAmount - amount);
      }
      this.set('savings_goals', goals);
      supabaseDbService.upsertSavingsGoal(this.userId, goal);
    }
  }

  // Unified helper to apply or revert transaction balance impacts (including Transfers and Savings Goals)
  private applyTransactionImpact(
    accounts: FinancialAccount[],
    tx: Transaction,
    isRevert: boolean
  ): void {
    if (tx.type === 'TRANSFER') {
      const fromAcc = accounts.find(a => a.name.toLowerCase() === tx.paymentMethod.toLowerCase());
      const toAcc = tx.toAccount ? accounts.find(a => a.name.toLowerCase() === tx.toAccount!.toLowerCase()) : undefined;

      if (fromAcc) {
        // Outflow from source account (treated as Expense on that account)
        this.adjustAccountBalance(fromAcc, 'EXPENSE', tx.amount, isRevert);
      } else {
        // Source is not a standard account - check if it's a savings goal
        this.adjustSavingsGoalBalance(tx.paymentMethod, tx.amount, isRevert ? 'DEPOSIT' : 'WITHDRAW');
      }

      if (toAcc) {
        // Inflow to destination account (treated as Income on that account)
        this.adjustAccountBalance(toAcc, 'INCOME', tx.amount, isRevert);
      } else if (tx.toAccount) {
        // Inflow to destination savings goal!
        this.adjustSavingsGoalBalance(tx.toAccount, tx.amount, isRevert ? 'WITHDRAW' : 'DEPOSIT');
      }
    } else {
      const accountObj = accounts.find(a => a.name.toLowerCase() === tx.paymentMethod.toLowerCase());
      if (accountObj) {
        this.adjustAccountBalance(accountObj, tx.type, tx.amount, isRevert);
      }
    }
  }

  // TRANSACTIONS & BALANCE ADJUSTMENTS
  getTransactions(): Transaction[] {
    const list = this.get<Transaction[]>('transactions', []);
    return sortTransactionsByDateTime(list, 'desc');
  }

  saveTransaction(transaction: Transaction, userName: string = 'User'): Transaction {
    const list = this.get<Transaction[]>('transactions', []);
    const accounts = this.getAccounts();

    const existingIndex = list.findIndex(t => t.id === transaction.id);
    let prevVal: string | undefined = undefined;

    if (existingIndex >= 0) {
      const oldTx = list[existingIndex];
      prevVal = JSON.stringify(oldTx);

      // Revert old transaction impact
      this.applyTransactionImpact(accounts, oldTx, true);

      // Apply new transaction impact
      this.applyTransactionImpact(accounts, transaction, false);

      list[existingIndex] = { ...transaction, updatedAt: new Date().toISOString() };
      this.addAuditLog('UPDATE', 'TRANSACTION', transaction.id, `Updated record: ${transaction.description} (₱${transaction.amount})`, userName, prevVal, JSON.stringify(transaction));
    } else {
      // New transaction impact
      this.applyTransactionImpact(accounts, transaction, false);

      list.push({ ...transaction, createdAt: transaction.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
      this.addAuditLog('CREATE', 'TRANSACTION', transaction.id, `Added ${transaction.type.toLowerCase()}: ${transaction.description} (₱${transaction.amount})`, userName, undefined, JSON.stringify(transaction));
    }

    // Always keep stored transactions properly sorted by chosen transaction date & time (latest at top)
    const sorted = sortTransactionsByDateTime(list, 'desc');

    this.set('financial_accounts', accounts);
    this.set('transactions', sorted);

    this.addToSyncQueue('transactions', 'UPSERT', transaction);
    accounts.forEach(a => this.addToSyncQueue('financial_accounts', 'UPSERT', a));

    // Live sync transaction and modified accounts to Supabase PostgreSQL
    supabaseDbService.upsertTransaction(this.userId, transaction, accounts);
    accounts.forEach(a => supabaseDbService.upsertAccount(this.userId, a));

    return transaction;
  }

  deleteTransaction(id: string, userName: string = 'User'): void {
    const list = this.getTransactions();
    const target = list.find(t => t.id === id);
    if (target) {
      const accounts = this.getAccounts();
      this.applyTransactionImpact(accounts, target, true);
      this.set('financial_accounts', accounts);

      const updated = list.filter(t => t.id !== id);
      this.set('transactions', updated);
      this.addAuditLog('DELETE', 'TRANSACTION', id, `Deleted transaction: ${target.description} (₱${target.amount})`, userName, JSON.stringify(target));

      this.addToSyncQueue('transactions', 'DELETE', { id });
      accounts.forEach(a => this.addToSyncQueue('financial_accounts', 'UPSERT', a));

      // Live delete in Supabase and update accounts
      supabaseDbService.deleteTransaction(this.userId, id);
      accounts.forEach(a => supabaseDbService.upsertAccount(this.userId, a));
    }
  }

  // Categories
  getCategories(): Category[] {
    const custom = this.get<Category[]>('custom_categories', []);
    return [...DEFAULT_CATEGORIES, ...custom];
  }

  saveCategory(category: Category): Category {
    const custom = this.get<Category[]>('custom_categories', []);
    const idx = custom.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      custom[idx] = { ...category, isCustom: true };
    } else {
      custom.push({ ...category, isCustom: true });
    }
    this.set('custom_categories', custom);
    this.addToSyncQueue('categories', 'UPSERT', category);
    supabaseDbService.upsertCategory(this.userId, category);
    return category;
  }

  deleteCategory(id: string): void {
    const custom = this.get<Category[]>('custom_categories', []).filter(c => c.id !== id);
    this.set('custom_categories', custom);
    this.addToSyncQueue('categories', 'DELETE', { id });
    supabaseDbService.deleteCategory(this.userId, id);
  }

  saveCustomCategory(category: Category): void {
    this.saveCategory(category);
  }

  // Derived Payment Methods from Accounts
  getPaymentMethods(): PaymentMethod[] {
    const accounts = this.getAccounts();
    return accounts.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      accountNumberMasked: a.accountNumberMasked,
    }));
  }

  // Budgets
  getBudgets(): BudgetLimit[] {
    return this.get<BudgetLimit[]>('budgets', []);
  }

  saveBudget(budget: BudgetLimit): void {
    const list = this.getBudgets();
    const index = list.findIndex(b => {
      if (budget.id && b.id === budget.id) return true;
      if (budget.cycleId && b.cycleId === budget.cycleId && b.categoryId === budget.categoryId) return true;
      const bMonth = b.month || 'default';
      const newMonth = budget.month || 'default';
      return b.categoryId === budget.categoryId && b.period === budget.period && bMonth === newMonth;
    });

    if (index >= 0) {
      list[index] = budget;
    } else {
      list.push(budget);
    }
    this.set('budgets', list);
    this.addToSyncQueue('budget_limits', 'UPSERT', budget);
    supabaseDbService.upsertBudget(this.userId, budget);
  }

  deleteBudget(budgetId: string): void {
    const list = this.getBudgets().filter(b => b.id !== budgetId);
    this.set('budgets', list);
    this.addToSyncQueue('budget_limits', 'DELETE', { id: budgetId });
    supabaseDbService.deleteBudget(this.userId, budgetId);
  }

  saveBudgetsBulk(budgetsToSave: BudgetLimit[]): void {
    const list = this.getBudgets();
    budgetsToSave.forEach(newB => {
      const idx = list.findIndex(b => {
        if (newB.id && b.id === newB.id) return true;
        if (newB.cycleId && b.cycleId === newB.cycleId && b.categoryId === newB.categoryId) return true;
        const bMonth = b.month || 'default';
        const newMonth = newB.month || 'default';
        return b.categoryId === newB.categoryId && b.period === newB.period && bMonth === newMonth;
      });
      if (idx >= 0) {
        list[idx] = newB;
      } else {
        list.push(newB);
      }
      this.addToSyncQueue('budget_limits', 'UPSERT', newB);
      supabaseDbService.upsertBudget(this.userId, newB);
    });
    this.set('budgets', list);
  }

  // Budget Cycles (Monthly & Philippine Cutoff Cycles)
  getBudgetCycles(): BudgetCycle[] {
    const stored = this.get<BudgetCycle[]>('budget_cycles', []);
    if (stored.length > 0) return stored;

    // Seed initial current month cutoff cycles (1st-15th, 16th-EOM) and Monthly for clean out-of-the-box experience
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const lastDay = new Date(year, month + 1, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const monthStr = pad(month + 1);

    const defaultCycles: BudgetCycle[] = [
      {
        id: `cycle_cutoff1_${year}_${monthStr}`,
        userId: this.userId,
        name: `${now.toLocaleString('default', { month: 'short' })} 1-15 Cutoff`,
        cycleType: 'BI_WEEKLY',
        startDate: `${year}-${monthStr}-01`,
        endDate: `${year}-${monthStr}-15`,
        cutoffDay1: 15,
        cutoffDay2: lastDay,
        incomeAmount: 25000,
        isActive: now.getDate() <= 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: `cycle_cutoff2_${year}_${monthStr}`,
        userId: this.userId,
        name: `${now.toLocaleString('default', { month: 'short' })} 16-${lastDay} Cutoff`,
        cycleType: 'BI_WEEKLY',
        startDate: `${year}-${monthStr}-16`,
        endDate: `${year}-${monthStr}-${pad(lastDay)}`,
        cutoffDay1: 15,
        cutoffDay2: lastDay,
        incomeAmount: 25000,
        isActive: now.getDate() > 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: `cycle_month_${year}_${monthStr}`,
        userId: this.userId,
        name: `${now.toLocaleString('default', { month: 'long' })} ${year} (Full Month)`,
        cycleType: 'MONTHLY',
        startDate: `${year}-${monthStr}-01`,
        endDate: `${year}-${monthStr}-${pad(lastDay)}`,
        incomeAmount: 50000,
        isActive: false,
        createdAt: new Date().toISOString(),
      }
    ];

    this.set('budget_cycles', defaultCycles);
    return defaultCycles;
  }

  saveBudgetCycle(cycle: BudgetCycle): BudgetCycle {
    const list = this.getBudgetCycles();
    const idx = list.findIndex(c => c.id === cycle.id);
    if (idx >= 0) {
      list[idx] = { ...cycle, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...cycle, createdAt: new Date().toISOString() });
    }
    this.set('budget_cycles', list);
    this.addToSyncQueue('budget_cycles', 'UPSERT', cycle);
    return cycle;
  }

  deleteBudgetCycle(cycleId: string): void {
    const list = this.getBudgetCycles().filter(c => c.id !== cycleId);
    this.set('budget_cycles', list);
    // Also remove cycle-specific budgets
    const budgets = this.getBudgets().filter(b => b.cycleId !== cycleId);
    this.set('budgets', budgets);
    this.addToSyncQueue('budget_cycles', 'DELETE', { id: cycleId });
  }

  // Savings Goals
  getSavingsGoals(): SavingsGoal[] {
    return this.get<SavingsGoal[]>('savings_goals', []);
  }

  saveSavingsGoal(goal: SavingsGoal): void {
    const list = this.getSavingsGoals();
    const index = list.findIndex(g => g.id === goal.id);
    if (index >= 0) {
      list[index] = goal;
    } else {
      list.push(goal);
    }
    this.set('savings_goals', list);
    this.addToSyncQueue('savings_goals', 'UPSERT', goal);
    supabaseDbService.upsertSavingsGoal(this.userId, goal);
  }

  deleteSavingsGoal(id: string): void {
    const list = this.getSavingsGoals().filter(g => g.id !== id);
    this.set('savings_goals', list);
    this.addToSyncQueue('savings_goals', 'DELETE', { id });
    supabaseDbService.deleteSavingsGoal(this.userId, id);
  }

  // Recurring Bills
  getRecurringBills(): RecurringBill[] {
    return this.get<RecurringBill[]>('recurring_bills', []);
  }

  saveRecurringBill(bill: RecurringBill): void {
    const list = this.getRecurringBills();
    const index = list.findIndex(b => b.id === bill.id);
    if (index >= 0) {
      list[index] = bill;
    } else {
      list.push(bill);
    }
    this.set('recurring_bills', list);
    this.addToSyncQueue('recurring_bills', 'UPSERT', bill);
    supabaseDbService.upsertRecurringBill(this.userId, bill);
  }

  deleteRecurringBill(id: string): void {
    const list = this.getRecurringBills().filter(b => b.id !== id);
    this.set('recurring_bills', list);
    this.addToSyncQueue('recurring_bills', 'DELETE', { id });
    supabaseDbService.deleteRecurringBill(this.userId, id);
  }

  // Installments
  getInstallments(): Installment[] {
    return this.get<Installment[]>('installments', []);
  }

  saveInstallment(installment: Installment): void {
    const list = this.getInstallments();
    const index = list.findIndex(i => i.id === installment.id);
    if (index >= 0) {
      list[index] = installment;
    } else {
      list.push(installment);
    }
    this.set('installments', list);
    this.addToSyncQueue('installments', 'UPSERT', installment);
    supabaseDbService.upsertInstallment(this.userId, installment);
  }

  deleteInstallment(id: string): void {
    const list = this.getInstallments().filter(i => i.id !== id);
    this.set('installments', list);
    this.addToSyncQueue('installments', 'DELETE', { id });
    supabaseDbService.deleteInstallment(this.userId, id);
  }

  // Debts & Loans
  getDebts(): DebtLoan[] {
    return this.get<DebtLoan[]>('debts', []);
  }

  saveDebt(debt: DebtLoan): void {
    const list = this.getDebts();
    const index = list.findIndex(d => d.id === debt.id);
    if (index >= 0) {
      list[index] = debt;
    } else {
      list.push(debt);
    }
    this.set('debts', list);
    this.addToSyncQueue('debt_loans', 'UPSERT', debt);
    supabaseDbService.upsertDebt(this.userId, debt);
  }

  deleteDebt(id: string): void {
    const list = this.getDebts().filter(d => d.id !== id);
    this.set('debts', list);
    this.addToSyncQueue('debt_loans', 'DELETE', { id });
    supabaseDbService.deleteDebt(this.userId, id);
  }

  // Payday Allocations
  getPaydayAllocations(): PaydayAllocation[] {
    return this.get<PaydayAllocation[]>('payday_allocations', []);
  }

  savePaydayAllocation(alloc: PaydayAllocation): void {
    const list = this.getPaydayAllocations();
    list.unshift(alloc);
    this.set('payday_allocations', list);
    this.addToSyncQueue('payday_allocations', 'UPSERT', alloc);
    supabaseDbService.upsertPaydayAllocation(this.userId, alloc);
  }

  // Household Members
  getHouseholdMembers(): HouseholdMember[] {
    return this.get<HouseholdMember[]>('household_members', [
      { id: 'm1', name: 'You (Primary)', role: 'PRIMARY', incomeContributionRatio: 0.5 },
      { id: 'm2', name: 'Partner / Roommate', role: 'PARTNER', incomeContributionRatio: 0.5 },
    ]);
  }

  saveHouseholdMembers(members: HouseholdMember[]): void {
    this.set('household_members', members);
    members.forEach(m => this.addToSyncQueue('household_members', 'UPSERT', m));
    supabaseDbService.upsertHouseholdMembers(this.userId, members);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', []);
  }

  private addAuditLog(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'EXPORTS',
    entityType: 'TRANSACTION' | 'BUDGET' | 'SAVINGS' | 'BILL' | 'INSTALLMENT' | 'DEBT' | 'PAYDAY' | 'ACCOUNT',
    entityId: string,
    summary: string,
    userName: string,
    previousValue?: string,
    newValue?: string
  ): void {
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId: this.userId,
      userName,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      summary,
      previousValue,
      newValue,
    };
    logs.unshift(log);
    this.set('audit_logs', logs.slice(0, 200));
    supabaseDbService.insertAuditLog(this.userId, log);
  }

  // Backup & Restore
  exportBackupData(): string {
    const full = {
      userId: this.userId,
      exportTimestamp: new Date().toISOString(),
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      budgets: this.getBudgets(),
      savingsGoals: this.getSavingsGoals(),
      recurringBills: this.getRecurringBills(),
      installments: this.getInstallments(),
      debts: this.getDebts(),
      paydayAllocations: this.getPaydayAllocations(),
      householdMembers: this.getHouseholdMembers(),
      auditLogs: this.getAuditLogs(),
    };
    this.addAuditLog('EXPORTS', 'TRANSACTION', 'backup', 'Exported full JSON financial backup', 'User');
    return JSON.stringify(full, null, 2);
  }

  importBackupData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.accounts)) this.set('financial_accounts', data.accounts);
      if (Array.isArray(data.transactions)) this.set('transactions', data.transactions);
      if (Array.isArray(data.budgets)) this.set('budgets', data.budgets);
      if (Array.isArray(data.savingsGoals)) this.set('savings_goals', data.savingsGoals);
      if (Array.isArray(data.recurringBills)) this.set('recurring_bills', data.recurringBills);
      if (Array.isArray(data.installments)) this.set('installments', data.installments);
      if (Array.isArray(data.debts)) this.set('debts', data.debts);
      if (Array.isArray(data.paydayAllocations)) this.set('payday_allocations', data.paydayAllocations);
      if (Array.isArray(data.householdMembers)) this.set('household_members', data.householdMembers);

      this.addAuditLog('SYNC', 'TRANSACTION', 'restore', 'Restored financial backup from JSON file', 'User');
      return { success: true, message: 'Financial backup restored successfully!' };
    } catch (e: any) {
      return { success: false, message: 'Invalid backup JSON file: ' + e.message };
    }
  }

  // Seed initial sample data for PH context ONLY if clean start is not marked AND not an existing user
  seedSamplePHData(userName: string = 'User'): void {
    if (this.isCleanStart()) {
      return; // Do NOT seed sample data if user chose clean start or reset to zero!
    }
    // Verified or existing users must never have sample data seeded over their existing setup
    try {
      if (typeof localStorage !== 'undefined') {
        const isExisting = localStorage.getItem(`iponta_is_existing_user_${this.userId}`) === 'true' ||
                           localStorage.getItem(`iponta_prompted_fresh_${this.userId}`) === 'true';
        if (isExisting) return;
      }
    } catch {}

    if (this.getTransactions().length > 0) return;

    const sampleAccounts: FinancialAccount[] = [
      { id: 'acc_rcbc', userId: this.userId, name: 'RCBC Bank', type: 'BANK', balance: 15000, accountNumberMasked: '**** 8892', isDefault: true },
      { id: 'acc_gcash', userId: this.userId, name: 'GCash', type: 'E_WALLET', balance: 2850, isDefault: false },
      { id: 'acc_maya', userId: this.userId, name: 'Maya Wallet', type: 'E_WALLET', balance: 1200, isDefault: false },
      { id: 'acc_bpi', userId: this.userId, name: 'BPI Checking', type: 'BANK', balance: 8500, isDefault: false },
      { id: 'acc_cash', userId: this.userId, name: 'Cash Wallet', type: 'CASH', balance: 1450, isDefault: false },
      { id: 'acc_atome', userId: this.userId, name: 'Atome Credit', type: 'BNPL', balance: 0, creditLimit: 10000, isDefault: false },
    ];
    this.set('financial_accounts', sampleAccounts);

    const sampleTransactions: Transaction[] = [
      {
        id: 't_sal_1',
        userId: this.userId,
        type: 'INCOME',
        amount: 15000,
        category: 'Salary & Income',
        subcategory: 'Base Salary',
        paymentMethod: 'RCBC Bank',
        date: '2026-10-01',
        time: '09:00',
        description: '15th Salary Deposit',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't_gcash_1',
        userId: this.userId,
        type: 'INCOME',
        amount: 500,
        category: 'Salary & Income',
        subcategory: 'Freelance / Side Gig',
        paymentMethod: 'GCash',
        date: '2026-10-02',
        time: '11:15',
        description: 'Received GCash Padala',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't_rent_1',
        userId: this.userId,
        type: 'EXPENSE',
        amount: 8000,
        category: 'Rent & Housing',
        subcategory: 'House / Apartment Rent',
        paymentMethod: 'BPI Checking',
        date: '2026-10-02',
        time: '14:30',
        description: 'Apartment Rent Payment',
        isShared: true,
        sharedSplitRatio: 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't_elec_1',
        userId: this.userId,
        type: 'EXPENSE',
        amount: 2800,
        category: 'Utilities & Monthly Bills',
        subcategory: 'Electricity Bill',
        paymentMethod: 'GCash',
        date: '2026-10-03',
        time: '10:45',
        description: 'Meralco Electric Bill',
        isShared: true,
        sharedSplitRatio: 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't_food_1',
        userId: this.userId,
        type: 'EXPENSE',
        amount: 250,
        category: 'Food & Dining Out',
        subcategory: 'Street Food / Merienda',
        paymentMethod: 'Cash Wallet',
        date: '2026-10-04',
        time: '17:20',
        description: 'Merienda Street Food',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    this.set('transactions', sortTransactionsByDateTime(sampleTransactions, 'desc'));

    const sampleBills: RecurringBill[] = [
      { id: 'rb_meralco', userId: this.userId, title: 'Meralco Electric Bill', amount: 2800, dueDateDay: 18, category: 'Utilities & Monthly Bills', paymentMethod: 'GCash', autoRemind: true, isPaidThisMonth: true },
      { id: 'rb_converge', userId: this.userId, title: 'Converge Fiber Internet', amount: 1500, dueDateDay: 22, category: 'Utilities & Monthly Bills', paymentMethod: 'Maya Wallet', autoRemind: true, isPaidThisMonth: false },
    ];
    this.set('recurring_bills', sampleBills);

    const sampleInstallments: Installment[] = [
      { id: 'inst_spay', userId: this.userId, merchantName: 'Shopee SPayLater', itemName: 'Inverter Aircon 1.0HP', totalAmount: 18990, monthlyPayment: 2142.71, totalMonths: 12, paidMonths: 5, startDate: '2026-05-01', paymentMethod: 'GCash', category: 'Installments & PayLater', interestRatePercent: 2.95, interestRateType: 'MONTHLY', interestCalculationType: 'ADD_ON', totalInterestAmount: 6722.46, totalPayableAmount: 25712.46 },
      { id: 'inst_tiktok', userId: this.userId, merchantName: 'TikTok PayLater', itemName: 'Wireless Earbuds', totalAmount: 2400, monthlyPayment: 800, totalMonths: 3, paidMonths: 1, startDate: '2026-09-15', paymentMethod: 'GCash', category: 'Installments & PayLater', interestRatePercent: 0, interestRateType: 'MONTHLY', totalInterestAmount: 0, totalPayableAmount: 2400 },
      { id: 'inst_atome', userId: this.userId, merchantName: 'Atome Credit', itemName: 'Work Desk Chair', totalAmount: 4500, monthlyPayment: 1500, totalMonths: 3, paidMonths: 2, startDate: '2026-08-01', paymentMethod: 'Atome Credit', category: 'Installments & PayLater', interestRatePercent: 0, interestRateType: 'MONTHLY', totalInterestAmount: 0, totalPayableAmount: 4500 },
    ];
    this.set('installments', sampleInstallments);

    const sampleDebts: DebtLoan[] = [
      { id: 'debt_sss', userId: this.userId, partyName: 'SSS Salary Loan', type: 'I_OWE', originalAmount: 30000, remainingAmount: 14500, monthlyAmortization: 1250, dueDate: '2027-10-01', interestRatePercent: 10, notes: 'Deducted from salary' },
    ];
    this.set('debts', sampleDebts);

    const sampleGoals: SavingsGoal[] = [
      { id: 'sg_emergency', userId: this.userId, title: 'Emergency Reserve Fund', targetAmount: 60000, currentAmount: 25000, targetDate: '2026-12-31', monthlyTargetContribution: 5000, iconName: 'Shield', colorHex: '#2E7D5B' },
    ];
    this.set('savings_goals', sampleGoals);

    this.addAuditLog('CREATE', 'ACCOUNT', 'seed', 'Initialized money accounts and initial balance allocations', userName);

    // Push initial seeded data directly to Supabase PostgreSQL so other tables are populated immediately!
    this.pushAllLocalDataToSupabase().catch(err => {
      console.warn('Initial Supabase push warning:', err);
    });
  }

  // Reset / Clear all recorded financial data to zero for fresh start
  resetAllDataToZero(userName: string = 'User'): void {
    // Mark clean start so seedSamplePHData will NEVER re-populate sample data
    this.set('is_clean_start', true);

    // Clear transactions
    this.set('transactions', []);

    // Reset default accounts balances & used credit to zero
    const defaultZeroAccounts: FinancialAccount[] = [
      { id: 'acc_rcbc', userId: this.userId, name: 'RCBC Bank', type: 'BANK', balance: 0, accountNumberMasked: '**** 8892', isDefault: true },
      { id: 'acc_gcash', userId: this.userId, name: 'GCash', type: 'E_WALLET', balance: 0, isDefault: false },
      { id: 'acc_maya', userId: this.userId, name: 'Maya Wallet', type: 'E_WALLET', balance: 0, isDefault: false },
      { id: 'acc_bpi', userId: this.userId, name: 'BPI Checking', type: 'BANK', balance: 0, isDefault: false },
      { id: 'acc_cash', userId: this.userId, name: 'Cash Wallet', type: 'CASH', balance: 0, isDefault: false },
      { id: 'acc_atome', userId: this.userId, name: 'Atome Credit', type: 'BNPL', balance: 0, creditLimit: 10000, isDefault: false },
    ];
    this.set('financial_accounts', defaultZeroAccounts);

    // Clear budgets, bills, installments, debts, savings, payday allocations
    this.set('budgets', []);
    this.set('recurring_bills', []);
    this.set('installments', []);
    this.set('debts', []);
    this.set('savings_goals', []);
    this.set('payday_allocations', []);

    this.addAuditLog('DELETE', 'TRANSACTION', 'reset_all', 'Reset all transactions, budgets, bills, and balances to zero for fresh start', userName);
    this.addToSyncQueue('all', 'DELETE');

    // Live reset in Supabase PostgreSQL: wipe records and push 0-balance accounts
    supabaseDbService.resetAllUserDataInSupabase(this.userId).then(() => {
      defaultZeroAccounts.forEach(a => supabaseDbService.upsertAccount(this.userId, a));
    }).catch(err => {
      console.warn('Supabase reset warning:', err);
    });
  }

  // Two-way synchronization with Supabase PostgreSQL
  async pullFromSupabase(): Promise<boolean> {
    try {
      const remoteData = await supabaseDbService.fetchUserData(this.userId);
      if (!remoteData) return false;

      // Check if remote already contains records
      const hasRemoteData = remoteData.accounts.length > 0 || remoteData.transactions.length > 0;

      if (hasRemoteData) {
        if (remoteData.accounts.length > 0) this.set('financial_accounts', remoteData.accounts);
        if (remoteData.transactions.length > 0) this.set('transactions', remoteData.transactions);
        if (remoteData.categories.length > 0) {
          const customOnly = remoteData.categories.filter(c => c.isCustom);
          if (customOnly.length > 0) this.set('custom_categories', customOnly);
        }
        if (remoteData.budgets.length > 0) this.set('budgets', remoteData.budgets);
        if (remoteData.savingsGoals.length > 0) this.set('savings_goals', remoteData.savingsGoals);
        if (remoteData.recurringBills.length > 0) this.set('recurring_bills', remoteData.recurringBills);
        if (remoteData.installments.length > 0) this.set('installments', remoteData.installments);
        if (remoteData.debts.length > 0) this.set('debts', remoteData.debts);
        if (remoteData.paydayAllocations.length > 0) this.set('payday_allocations', remoteData.paydayAllocations);
        if (remoteData.householdMembers.length > 0) this.set('household_members', remoteData.householdMembers);
        return true;
      } else {
        // Supabase tables are currently empty for this user!
        // Immediately push all user accounts, transactions, and tables to Supabase!
        await this.pushAllLocalDataToSupabase();
        return false;
      }
    } catch (e) {
      console.warn('pullFromSupabase error:', e);
      return false;
    }
  }

  async pushAllLocalDataToSupabase(): Promise<{ success: boolean; message: string }> {
    const fullData: AllUserData = {
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      savingsGoals: this.getSavingsGoals(),
      recurringBills: this.getRecurringBills(),
      installments: this.getInstallments(),
      debts: this.getDebts(),
      paydayAllocations: this.getPaydayAllocations(),
      householdMembers: this.getHouseholdMembers(),
      auditLogs: this.getAuditLogs(),
    };
    return await supabaseDbService.syncAllDataToSupabase(this.userId, fullData);
  }

  async updateUserProfile(profile: { id: string; email: string; username: string; householdName?: string; currencySymbol?: string }): Promise<{ success: boolean; message?: string }> {
    // 1. Update registered accounts vault in local storage so subsequent logins with new username work offline & online
    try {
      const REGISTERED_ACCOUNTS_KEY = 'iponta_registered_accounts';
      const LEGACY_ACCOUNTS_KEY = 'balanse_ph_registered_accounts';
      const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_ACCOUNTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      let updated = false;

      for (let i = 0; i < list.length; i++) {
        if (list[i].id === profile.id || list[i].email.toLowerCase() === profile.email.toLowerCase()) {
          list[i].username = profile.username;
          list[i].email = profile.email; // Email remains constant
          updated = true;
          break;
        }
      }

      if (!updated && profile.id) {
        list.push({
          id: profile.id,
          email: profile.email,
          username: profile.username,
          passwordHash: '', // Will be matched or updated
        });
      }

      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to update local registered accounts:', e);
    }

    // 2. Add audit log
    this.addAuditLog('UPDATE', 'ACCOUNT', profile.id, `Updated username to "${profile.username}"`, profile.username);

    // 3. Persist to Supabase profiles table
    return await supabaseDbService.upsertUserProfile(this.userId, {
      username: profile.username,
      email: profile.email,
      householdName: profile.householdName,
      currencySymbol: profile.currencySymbol,
    });
  }
}
