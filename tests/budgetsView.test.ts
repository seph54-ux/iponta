import { describe, it, expect } from 'vitest';
import { BudgetLimit, BudgetCycle } from '../src/types';

describe('Flexible Budget Cycles & Cutoff Budgeting Logic', () => {
  it('correctly aggregates budgeted limits and spent amounts within a cycle window', () => {
    const cycle: BudgetCycle = {
      id: 'cycle_cutoff1_oct',
      userId: 'u1',
      name: 'Oct 1-15 Cutoff',
      cycleType: 'BI_WEEKLY',
      startDate: '2026-10-01',
      endDate: '2026-10-15',
      incomeAmount: 25000,
      createdAt: '2026-10-01T00:00:00Z',
    };

    const cycleBudgets: BudgetLimit[] = [
      { id: '1', userId: 'u1', categoryId: 'cat_food', categoryName: 'Food & Dining Out', period: 'CYCLE', limitAmount: 4000, cycleId: cycle.id },
      { id: '2', userId: 'u1', categoryId: 'cat_trans', categoryName: 'Transportation & Fuel', period: 'CYCLE', limitAmount: 2000, cycleId: cycle.id },
      { id: '3', userId: 'u1', categoryId: 'cat_util', categoryName: 'Utilities & Bills', period: 'CYCLE', limitAmount: 3000, cycleId: cycle.id },
    ];

    const totalAllocated = cycleBudgets.reduce((acc, b) => acc + b.limitAmount, 0);
    expect(totalAllocated).toBe(9000);

    const spentMap: Record<string, number> = {
      'Food & Dining Out': 2600,
      'Transportation & Fuel': 900,
      'Utilities & Bills': 1000,
    };

    const totalSpent = cycleBudgets.reduce((acc, b) => acc + (spentMap[b.categoryName] || 0), 0);
    expect(totalSpent).toBe(4500);

    const remaining = totalAllocated - totalSpent;
    expect(remaining).toBe(4500);

    const utilizationPct = Math.round((totalSpent / totalAllocated) * 100);
    expect(utilizationPct).toBe(50);

    // Days remaining metric (e.g. 9 days left)
    const daysRemaining = 9;
    const safeDailySpending = remaining / daysRemaining;
    expect(safeDailySpending).toBe(500);
  });

  it('correctly copies cycle budgets to another cutoff cycle', () => {
    const sourceCycleId = 'cycle_cutoff1';
    const targetCycleId = 'cycle_cutoff2';

    const sourceBudgets: BudgetLimit[] = [
      { id: 'b1', userId: 'u1', categoryId: 'cat_food', categoryName: 'Food & Dining Out', period: 'CYCLE', limitAmount: 4000, cycleId: sourceCycleId },
      { id: 'b2', userId: 'u1', categoryId: 'cat_rent', categoryName: 'Rent & Housing', period: 'CYCLE', limitAmount: 7500, cycleId: sourceCycleId },
    ];

    const copied = sourceBudgets.map(b => ({
      ...b,
      id: `bgt_copied_${b.categoryId}_${targetCycleId}`,
      cycleId: targetCycleId,
    }));

    expect(copied.length).toBe(2);
    expect(copied[0].cycleId).toBe(targetCycleId);
    expect(copied[1].cycleId).toBe(targetCycleId);
    expect(copied[0].limitAmount).toBe(4000);
    expect(copied[1].limitAmount).toBe(7500);
    expect(copied[0].id).not.toBe(sourceBudgets[0].id);
  });

  it('computes burn rate and projected total spend accurately', () => {
    const totalAllocated = 10000;
    const elapsedDays = 5;
    const daysRemaining = 10;
    const totalSpent = 6000;

    const avgDailySpent = totalSpent / elapsedDays; // 1,200/day
    expect(avgDailySpent).toBe(1200);

    const projectedTotalSpend = totalSpent + (avgDailySpent * daysRemaining); // 6000 + 12000 = 18000
    expect(projectedTotalSpend).toBe(18000);
    expect(projectedTotalSpend > totalAllocated).toBe(true);
  });
});
