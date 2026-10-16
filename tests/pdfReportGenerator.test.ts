import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateFinancialReportPDF,
  formatPDFCurrency,
  exportFinancialReportPDF,
  downloadPDFBlob,
} from '../src/utils/pdfReportService';
import { Transaction, RecurringBill, Installment, DebtLoan, FinancialAccount } from '../src/types';

describe('PDF Report Generator Service', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx_1',
      userId: 'user_1',
      type: 'INCOME',
      amount: 45000,
      category: 'Salary',
      paymentMethod: 'Bank Transfer',
      date: '2026-10-01',
      description: 'Semi-monthly salary cutoff',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'tx_2',
      userId: 'user_1',
      type: 'EXPENSE',
      amount: 4200,
      category: 'Utilities',
      paymentMethod: 'GCash',
      date: '2026-10-05',
      description: 'Meralco Electric Bill',
      createdAt: '2026-10-05T09:00:00Z',
      updatedAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 'tx_3',
      userId: 'user_1',
      type: 'EXPENSE',
      amount: 7500,
      category: 'Food & Groceries',
      paymentMethod: 'Maya',
      date: '2026-10-08',
      description: 'Puregold supermarket grocery run',
      createdAt: '2026-10-08T14:00:00Z',
      updatedAt: '2026-10-08T14:00:00Z',
    },
  ];

  const sampleBills: RecurringBill[] = [
    {
      id: 'bill_1',
      userId: 'user_1',
      title: 'Meralco Power',
      amount: 4200,
      dueDateDay: 15,
      category: 'Utilities',
      paymentMethod: 'GCash',
      autoRemind: true,
      isPaidThisMonth: true,
    },
  ];

  const sampleInstallments: Installment[] = [
    {
      id: 'inst_1',
      userId: 'user_1',
      merchantName: 'Power Mac Center',
      itemName: 'MacBook Air M2',
      totalAmount: 60000,
      monthlyPayment: 5000,
      totalMonths: 12,
      paidMonths: 4,
      startDate: '2026-06-01',
      paymentMethod: 'Credit Card',
      category: 'Electronics',
    },
  ];

  const sampleDebts: DebtLoan[] = [
    {
      id: 'debt_1',
      userId: 'user_1',
      type: 'I_OWE',
      partyName: 'Uncle Bob',
      originalAmount: 10000,
      remainingAmount: 5000,
      dueDate: '2026-12-31',
    },
  ];

  const sampleAccounts: FinancialAccount[] = [
    {
      id: 'acc_1',
      userId: 'user_1',
      name: 'BDO Savings Account',
      type: 'BANK',
      accountNumberMasked: '****1234',
      balance: 55000,
      isDefault: true,
    },
    {
      id: 'acc_2',
      userId: 'user_1',
      name: 'GCash Wallet',
      type: 'E_WALLET',
      accountNumberMasked: '0917****890',
      balance: 8500,
      isDefault: false,
    },
  ];

  it('formats currency with PHP prefix and commas correctly', () => {
    expect(formatPDFCurrency(45000)).toBe('PHP 45,000.00');
    expect(formatPDFCurrency(0)).toBe('PHP 0.00');
    expect(formatPDFCurrency(1234.5)).toBe('PHP 1,234.50');
    expect(formatPDFCurrency(-500)).toBe('-PHP 500.00');
  });

  it('generates a valid jsPDF document from financial data', () => {
    const doc = generateFinancialReportPDF({
      userName: 'Juan Dela Cruz',
      transactions: sampleTransactions,
      bills: sampleBills,
      installments: sampleInstallments,
      debts: sampleDebts,
      accounts: sampleAccounts,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    const blob = doc.output('blob');
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/pdf');
  });

  it('handles empty data gracefully without throwing errors', () => {
    const doc = generateFinancialReportPDF({
      userName: 'Empty Account User',
      transactions: [],
      bills: [],
      installments: [],
      debts: [],
      accounts: [],
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    const blob = doc.output('blob');
    expect(blob.size).toBeGreaterThan(500);
  });

  it('paginates large transaction ledgers across multiple pages cleanly', () => {
    const manyTransactions: Transaction[] = [];
    for (let i = 1; i <= 60; i++) {
      manyTransactions.push({
        id: `tx_${i}`,
        userId: 'user_1',
        type: i % 4 === 0 ? 'INCOME' : 'EXPENSE',
        amount: 250 + i * 15,
        category: i % 2 === 0 ? 'Food & Groceries' : 'Transportation',
        paymentMethod: 'Cash',
        date: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
        description: `Transaction item #${i}`,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      });
    }

    const doc = generateFinancialReportPDF({
      userName: 'Maria Santos',
      transactions: manyTransactions,
      bills: sampleBills,
      installments: sampleInstallments,
      debts: sampleDebts,
      accounts: sampleAccounts,
    });

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    const blob = doc.output('blob');
    expect(blob.size).toBeGreaterThan(8000);
  });

  it('exportFinancialReportPDF generates and downloads the file with the expected filename pattern', () => {
    // Setup mock browser globals for Node vitest environment
    const clickSpy = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    };

    const mockDoc = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'a') return mockAnchor;
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    const origWindow = globalThis.window;
    const origDocument = globalThis.document;
    const origCreateObjectURL = globalThis.URL.createObjectURL;
    const origRevokeObjectURL = globalThis.URL.revokeObjectURL;

    (globalThis as any).window = {};
    (globalThis as any).document = mockDoc;
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    try {
      const exportedFilename = exportFinancialReportPDF({
        userName: 'Jose Rizal',
        transactions: sampleTransactions,
      });

      expect(exportedFilename).toContain('IponTa_Financial_Report_');
      expect(exportedFilename).toContain('.pdf');
      expect(mockDoc.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe(exportedFilename);
      expect(clickSpy).toHaveBeenCalled();
    } finally {
      (globalThis as any).window = origWindow;
      (globalThis as any).document = origDocument;
      globalThis.URL.createObjectURL = origCreateObjectURL;
      globalThis.URL.revokeObjectURL = origRevokeObjectURL;
    }
  });
});
