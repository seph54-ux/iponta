import React from 'react';
import { AlertTriangle, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Reset Financial Data</h3>
              <p className="text-[11px] text-rose-100">Permanent Database Fresh Start</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-100 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to reset everything?</p>
              <p className="text-[11px] leading-relaxed">
                This will delete all recorded income, expenses, budgets, recurring bills, and installments, and reset account balances to <strong>₱0.00</strong>. This action cannot be undone.
              </p>
            </div>
          </div>

          <p className="text-slate-500 leading-relaxed">
            Resetting is recommended if you want to start tracking your real personal or household money from scratch without sample transactions.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onConfirmReset();
                onClose();
              }}
              className="py-2.5 px-4 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirm & Reset All to Zero</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
