import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { Transaction, FinancialAccount, RecurringBill, Installment } from '../src/types';
import fs from 'fs';
import path from 'path';

describe('Offline-First Architecture & Automatic Synchronization Engine', () => {
  const testUserId = 'test_offline_user_' + Date.now();
  let storage: StorageService;
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => { mockStore[key] = value; },
      removeItem: (key: string) => { delete mockStore[key]; },
      clear: () => { mockStore = {}; },
    };
    // Attach to globalThis so StorageService in Node test environment can access it
    (globalThis as any).localStorage = mockLocalStorage;
    storage = new StorageService(testUserId);
  });

  it('immediately persists mutations to local storage and enqueues into offline sync queue', () => {
    expect(storage.hasPendingSync()).toBe(false);
    expect(storage.getPendingSyncCount()).toBe(0);

    const testTx: Transaction = {
      id: 'tx_offline_1',
      userId: testUserId,
      type: 'EXPENSE',
      amount: 450,
      category: 'Food & Dining Out',
      subcategory: 'Carinderia / Local Eatery',
      paymentMethod: 'Cash Wallet',
      date: '2026-10-19',
      time: '12:30',
      description: 'Offline Lunch Merienda',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveTransaction(testTx, 'Offline Tester');

    // 1. Transaction must be immediately readable from local storage
    const transactions = storage.getTransactions();
    expect(transactions.length).toBeGreaterThan(0);
    const found = transactions.find(t => t.id === 'tx_offline_1');
    expect(found).toBeDefined();
    expect(found?.amount).toBe(450);

    // 2. Offline sync queue must record the pending changes
    expect(storage.hasPendingSync()).toBe(true);
    expect(storage.getPendingSyncCount()).toBeGreaterThan(0);

    const queue = storage.getOfflineSyncQueue();
    const txQueueItem = queue.find(q => q.table === 'transactions' && q.operation === 'UPSERT');
    expect(txQueueItem).toBeDefined();
    expect(txQueueItem?.payload.id).toBe('tx_offline_1');
  });

  it('accumulates multiple offline mutations across accounts, budgets, bills, and installments safely', () => {
    const testAccount: FinancialAccount = {
      id: 'acc_offline_gcash',
      userId: testUserId,
      name: 'Offline GCash',
      type: 'E_WALLET',
      balance: 5000,
      isDefault: false,
    };
    storage.saveAccount(testAccount);

    const testBill: RecurringBill = {
      id: 'rb_offline_pldt',
      userId: testUserId,
      title: 'PLDT Home Fiber',
      amount: 1899,
      dueDateDay: 15,
      category: 'Utilities & Monthly Bills',
      paymentMethod: 'Offline GCash',
      autoRemind: true,
      isPaidThisMonth: false,
    };
    storage.saveRecurringBill(testBill);

    const testInstallment: Installment = {
      id: 'inst_offline_phone',
      userId: testUserId,
      merchantName: 'Home Credit',
      itemName: 'Smartphone Upgrade',
      totalAmount: 12000,
      monthlyPayment: 2000,
      totalMonths: 6,
      paidMonths: 2,
      startDate: '2026-08-01',
      paymentMethod: 'Offline GCash',
      category: 'Installments & PayLater',
      interestRatePercent: 0,
      interestRateType: 'MONTHLY',
      totalInterestAmount: 0,
      totalPayableAmount: 12000,
    };
    storage.saveInstallment(testInstallment);

    // Verify all records exist locally
    expect(storage.getAccounts().some(a => a.id === 'acc_offline_gcash')).toBe(true);
    expect(storage.getRecurringBills().some(b => b.id === 'rb_offline_pldt')).toBe(true);
    expect(storage.getInstallments().some(i => i.id === 'inst_offline_phone')).toBe(true);

    // Verify queue captured all entities
    const queue = storage.getOfflineSyncQueue();
    expect(queue.some(q => q.table === 'financial_accounts')).toBe(true);
    expect(queue.some(q => q.table === 'recurring_bills')).toBe(true);
    expect(queue.some(q => q.table === 'installments')).toBe(true);
    expect(storage.getPendingSyncCount()).toBeGreaterThanOrEqual(3);
  });

  it('clears queue and records sync timestamp when synchronization completes', async () => {
    storage.saveAccount({
      id: 'acc_sync_test',
      userId: testUserId,
      name: 'Maya Test',
      type: 'E_WALLET',
      balance: 1500,
    });

    expect(storage.hasPendingSync()).toBe(true);
    const countBefore = storage.getPendingSyncCount();
    expect(countBefore).toBeGreaterThan(0);

    // Mock pushAllLocalDataToSupabase to simulate successful database sync
    vi.spyOn(storage, 'pushAllLocalDataToSupabase').mockResolvedValue({
      success: true,
      message: 'Successfully synced all records',
    });

    const syncResult = await storage.syncPendingChanges(true);
    expect(syncResult.success).toBe(true);
    expect(syncResult.syncedCount).toBe(countBefore);

    // Queue must be cleared
    expect(storage.hasPendingSync()).toBe(false);
    expect(storage.getPendingSyncCount()).toBe(0);
    expect(storage.getLastSyncedAt()).not.toBeNull();
  });

  it('verifies Workbox service worker configuration in vite.config.ts guarantees offline fallback', () => {
    const rootDir = path.resolve(__dirname, '..');
    const viteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf-8');

    expect(viteConfig).toContain("navigateFallback: '/index.html'");
    expect(viteConfig).toContain('navigateFallbackDenylist:');
    expect(viteConfig).toContain('google-fonts-cache');
    expect(viteConfig).toContain('gstatic-fonts-cache');
  });
});
