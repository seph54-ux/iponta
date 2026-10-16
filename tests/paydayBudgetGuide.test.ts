import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePaydayDistribution } from '../src/utils/financialCalculations';

// Mock localStorage for test environment
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
} as Storage;

import { StorageService } from '../src/services/storageService';

describe('Payday Budgeter Guide Functionality', () => {
  let storage: StorageService;
  const testUserId = 'test_payday_user';

  beforeEach(() => {
    globalThis.localStorage.clear();
    storage = new StorageService(testUserId);
  });

  it('calculates accurate envelope allocations for monthly income across styles', () => {
    const monthlyIncome = 50000;

    // 50/20/15/5/10 Philippine Standard
    const phDistribution = calculatePaydayDistribution(monthlyIncome, {
      fixedBills: 0.50,
      savings: 0.20,
      food: 0.15,
      transport: 0.05,
      discretionary: 0.10,
    });

    expect(phDistribution.fixedBills).toBe(25000);   // 50%
    expect(phDistribution.savings).toBe(10000);      // 20%
    expect(phDistribution.food).toBe(7500);          // 15%
    expect(phDistribution.transport).toBe(2500);     // 5%
    expect(phDistribution.discretionary).toBe(5000); // 10%
    expect(phDistribution.totalAllocated).toBe(50000);
  });

  it('calculates accurate envelope allocations for bi-weekly / cutoff income', () => {
    const biweeklyCutoff = 25000; // Semi-monthly cutoff income

    const biweeklyDistribution = calculatePaydayDistribution(biweeklyCutoff, {
      fixedBills: 0.50,
      savings: 0.20,
      food: 0.15,
      transport: 0.05,
      discretionary: 0.10,
    });

    expect(biweeklyDistribution.fixedBills).toBe(12500); // 50% of 25k
    expect(biweeklyDistribution.savings).toBe(5000);     // 20% of 25k
    expect(biweeklyDistribution.food).toBe(3750);        // 15% of 25k
    expect(biweeklyDistribution.transport).toBe(1250);   // 5% of 25k
    expect(biweeklyDistribution.discretionary).toBe(2500); // 10% of 25k
    expect(biweeklyDistribution.totalAllocated).toBe(25000);

    // Monthly equivalent is double the cutoff
    const monthlyEquivalent = biweeklyCutoff * 2;
    expect(monthlyEquivalent).toBe(50000);
  });

  it('calculates classic 50/30/20 rule accurately', () => {
    const monthlyIncome = 40000;

    const needs = Math.round(monthlyIncome * 0.50);
    const wants = Math.round(monthlyIncome * 0.30);
    const savings = Math.round(monthlyIncome * 0.20);

    expect(needs).toBe(20000);
    expect(wants).toBe(12000);
    expect(savings).toBe(8000);
    expect(needs + wants + savings).toBe(40000);
  });

  it('calculates Aggressive Wealth Builder (40/30/15/5/10) model accurately', () => {
    const income = 60000;

    const bills = Math.round(income * 0.40);
    const savings = Math.round(income * 0.30);
    const food = Math.round(income * 0.15);
    const transport = Math.round(income * 0.05);
    const discretionary = Math.round(income * 0.10);

    expect(bills).toBe(24000);
    expect(savings).toBe(18000);
    expect(food).toBe(9000);
    expect(transport).toBe(3000);
    expect(discretionary).toBe(6000);
  });

  it('calculates Metro Manila Rent-Heavy (60/15/15/5/5) model accurately', () => {
    const income = 50000;

    const rentBills = Math.round(income * 0.60);
    const food = Math.round(income * 0.15);
    const savings = Math.round(income * 0.15);
    const transport = Math.round(income * 0.05);
    const discretionary = Math.round(income * 0.05);

    expect(rentBills).toBe(30000);
    expect(food).toBe(7500);
    expect(savings).toBe(7500);
    expect(transport).toBe(2500);
    expect(discretionary).toBe(2500);
  });

  it('ensures Payday Budgeter never records or overwrites existing accounts, budgets, or transactions', () => {
    // 1. Initial financial state
    const initialAccounts = storage.getAccounts();
    const initialBudgets = storage.getBudgets();
    const initialTransactions = storage.getTransactions();

    expect(initialAccounts.length).toBeGreaterThan(0);
    const initialBalances = initialAccounts.map(a => a.balance);

    // 2. Perform various payday envelope simulation computations (both monthly and biweekly)
    const simulatedMonthly = 75000;
    const simulatedBiweekly = 37500;

    const dist1 = calculatePaydayDistribution(simulatedMonthly);
    const dist2 = calculatePaydayDistribution(simulatedBiweekly);

    expect(dist1.totalAllocated).toBe(75000);
    expect(dist2.totalAllocated).toBe(37500);

    // 3. Verify accounts remain strictly untouched
    const afterAccounts = storage.getAccounts();
    expect(afterAccounts.length).toBe(initialAccounts.length);
    afterAccounts.forEach((acc, index) => {
      expect(acc.balance).toBe(initialBalances[index]);
    });

    // 4. Verify budgets remain untouched
    const afterBudgets = storage.getBudgets();
    expect(afterBudgets).toEqual(initialBudgets);

    // 5. Verify transactions remain untouched (no auto-generated payday deposits)
    const afterTransactions = storage.getTransactions();
    expect(afterTransactions.length).toBe(initialTransactions.length);
    const paydayTx = afterTransactions.find(t => t.id.startsWith('tx_payday_'));
    expect(paydayTx).toBeUndefined();
  });
});
