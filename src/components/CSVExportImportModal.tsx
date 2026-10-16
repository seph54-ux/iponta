import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, X, FileText, Code } from 'lucide-react';
import { Transaction } from '../types';

interface CSVExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[]) => void;
  onExportFullJson: () => void;
  onExportPDF?: () => void;
}

export const CSVExportImportModal: React.FC<CSVExportImportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onImportTransactions,
  onExportFullJson,
  onExportPDF,
}) => {
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string }>({});

  if (!isOpen) return null;

  // Export Transactions to CSV (Excel compatible)
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Subcategory', 'PaymentMethod', 'Description', 'Notes', 'IsShared'];
    const rows = transactions.map(t => [
      t.date,
      t.type,
      t.amount,
      `"${t.category}"`,
      `"${t.subcategory || ''}"`,
      `"${t.paymentMethod}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.isShared ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IponTa_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          setImportStatus({ success: false, message: 'CSV file must contain a header row and at least 1 record row.' });
          return;
        }

        const parsed: Transaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 4) {
            const date = cols[0] || new Date().toISOString().split('T')[0];
            const type = (cols[1]?.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE');
            const amount = parseFloat(cols[2]) || 0;
            const category = cols[3] || 'General';
            const description = cols[6] || cols[3] || 'Imported Entry';

            if (amount > 0) {
              parsed.push({
                id: 'imp_' + Date.now() + '_' + i,
                userId: 'user',
                type,
                amount,
                category,
                paymentMethod: cols[5] || 'Cash',
                date,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        if (parsed.length > 0) {
          onImportTransactions(parsed);
          setImportStatus({ success: true, message: `Successfully imported ${parsed.length} transaction records!` });
        } else {
          setImportStatus({ success: false, message: 'Could not parse valid transaction records from CSV file.' });
        }
      } catch (err: any) {
        setImportStatus({ success: false, message: 'Error reading CSV file: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                CSV, Excel & JSON Export Tools
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export records for accounting, Excel analysis, or JSON data reporting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {importStatus.message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Section 1: CSV & Excel Export / Import */}
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>CSV / Excel Format</span>
            </h3>
            <p className="text-xs text-slate-500">
              Export all your transactions to standard CSV spreadsheet format readable in Microsoft Excel or Google Sheets.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleExportCSV}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV ({transactions.length} Records)</span>
              </button>

              <label className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Import CSV File</span>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Section 2: JSON Export */}
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-600" />
              <span>Structured JSON Export</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download complete structured JSON dataset containing all account balances, budgets, bills, and transactions.
            </p>

            <button
              onClick={onExportFullJson}
              className="w-full py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Full Structured JSON</span>
            </button>
          </div>

          {/* Section 3: PDF Financial Statement */}
          {onExportPDF && (
            <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>PDF Financial Summary Statement</span>
              </h3>
              <p className="text-xs text-slate-500">
                Download a clean, printable vector PDF statement summarizing income, expenses, accounts, and obligations.
              </p>

              <button
                onClick={onExportPDF}
                className="w-full py-2.5 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF Financial Statement</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
