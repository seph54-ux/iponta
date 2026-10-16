import { describe, it, expect } from 'vitest';
import {
  calculateNetBalance,
  calculateCategoryBreakdown,
  calculatePaydayDistribution,
  calculateHouseholdShares,
  calculateInstallmentRemaining,
  calculateInstallmentMonthlyPayment,
  calculateFinancialHealthChecks,
  calculateComprehensiveHealthScore,
  calculate50_30_20Breakdown,
  calculateEmergencyRunwayScenario,
  calculateNetWorthSnapshot,
  calculateDebtPayoffTrajectory,
  calculateCashFlowVelocity,
  calculateBudgetStressAndLeaks,
  calculateEmergencySavingsLadder,
  calculateIncomeStabilityAndDebtRisk,
} from '../src/utils/financialCalculations';
import { parseTransactionDateTime, sortTransactionsByDateTime } from '../src/utils/formatters';
import { Transaction, Installment } from '../src/types';

describe('IponTa Financial Calculations Engine', () => {
  it('calculates net balance and savings rate correctly', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        userId: 'u1',
        type: 'INCOME',
        amount: 35000,
        category: 'Salary',
        paymentMethod: 'BPI',
        date: '2026-10-01',
        description: 'Semi-monthly Salary',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: '2',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 12000,
        category: 'Rent',
        paymentMethod: 'BDO',
        date: '2026-10-02',
        description: 'Apartment Rent',
        createdAt: '2026-10-02',
        updatedAt: '2026-10-02',
      },
      {
        id: '3',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 3000,
        category: 'Utilities',
        paymentMethod: 'GCash',
        date: '2026-10-05',
        description: 'Meralco Bill',
        createdAt: '2026-10-05',
        updatedAt: '2026-10-05',
      },
    ];

    const result = calculateNetBalance(mockTransactions);
    expect(result.totalIncome).toBe(35000);
    expect(result.totalExpenses).toBe(15000);
    expect(result.netBalance).toBe(20000);
    expect(result.savingsRate).toBe(57.1);
  });

  it('distributes payday income into Philippine 50/20/15/5/10 budget buckets', () => {
    const netIncome = 30000;
    const distribution = calculatePaydayDistribution(netIncome);

    expect(distribution.fixedBills).toBe(15000); // 50%
    expect(distribution.savings).toBe(6000);     // 20%
    expect(distribution.food).toBe(4500);        // 15%
    expect(distribution.transport).toBe(1500);   // 5%
    expect(distribution.discretionary).toBe(3000); // 10%
    expect(distribution.totalAllocated).toBe(30000);
  });

  it('calculates 50/50 household split accurately', () => {
    const mockShared: Transaction[] = [
      {
        id: 's1',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 4000,
        category: 'Groceries',
        paymentMethod: 'GCash',
        date: '2026-10-03',
        description: 'SM Puregold Shared Grocery',
        isShared: true,
        createdAt: '2026-10-03',
        updatedAt: '2026-10-03',
      },
      {
        id: 's2',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 1500,
        category: 'Utilities',
        paymentMethod: 'Maya',
        date: '2026-10-04',
        description: 'Converge Internet Shared',
        isShared: true,
        createdAt: '2026-10-04',
        updatedAt: '2026-10-04',
      },
    ];

    const shares = calculateHouseholdShares(mockShared, 0.5);
    expect(shares.totalSharedExpense).toBe(5500);
    expect(shares.personAShare).toBe(2750);
    expect(shares.personBShare).toBe(2750);
  });

  it('calculates installment remaining balance and completion % correctly', () => {
    const mockInstallment: Installment = {
      id: 'inst1',
      userId: 'u1',
      merchantName: 'Shopee SPayLater',
      itemName: 'Smart TV 43 Inch',
      totalAmount: 18000,
      monthlyPayment: 1500,
      totalMonths: 12,
      paidMonths: 4,
      startDate: '2026-06-01',
      paymentMethod: 'GCash',
      category: 'Appliances',
    };

    const calculation = calculateInstallmentRemaining(mockInstallment);
    expect(calculation.remainingMonths).toBe(8);
    expect(calculation.remainingBalance).toBe(12000);
    expect(calculation.completionPercentage).toBe(33);
  });

  it('calculates 0% interest installment monthly payment accurately', () => {
    const calc = calculateInstallmentMonthlyPayment(12000, 6, 0);
    expect(calc.monthlyPayment).toBe(2000);
    expect(calc.monthlyPrincipal).toBe(2000);
    expect(calc.monthlyInterest).toBe(0);
    expect(calc.totalInterest).toBe(0);
    expect(calc.totalPayable).toBe(12000);
  });

  it('calculates Philippine Shopee SPayLater add-on monthly interest accurately (e.g. 2.95%/mo)', () => {
    // ₱10,000 for 6 months at 2.95% per month add-on
    const calc = calculateInstallmentMonthlyPayment(10000, 6, 2.95, 'MONTHLY', 'ADD_ON');
    // Monthly principal: 10000 / 6 = 1666.67
    expect(calc.monthlyPrincipal).toBe(1666.67);
    // Monthly interest: 10000 * 2.95% = 295.00
    expect(calc.monthlyInterest).toBe(295);
    // Accurate monthly payment needed: 1666.67 + 295 = 1961.67
    expect(calc.monthlyPayment).toBe(1961.67);
    // Total interest over 6 months: 295 * 6 = 1770.00
    expect(calc.totalInterest).toBe(1770);
    // Total repayment amount: 10000 + 1770 = 11770.00
    expect(calc.totalPayable).toBe(11770);
  });

  it('calculates Annual APR add-on interest correctly', () => {
    // ₱24,000 for 12 months at 12% APR (1% per month)
    const calc = calculateInstallmentMonthlyPayment(24000, 12, 12, 'ANNUAL', 'ADD_ON');
    expect(calc.monthlyPrincipal).toBe(2000);
    expect(calc.monthlyInterest).toBe(240);
    expect(calc.monthlyPayment).toBe(2240);
    expect(calc.totalInterest).toBe(2880);
    expect(calc.totalPayable).toBe(26880);
  });

  it('calculates remaining balance and breakdown for installment with interest', () => {
    const installmentWithInterest: Installment = {
      id: 'inst_spay_test',
      userId: 'u1',
      merchantName: 'Shopee SPayLater',
      itemName: 'Laptop',
      totalAmount: 30000,
      monthlyPayment: 5885, // 5000 principal + 885 interest (2.95%/mo)
      totalMonths: 6,
      paidMonths: 2,
      startDate: '2026-08-01',
      paymentMethod: 'GCash',
      category: 'Gadgets',
      interestRatePercent: 2.95,
      interestRateType: 'MONTHLY',
    };

    const remaining = calculateInstallmentRemaining(installmentWithInterest);
    expect(remaining.remainingMonths).toBe(4);
    expect(remaining.remainingBalance).toBe(4 * 5885);
    expect(remaining.completionPercentage).toBe(33);
    expect(remaining.monthlyInterest).toBe(885);
    expect(remaining.monthlyPrincipal).toBe(5000);
    expect(remaining.totalInterest).toBe(5310);
    expect(remaining.totalPayable).toBe(35310);
  });

  it('flags warning when debt-to-income commitment ratio exceeds 50%', () => {
    const health = calculateFinancialHealthChecks({
      monthlyIncome: 25000,
      monthlyExpenses: 12000,
      monthlyRecurringBills: [
        { id: 'b1', userId: 'u1', title: 'Meralco', amount: 3500, dueDateDay: 15, category: 'Utilities', paymentMethod: 'GCash', autoRemind: true, isPaidThisMonth: false },
        { id: 'b2', userId: 'u1', title: 'Rent', amount: 8000, dueDateDay: 5, category: 'Housing', paymentMethod: 'BPI', autoRemind: true, isPaidThisMonth: false },
      ],
      monthlyInstallments: [
        { id: 'i1', userId: 'u1', merchantName: 'Home Credit', itemName: 'Phone', totalAmount: 12000, monthlyPayment: 2000, totalMonths: 6, paidMonths: 1, startDate: '2026-09-01', paymentMethod: 'Cash', category: 'Gadgets' }
      ],
      debts: [
        { id: 'd1', userId: 'u1', partyName: 'SSS Loan', type: 'I_OWE', originalAmount: 20000, remainingAmount: 15000, monthlyAmortization: 1500 }
      ],
      savingsGoals: [],
      liquidSavingsBalance: 5000,
    });

    const fixedCommitmentRule = health.find(r => r.id === 'rule_fixed_commitments');
    expect(fixedCommitmentRule).toBeDefined();
    expect(fixedCommitmentRule?.status).toBe('ALERT'); // 15,000 / 25,000 = 60% > 50%
  });

  it('calculates comprehensive health score and tiers correctly', () => {
    const healthScore = calculateComprehensiveHealthScore({
      monthlyIncome: 45000,
      monthlyExpenses: 20000,
      totalLiquidFunds: 120000,
      totalFixedCommitments: 12000,
      totalLiabilities: 0,
      budgets: [],
      transactions: [],
    });

    expect(healthScore.score).toBeGreaterThan(70);
    expect(['EXCELLENT', 'GOOD']).toContain(healthScore.tier);
    expect(healthScore.subScores.solvencyRatio.value).toBe('Debt-Free');
  });

  it('performs 50/30/20 budget breakdown audit accurately', () => {
    const mockTxs: Transaction[] = [
      { id: '1', userId: 'u1', type: 'EXPENSE', amount: 15000, category: 'Housing & Rent', paymentMethod: 'BPI', date: '2026-10-01', description: 'Monthly Rent', createdAt: '', updatedAt: '' },
      { id: '2', userId: 'u1', type: 'EXPENSE', amount: 5000, category: 'Meralco Electric', paymentMethod: 'GCash', date: '2026-10-05', description: 'Electric Bill', createdAt: '', updatedAt: '' },
      { id: '3', userId: 'u1', type: 'EXPENSE', amount: 6000, category: 'Dining Out', paymentMethod: 'GCash', date: '2026-10-08', description: 'Jollibee & Dinner with Friends', createdAt: '', updatedAt: '' },
    ];

    const audit = calculate50_30_20Breakdown(mockTxs, 40000);
    expect(audit.needsAmount).toBe(20000); // 15k rent + 5k meralco
    expect(audit.wantsAmount).toBe(6000); // 6k dining
    expect(audit.needsPercentage).toBe(50); // 20k / 40k = 50%
    expect(audit.wantsPercentage).toBe(15); // 6k / 40k = 15%
    expect(audit.savingsPercentage).toBe(35); // (40k - 26k) / 40k = 35%
  });

  it('calculates emergency runway scenarios accurately', () => {
    const runway = calculateEmergencyRunwayScenario(60000, 30000, 15000);
    expect(runway.normalRunwayMonths).toBe(2);
    expect(runway.bareBonesRunwayMonths).toBe(4);
    expect(runway.status).toBe('MODERATE');
  });

  it('computes net liquid worth and debt acceleration correctly', () => {
    const netWorth = calculateNetWorthSnapshot({
      accounts: [
        { id: 'a1', userId: 'u1', name: 'BPI', type: 'BANK', balance: 50000 },
        { id: 'a2', userId: 'u1', name: 'GCash', type: 'E_WALLET', balance: 10000 },
      ],
      savingsGoals: [
        { id: 'g1', userId: 'u1', title: 'Emergency', targetAmount: 100000, currentAmount: 30000, targetDate: '2026-12-31', monthlyTargetContribution: 5000, iconName: 'Shield', colorHex: '#2E7D5B' }
      ],
      installments: [
        { id: 'i1', userId: 'u1', merchantName: 'SPayLater', itemName: 'Laptop', totalAmount: 24000, monthlyPayment: 4000, totalMonths: 6, paidMonths: 2, startDate: '2026-08-01', paymentMethod: 'GCash', category: 'Gadgets' }
      ],
      debts: [
        { id: 'd1', userId: 'u1', partyName: 'Friend', type: 'I_OWE', originalAmount: 10000, remainingAmount: 5000 }
      ],
    });

    expect(netWorth.totalAssets).toBe(90000); // 50k + 10k + 30k
    expect(netWorth.installmentLiability).toBe(16000); // 4 rem months * 4000
    expect(netWorth.loanLiability).toBe(5000);
    expect(netWorth.totalLiabilities).toBe(21000);
    expect(netWorth.netWorth).toBe(69000); // 90000 - 21000
    expect(netWorth.solvencyGrade).toBe('SOLVENT');

    const accel = calculateDebtPayoffTrajectory(21000, 4000, 2000);
    expect(accel.monthsToDebtFreeStandard).toBe(6); // ceil(21000 / 4000)
    expect(accel.monthsToDebtFreeAccelerated).toBe(4); // ceil(21000 / 6000)
    expect(accel.monthsSaved).toBe(2);
  });

  it('correctly sorts transactions based on chosen date and time with latest at the top', () => {
    const rawTransactions = [
      { id: 'tx_old', date: '2026-10-02', time: '14:00', createdAt: '2026-10-12T10:00:00Z', amount: 500, description: 'Old' },
      { id: 'tx_latest', date: '2026-10-12', time: '16:30', createdAt: '2026-10-01T08:00:00Z', amount: 1500, description: 'Latest Chosen' },
      { id: 'tx_mid_morning', date: '2026-10-10', time: '09:00', createdAt: '2026-10-10T09:00:00Z', amount: 200, description: 'Morning' },
      { id: 'tx_mid_night', date: '2026-10-10', time: '21:15', createdAt: '2026-10-10T21:15:00Z', amount: 350, description: 'Night' },
    ];

    const sortedDesc = sortTransactionsByDateTime(rawTransactions, 'desc');
    expect(sortedDesc[0].id).toBe('tx_latest'); // 2026-10-12 16:30 at top
    expect(sortedDesc[1].id).toBe('tx_mid_night'); // 2026-10-10 21:15
    expect(sortedDesc[2].id).toBe('tx_mid_morning'); // 2026-10-10 09:00
    expect(sortedDesc[3].id).toBe('tx_old'); // 2026-10-02 14:00

    const sortedAsc = sortTransactionsByDateTime(rawTransactions, 'asc');
    expect(sortedAsc[0].id).toBe('tx_old');
    expect(sortedAsc[3].id).toBe('tx_latest');
  });

  it('calculates cash flow velocity and safe daily spending limit', () => {
    const mockTxs: Transaction[] = [
      { id: 't1', userId: 'u1', type: 'EXPENSE', amount: 3000, category: 'Food', date: '2026-10-05', description: 'Grocery', createdAt: '2026-10-05', updatedAt: '2026-10-05', paymentMethod: 'Cash' },
      { id: 't2', userId: 'u1', type: 'EXPENSE', amount: 2000, category: 'Utilities', date: '2026-10-08', description: 'Electric', createdAt: '2026-10-08', updatedAt: '2026-10-08', paymentMethod: 'GCash' },
    ];

    const velocity = calculateCashFlowVelocity(mockTxs, 30000, 5000, 5000);
    expect(velocity.monthlyIncome).toBe(30000);
    expect(velocity.fixedCommitments).toBe(5000);
    expect(velocity.savingsTarget).toBe(5000);
    expect(velocity.safeDailyLimit).toBeGreaterThanOrEqual(0);
    expect(['ON_TRACK', 'CAUTION', 'FAST_BURN']).toContain(velocity.velocityStatus);
  });

  it('detects budget stress and Tagas sa Bulsa micro-leaks', () => {
    const mockTxs: Transaction[] = [
      { id: 't1', userId: 'u1', type: 'EXPENSE', amount: 350, category: 'Food & Dining Out', date: '2026-10-02', description: 'Grab Food lunch delivery', createdAt: '2026-10-02', updatedAt: '2026-10-02', paymentMethod: 'GCash' },
      { id: 't2', userId: 'u1', type: 'EXPENSE', amount: 180, category: 'Food & Dining Out', date: '2026-10-04', description: 'Starbucks iced coffee merienda', createdAt: '2026-10-04', updatedAt: '2026-10-04', paymentMethod: 'GCash' },
      { id: 't3', userId: 'u1', type: 'EXPENSE', amount: 120, category: 'Food & Dining Out', date: '2026-10-06', description: '7-Eleven snack run', createdAt: '2026-10-06', updatedAt: '2026-10-06', paymentMethod: 'Cash' },
    ];

    const budgets = [
      { id: 'b1', userId: 'u1', categoryId: 'c1', categoryName: 'Food & Dining Out', period: 'MONTHLY' as const, limitAmount: 500 }
    ];

    const leaks = calculateBudgetStressAndLeaks(mockTxs, budgets);
    expect(leaks.leakCount).toBeGreaterThanOrEqual(2);
    expect(leaks.totalLeakAmount).toBeGreaterThan(0);
    expect(leaks.overBudgetCategories.length).toBe(1); // 650 spent vs 500 limit
    expect(leaks.overBudgetCategories[0].overAmount).toBe(150);
  });

  it('computes emergency savings ladder stages and progression', () => {
    const ladder = calculateEmergencySavingsLadder(25000, 15000, 5000);
    expect(ladder.milestones.length).toBe(4);
    expect(ladder.milestones[0].isUnlocked).toBe(true); // 25k >= 15k starter
    expect(ladder.milestones[1].isUnlocked).toBe(true); // 25k >= 15k 1-month
    expect(ladder.milestones[2].isUnlocked).toBe(false); // 25k < 45k 3-month
    expect(ladder.currentLevel).toBe(2);
    expect(ladder.gapToNextMilestone).toBe(20000); // 45000 - 25000
    expect(ladder.monthsToNextMilestone).toBe(4); // ceil(20000 / 5000)
  });

  it('evaluates income stability and debt-to-income risk', () => {
    const mockTxs: Transaction[] = [
      { id: 't1', userId: 'u1', type: 'INCOME', amount: 30000, category: 'Salary & Income', subcategory: 'Base Salary', date: '2026-10-01', description: 'Salary', createdAt: '2026-10-01', updatedAt: '2026-10-01', paymentMethod: 'RCBC' },
      { id: 't2', userId: 'u1', type: 'INCOME', amount: 10000, category: 'Freelance & Side Gig', date: '2026-10-05', description: 'Consulting', createdAt: '2026-10-05', updatedAt: '2026-10-05', paymentMethod: 'GCash' },
    ];

    const stability = calculateIncomeStabilityAndDebtRisk(mockTxs, 8000);
    expect(stability.totalIncome).toBe(40000);
    expect(stability.debtToIncomeRatio).toBe(20); // 8000 / 40000 = 20%
    expect(stability.dtiStatus).toBe('MODERATE');
  });
});


