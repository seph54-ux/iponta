import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ExpenseHeatmapModal } from '../src/components/ExpenseHeatmapModal';
import { Transaction } from '../src/types';

describe('ExpenseHeatmapModal', () => {
  it('returns null when isOpen is false without breaking hooks', () => {
    const html = renderToString(
      React.createElement(ExpenseHeatmapModal, {
        isOpen: false,
        onClose: () => {},
        transactions: [],
      })
    );
    expect(html).toBe('');
  });

  it('renders correctly when isOpen is true with empty transactions', () => {
    const html = renderToString(
      React.createElement(ExpenseHeatmapModal, {
        isOpen: true,
        onClose: () => {},
        transactions: [],
      })
    );
    expect(html).toContain('Expense Calendar Heatmap');
    expect(html).toContain('Monthly Calendar');
    expect(html).toContain('Highest Spending Day');
    expect(html).toContain('Zero-Spend Days');
  });

  it('renders correctly with realistic transactions', () => {
    const sampleTxs: Transaction[] = [
      {
        id: 'tx_1',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 850,
        category: 'Food & Dining',
        paymentMethod: 'GCash',
        date: '2026-10-05',
        description: 'Supermarket Groceries',
        createdAt: '2026-10-05T10:00:00Z',
        updatedAt: '2026-10-05T10:00:00Z',
      },
      {
        id: 'tx_2',
        userId: 'u1',
        type: 'EXPENSE',
        amount: 1500,
        category: 'Utilities',
        paymentMethod: 'Maya',
        date: '2026-10-06',
        description: 'Internet Bill',
        createdAt: '2026-10-06T10:00:00Z',
        updatedAt: '2026-10-06T10:00:00Z',
      },
      {
        id: 'tx_3',
        userId: 'u1',
        type: 'INCOME',
        amount: 25000,
        category: 'Salary',
        paymentMethod: 'RCBC Bank',
        date: '2026-10-01',
        description: 'Paycheck',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      },
    ];

    const html = renderToString(
      React.createElement(ExpenseHeatmapModal, {
        isOpen: true,
        onClose: () => {},
        transactions: sampleTxs,
      })
    );
    expect(html).toContain('Expense Calendar Heatmap');
    expect(html).toContain('₱1,500.00'); // Highest spending day
  });
});
