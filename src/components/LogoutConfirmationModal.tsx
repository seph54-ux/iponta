import React from 'react';
import { LogOut, X, AlertCircle } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  username?: string;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  username,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
      >
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <LogOut className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 id="logout-dialog-title" className="text-base font-bold">Confirm Sign Out</h3>
              <p className="text-[11px] text-slate-300">Leaving IponTa · Tara, Ipon Ta!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to log out{username ? `, ${username}` : ''}?</p>
              <p className="text-[11px] leading-relaxed">
                Your transactions, accounts, and financial records remain safe and synchronized. You will need to sign in again to access your dashboard.
              </p>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            Make sure you have saved any open inputs or drafts before ending your active tracking session.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Stay Logged In
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onConfirmLogout();
              }}
              className="py-2.5 px-4 font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Yes, Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
