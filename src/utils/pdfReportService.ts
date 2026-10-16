import { jsPDF } from 'jspdf';
import { Transaction, BudgetLimit, RecurringBill, Installment, DebtLoan, FinancialAccount } from '../types';
import { calculateNetBalance, calculateCategoryBreakdown } from './financialCalculations';
import { formatDate } from './formatters';

export interface FinancialReportPDFOptions {
  userName: string;
  transactions: Transaction[];
  budgets?: BudgetLimit[];
  bills?: RecurringBill[];
  installments?: Installment[];
  debts?: DebtLoan[];
  accounts?: FinancialAccount[];
  periodLabel?: string;
}

export const formatPDFCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}PHP ${formatted}`;
};

export const generateFinancialReportPDF = (options: FinancialReportPDFOptions): jsPDF => {
  const {
    userName,
    transactions = [],
    budgets = [],
    bills = [],
    installments = [],
    debts = [],
    accounts = [],
    periodLabel = 'All-Time Financial Statement',
  } = options;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const docRef = `IPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const net = calculateNetBalance(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const totalBills = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalInstallmentsMonthly = installments.reduce((acc, i) => acc + (i.monthlyPayment || 0), 0);
  const totalAccountsBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  let y = margin;

  const drawHeader = (isContinuation = false) => {
    if (!isContinuation) {
      // Emerald Banner
      doc.setFillColor(4, 120, 87); // #047857
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Accent gold/lime bar
      doc.setFillColor(16, 185, 129); // #10b981
      doc.rect(0, 28, pageWidth, 1.5, 'F');

      // Brand Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text('IponTa', margin, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(209, 250, 229);
      doc.text('Tara, Ipon Ta! — Personal & Household Financial Statement', margin, 18);
      doc.text(`Period: ${periodLabel}`, margin, 24);

      // Meta (Right aligned)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Account: ${userName || 'Pinoy User'}`, pageWidth - margin, 12, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(209, 250, 229);
      doc.text(`Statement Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, 18, { align: 'right' });
      doc.text(`Reference: ${docRef}`, pageWidth - margin, 24, { align: 'right' });

      y = 35;
    } else {
      // Smaller continuation header
      doc.setFillColor(4, 120, 87);
      doc.rect(0, 0, pageWidth, 12, 'F');

      doc.setFillColor(16, 185, 129);
      doc.rect(0, 12, pageWidth, 1, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('IponTa Financial Statement (Continued)', margin, 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(209, 250, 229);
      doc.text(`Ref: ${docRef} | ${userName}`, pageWidth - margin, 8, { align: 'right' });

      y = 18;
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      drawHeader(true);
    }
  };

  // Draw Page 1 Main Header
  drawHeader(false);

  // Disclaimer / Legal Box
  doc.setFillColor(254, 243, 199); // #fef3c7
  doc.setDrawColor(253, 230, 138); // #fde68a
  doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');

  doc.setTextColor(146, 64, 14); // #92400e
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTICE:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This summary statement is generated solely for personal budgeting and household record-keeping purposes.',
    margin + 16,
    y + 4.5
  );
  doc.text(
    'IponTa operates client-side on your device and is not a bank, e-money issuer, or credit rating agency.',
    margin + 3,
    y + 8.5
  );

  y += 15;

  // Executive Metric Cards (Income, Expenses, Net Balance, Net Worth / Accounts)
  const cardCount = accounts.length > 0 ? 4 : 3;
  const cardWidth = (contentWidth - (cardCount - 1) * 3) / cardCount;

  const cards = [
    {
      title: 'TOTAL INCOME',
      value: formatPDFCurrency(net.totalIncome),
      color: [4, 120, 87], // Emerald
      sub: `${transactions.filter((t) => t.type === 'INCOME').length} transactions`,
    },
    {
      title: 'TOTAL EXPENSES',
      value: formatPDFCurrency(net.totalExpenses),
      color: [190, 18, 60], // Rose
      sub: `${transactions.filter((t) => t.type === 'EXPENSE').length} transactions`,
    },
    {
      title: 'NET BALANCE',
      value: formatPDFCurrency(net.netBalance),
      color: net.netBalance >= 0 ? [15, 23, 42] : [190, 18, 60],
      sub:
        net.totalIncome > 0
          ? `${((net.netBalance / net.totalIncome) * 100).toFixed(1)}% savings rate`
          : 'Cash flow balance',
    },
  ];

  if (accounts.length > 0) {
    cards.push({
      title: 'LIQUID BALANCES',
      value: formatPDFCurrency(totalAccountsBalance),
      color: [14, 116, 144], // Cyan
      sub: `${accounts.length} active accounts`,
    });
  }

  cards.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, cardX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.value, cardX + 3, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cardX + 3, y + 15);
  });

  y += 22;

  // Active Accounts Overview (if available)
  if (accounts.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FINANCIAL ACCOUNTS & ASSET BALANCES', margin, y + 4);
    y += 6;

    // Accounts Header Row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Account Name', margin + 3, y + 4);
    doc.text('Type', margin + 65, y + 4);
    doc.text('Account / Ref Number', margin + 105, y + 4);
    doc.text('Current Balance', pageWidth - margin - 3, y + 4, { align: 'right' });
    y += 5.5;

    accounts.forEach((acc, i) => {
      checkPageBreak(5.5);
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(acc.name, margin + 3, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(acc.type, margin + 65, y + 3.8);
      doc.text(acc.accountNumberMasked || '—', margin + 105, y + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(acc.balance >= 0 ? 15 : 190, acc.balance >= 0 ? 23 : 18, acc.balance >= 0 ? 42 : 60);
      doc.text(formatPDFCurrency(acc.balance), pageWidth - margin - 3, y + 3.8, { align: 'right' });

      y += 5.5;
    });

    y += 4;
  }

  // Expense Category Breakdown
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOP EXPENSE CATEGORY BREAKDOWN', margin, y + 4);
  y += 6;

  // Category Header Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Category', margin + 3, y + 4);
  doc.text('Transactions', margin + 65, y + 4);
  doc.text('Share (%)', margin + 115, y + 4);
  doc.text('Total Amount', pageWidth - margin - 3, y + 4, { align: 'right' });
  y += 5.5;

  if (categoryBreakdown.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('No expense records logged in this period.', margin + 3, y + 4.5);
    y += 8;
  } else {
    categoryBreakdown.slice(0, 10).forEach((cat, idx) => {
      checkPageBreak(5.5);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(cat.category, margin + 3, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${cat.count} items`, margin + 65, y + 3.8);
      doc.text(`${cat.percentage.toFixed(1)}%`, margin + 115, y + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatPDFCurrency(cat.totalAmount), pageWidth - margin - 3, y + 3.8, { align: 'right' });

      y += 5.5;
    });
    y += 4;
  }

  // Monthly Obligations & Active Commitments (Bills, Installments, Debts)
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RECURRING BILLS & ACTIVE OBLIGATIONS', margin, y + 4);
  y += 6;

  const colObligW = (contentWidth - 6) / 3;

  // Box 1: Recurring Bills
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colObligW, 16, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Recurring Bills (${bills.length})`, margin + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPDFCurrency(totalBills) + ' / mo', margin + 3, y + 10);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${bills.filter((b) => b.isPaidThisMonth).length} paid this month`, margin + 3, y + 14);

  // Box 2: Installments
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colObligW + 3, y, colObligW, 16, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Active Installments (${installments.length})`, margin + colObligW + 6, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPDFCurrency(totalInstallmentsMonthly) + ' / mo', margin + colObligW + 6, y + 10);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${installments.reduce((acc, i) => acc + (i.monthlyPayment * Math.max(0, i.totalMonths - i.paidMonths)), 0) > 0 ? 'Remaining bal: ' + formatPDFCurrency(installments.reduce((acc, i) => acc + (i.monthlyPayment * Math.max(0, i.totalMonths - i.paidMonths)), 0)) : 'No active plans'}`,
    margin + colObligW + 6,
    y + 14
  );

  // Box 3: Debts / Loans
  const totalLent = debts
    .filter((d) => d.type === 'OWED_TO_ME')
    .reduce((a, b) => a + (b.remainingAmount || b.originalAmount || 0), 0);
  const totalBorrowed = debts
    .filter((d) => d.type === 'I_OWE')
    .reduce((a, b) => a + (b.remainingAmount || b.originalAmount || 0), 0);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + (colObligW + 3) * 2, y, colObligW, 16, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Debts & Loans (${debts.length})`, margin + (colObligW + 3) * 2 + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(totalBorrowed > 0 ? 190 : 15, totalBorrowed > 0 ? 18 : 23, totalBorrowed > 0 ? 60 : 42);
  doc.text(`Payable: ${formatPDFCurrency(totalBorrowed)}`, margin + (colObligW + 3) * 2 + 3, y + 9.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`Receivable: ${formatPDFCurrency(totalLent)}`, margin + (colObligW + 3) * 2 + 3, y + 14);

  y += 22;

  // Recent Transactions Ledger
  // If we have transactions, show them neatly with pagination
  if (transactions.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`TRANSACTION LEDGER (RECENT RECORDS — ${transactions.length} TOTAL)`, margin, y + 4);
    y += 6;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Date', margin + 3, y + 4);
    doc.text('Description', margin + 25, y + 4);
    doc.text('Category', margin + 85, y + 4);
    doc.text('Method', margin + 125, y + 4);
    doc.text('Amount (PHP)', pageWidth - margin - 3, y + 4, { align: 'right' });
    y += 5.5;

    // Sort descending by date
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Show up to 35 transactions in statement
    sortedTx.slice(0, 35).forEach((t, i) => {
      checkPageBreak(5.5);
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(t.date || '—', margin + 3, y + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const desc = (t.description || t.category || 'Transaction').length > 36
        ? `${(t.description || t.category || 'Transaction').substring(0, 34)}...`
        : t.description || t.category || 'Transaction';
      doc.text(desc, margin + 25, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(t.category, margin + 85, y + 3.8);
      doc.text(t.paymentMethod || 'Cash', margin + 125, y + 3.8);

      doc.setFont('helvetica', 'bold');
      if (t.type === 'INCOME') {
        doc.setTextColor(4, 120, 87);
        doc.text(`+${formatPDFCurrency(t.amount)}`, pageWidth - margin - 3, y + 3.8, { align: 'right' });
      } else {
        doc.setTextColor(190, 18, 60);
        doc.text(`-${formatPDFCurrency(t.amount)}`, pageWidth - margin - 3, y + 3.8, { align: 'right' });
      }

      y += 5.5;
    });

    if (sortedTx.length > 35) {
      checkPageBreak(6);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`... and ${sortedTx.length - 35} more records (export CSV for complete ledger).`, margin + 3, y + 4);
      y += 6;
    }
  }

  // Draw Footer on Every Page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `IponTa Personal Financial Organizer · Tara, Ipon Ta! · Ref #${docRef}`,
      margin,
      pageHeight - 7.5
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  }

  return doc;
};

/**
 * Downloads the jsPDF document as a file using standard HTML5 Blob anchor download.
 * Identical reliable mechanism as CSV and JSON export.
 */
export const downloadPDFBlob = (doc: jsPDF, filename: string): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
};

/**
 * Top-level export function that generates and immediately triggers download.
 */
export const exportFinancialReportPDF = (
  options: FinancialReportPDFOptions,
  customFilename?: string
): string => {
  const doc = generateFinancialReportPDF(options);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `IponTa_Financial_Report_${dateStr}.pdf`;
  downloadPDFBlob(doc, filename);
  return filename;
};
