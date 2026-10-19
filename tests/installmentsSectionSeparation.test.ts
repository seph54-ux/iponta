import { describe, it, expect } from 'vitest';
import { Installment } from '../src/types';
import { calculateInstallmentRemaining } from '../src/utils/financialCalculations';

describe('Installment Active vs Completed Section Separation', () => {
  const sampleInstallments: Installment[] = [
    {
      id: 'inst_active_1',
      userId: 'u1',
      merchantName: 'Shopee SPayLater',
      itemName: 'Inverter Aircon 1.0HP',
      totalAmount: 18990,
      monthlyPayment: 2142.71,
      totalMonths: 12,
      paidMonths: 5,
      startDate: '2026-05-01',
      paymentMethod: 'GCash',
      category: 'Installments & PayLater',
      interestRatePercent: 2.95,
      interestRateType: 'MONTHLY',
    },
    {
      id: 'inst_active_2',
      userId: 'u1',
      merchantName: 'TikTok PayLater',
      itemName: 'Wireless Earbuds',
      totalAmount: 2400,
      monthlyPayment: 800,
      totalMonths: 3,
      paidMonths: 1,
      startDate: '2026-09-15',
      paymentMethod: 'GCash',
      category: 'Installments & PayLater',
      interestRatePercent: 0,
    },
    {
      id: 'inst_completed_1',
      userId: 'u1',
      merchantName: 'Atome Credit',
      itemName: 'Office Desk Chair',
      totalAmount: 4500,
      monthlyPayment: 1500,
      totalMonths: 3,
      paidMonths: 3, // Fully paid!
      startDate: '2026-07-01',
      paymentMethod: 'Maya',
      category: 'Installments & PayLater',
      interestRatePercent: 0,
    },
    {
      id: 'inst_completed_2',
      userId: 'u1',
      merchantName: 'Shopee SPayLater',
      itemName: 'Mechanical Keyboard',
      totalAmount: 3000,
      monthlyPayment: 1000,
      totalMonths: 3,
      paidMonths: 3, // Fully paid!
      startDate: '2026-06-01',
      paymentMethod: 'GCash',
      category: 'Installments & PayLater',
      interestRatePercent: 0,
    },
  ];

  it('correctly partitions installments into active and completed/settled collections', () => {
    const active = sampleInstallments.filter(i => {
      const calc = calculateInstallmentRemaining(i);
      return calc.remainingMonths > 0 && i.paidMonths < i.totalMonths;
    });

    const completed = sampleInstallments.filter(i => {
      const calc = calculateInstallmentRemaining(i);
      return calc.remainingMonths <= 0 || i.paidMonths >= i.totalMonths;
    });

    expect(active.length).toBe(2);
    expect(active.map(i => i.id)).toEqual(['inst_active_1', 'inst_active_2']);

    expect(completed.length).toBe(2);
    expect(completed.map(i => i.id)).toEqual(['inst_completed_1', 'inst_completed_2']);
  });

  it('ensures completed installments have zero remaining balance and 100% completion', () => {
    const completed = sampleInstallments.filter(i => {
      const calc = calculateInstallmentRemaining(i);
      return calc.remainingMonths <= 0 || i.paidMonths >= i.totalMonths;
    });

    completed.forEach(inst => {
      const calc = calculateInstallmentRemaining(inst);
      expect(calc.remainingBalance).toBe(0);
      expect(calc.remainingMonths).toBe(0);
      expect(calc.completionPercentage).toBe(100);
    });
  });

  it('ensures active monthly outflow only accounts for active installments', () => {
    const active = sampleInstallments.filter(i => {
      const calc = calculateInstallmentRemaining(i);
      return calc.remainingMonths > 0 && i.paidMonths < i.totalMonths;
    });

    const activeOutflow = active.reduce((acc, i) => acc + i.monthlyPayment, 0);
    expect(activeOutflow).toBeCloseTo(2142.71 + 800, 2);

    // Completed installments should NOT contribute to monthly outflow
    const allOutflow = sampleInstallments.reduce((acc, i) => acc + i.monthlyPayment, 0);
    expect(allOutflow).toBeGreaterThan(activeOutflow);
  });
});
