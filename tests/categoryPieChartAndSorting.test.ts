import { describe, it, expect } from 'vitest';
import { sortTransactionsByDateTime, parseTransactionDateTime } from '../src/utils/formatters';
import { calculateCategoryBreakdown } from '../src/utils/financialCalculations';
import { getCategoryColor } from '../src/components/CategoryPieChart';
import { Transaction } from '../src/types';

describe('Transaction Log Sorting by Chosen Date & Time', () => {
  it('correctly parses date and time into millisecond timestamps', () => {
    const ts1 = parseTransactionDateTime('2026-10-12', '14:30');
    const ts2 = parseTransactionDateTime('2026-10-12', '09:00');
    expect(ts1).toBeGreaterThan(ts2);

    // Default time when omitted is 00:00
    const tsDefault = parseTransactionDateTime('2026-10-12');
    const tsZero = parseTransactionDateTime('2026-10-12', '00:00');
    expect(tsDefault).toBe(tsZero);
  });

  it('places latest transaction date & time at the top (descending)', () => {
    // User added tx_earlier AFTER tx_latest in real-world time, but specified an earlier transaction date/time
    const mockTxs: Transaction[] = [
      {
        id: 'tx_old',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 250,
        category: 'Food & Groceries',
        date: '2026-10-01',
        time: '12:00',
        description: 'Old grocery',
        createdAt: '2026-10-12T10:00:00Z', // added today
        updatedAt: '2026-10-12T10:00:00Z',
        paymentMethod: 'Cash',
      },
      {
        id: 'tx_latest_night',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 1200,
        category: 'Utilities',
        date: '2026-10-12',
        time: '20:45',
        description: 'Electricity bill',
        createdAt: '2026-10-01T08:00:00Z', // added days ago
        updatedAt: '2026-10-01T08:00:00Z',
        paymentMethod: 'GCash',
      },
      {
        id: 'tx_latest_morning',
        userId: 'u1',
        type: 'INCOME',
        amount: 20000,
        category: 'Salary & Income',
        date: '2026-10-12',
        time: '08:30',
        description: 'Payroll',
        createdAt: '2026-10-05T08:00:00Z',
        updatedAt: '2026-10-05T08:00:00Z',
        paymentMethod: 'RCBC',
      },
      {
        id: 'tx_mid_month',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 600,
        category: 'Transportation',
        date: '2026-10-06',
        time: '15:15',
        description: 'Gas refill',
        createdAt: '2026-10-06T15:15:00Z',
        updatedAt: '2026-10-06T15:15:00Z',
        paymentMethod: 'Maya',
      },
    ];

    const sorted = sortTransactionsByDateTime(mockTxs, 'desc');

    // 1. tx_latest_night (2026-10-12 20:45) must be top
    expect(sorted[0].id).toBe('tx_latest_night');
    // 2. tx_latest_morning (2026-10-12 08:30) must be 2nd
    expect(sorted[1].id).toBe('tx_latest_morning');
    // 3. tx_mid_month (2026-10-06 15:15) must be 3rd
    expect(sorted[2].id).toBe('tx_mid_month');
    // 4. tx_old (2026-10-01 12:00) must be last
    expect(sorted[3].id).toBe('tx_old');
  });

  it('handles sorting when time string is missing or empty by falling back gracefully', () => {
    const list: Transaction[] = [
      {
        id: 'tx1',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 100,
        category: 'Food',
        date: '2026-10-10',
        description: 'Snack',
        createdAt: '2026-10-10',
        updatedAt: '2026-10-10',
        paymentMethod: 'Cash',
      },
      {
        id: 'tx2',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 200,
        category: 'Food',
        date: '2026-10-11',
        description: 'Dinner',
        createdAt: '2026-10-11',
        updatedAt: '2026-10-11',
        paymentMethod: 'Cash',
      },
    ];

    const sorted = sortTransactionsByDateTime(list, 'desc');
    expect(sorted[0].id).toBe('tx2');
    expect(sorted[1].id).toBe('tx1');
  });
});

describe('Dashboard Category Circle Chart & Labels Requirements', () => {
  it('returns empty breakdown when there are no expense transactions for the month', () => {
    const emptyExpenses: Transaction[] = [];
    const breakdown = calculateCategoryBreakdown(emptyExpenses);

    expect(breakdown).toHaveLength(0);
  });

  it('excludes non-existent categories from breakdown and labels to save space', () => {
    // Only 2 categories are spent on: Food & Groceries and Transportation
    const transactions: Transaction[] = [
      {
        id: 't1',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 3000,
        category: 'Food & Groceries',
        date: '2026-10-02',
        description: 'Groceries',
        createdAt: '2026-10-02',
        updatedAt: '2026-10-02',
        paymentMethod: 'Cash',
      },
      {
        id: 't2',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 1000,
        category: 'Transportation',
        date: '2026-10-03',
        description: 'MRT / Grab',
        createdAt: '2026-10-03',
        updatedAt: '2026-10-03',
        paymentMethod: 'GCash',
      },
      {
        id: 't3',
        userId: 'u1',
        type: 'INCOME', // Income should not be in expense breakdown
        amount: 25000,
        category: 'Salary & Income',
        date: '2026-10-01',
        description: 'Salary',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        paymentMethod: 'RCBC',
      },
    ];

    const breakdown = calculateCategoryBreakdown(transactions);

    // ONLY the 2 categories with expense records should exist
    expect(breakdown).toHaveLength(2);
    expect(breakdown.map((b) => b.category)).toEqual(['Food & Groceries', 'Transportation']);
    // Categories like 'Utilities', 'Rent & Housing', 'Entertainment' must NOT appear
    expect(breakdown.some((b) => b.category === 'Utilities')).toBe(false);
    expect(breakdown.some((b) => b.category === 'Salary & Income')).toBe(false);

    // Verify percentages sum to 100%
    const totalPercentage = breakdown.reduce((sum, b) => sum + b.percentage, 0);
    expect(totalPercentage).toBe(100);
  });

  it('assigns distinguishable colors to different categories', () => {
    const colorFood = getCategoryColor('Food & Groceries', 0);
    const colorRent = getCategoryColor('Rent & Housing', 1);
    const colorTransport = getCategoryColor('Transportation', 2);

    expect(colorFood).toBeTruthy();
    expect(colorRent).toBeTruthy();
    expect(colorTransport).toBeTruthy();
    expect(colorFood).not.toBe(colorRent);
    expect(colorFood).not.toBe(colorTransport);
    expect(colorRent).not.toBe(colorTransport);
  });

  it('assigns unique, non-duplicated contrasted colors to all standard categories', () => {
    const categoriesToTest = [
      'Food & Dining Out',
      'Groceries & Wet Market',
      'Rent & Housing',
      'Utilities & Monthly Bills',
      'Transportation & Fuel',
      'Healthcare & Medicines',
      'Installments & PayLater',
      'Loan Repayments',
      'Personal & Shopping',
      'Education & Learning',
      'Savings & Investments',
      'Entertainment',
      'Personal Care',
      'Travel',
      'Donations & Family',
      'Bills & Subscriptions',
      'Emergency Fund',
      'Other Expenses',
    ];

    const assignedColors = categoriesToTest.map((cat, i) => getCategoryColor(cat, i));
    const uniqueColors = new Set(assignedColors.map((c) => c.toLowerCase()));

    // Verify absolutely zero duplicate colors
    expect(uniqueColors.size).toBe(categoriesToTest.length);

    // Specifically test contrasted variants between food outside and groceries
    const foodOutColor = getCategoryColor('Food & Dining Out');
    const groceriesColor = getCategoryColor('Groceries & Wet Market');
    expect(foodOutColor).not.toBe(groceriesColor);
  });

  it('dynamically avoids duplicated colors even for custom or unknown categories in donut chart', () => {
    const customCategories = [
      'Custom Category Alpha',
      'Custom Category Beta',
      'Custom Category Gamma',
      'Custom Category Delta',
      'Custom Category Epsilon',
    ];

    const usedColors = new Set<string>();
    const assigned: string[] = [];

    customCategories.forEach((cat, index) => {
      const color = getCategoryColor(cat, index, usedColors);
      usedColors.add(color.toLowerCase());
      assigned.push(color);
    });

    const uniqueAssigned = new Set(assigned.map((c) => c.toLowerCase()));
    expect(uniqueAssigned.size).toBe(customCategories.length);
  });
});

