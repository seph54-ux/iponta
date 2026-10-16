import React from 'react';
import { Sparkles, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

interface FirstTimeWelcomeModalProps {
  isOpen: boolean;
  userName: string;
  onStartFresh: () => void;
  onExploreWithSampleData: () => void;
}

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  userName,
  onStartFresh,
  onExploreWithSampleData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Hero */}
        <div className="p-8 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/20 shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Maligayang Pagdating, {userName}!</h2>
          <p className="text-sm font-bold text-emerald-200 mt-1">Tara, Ipon Ta!</p>
          <p className="text-xs text-emerald-100/90 max-w-sm mx-auto leading-relaxed mt-1">
            Welcome to IponTa — your friendly Filipino personal finance and budget companion.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          <div className="space-y-3">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              How would you like to set up your account workspace today?
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              
              {/* Option 1: Start Fresh */}
              <button
                type="button"
                onClick={onStartFresh}
                className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/80 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/80 text-left transition-all group flex items-start gap-3.5"
              >
                <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5 shadow-xs">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300 flex items-center gap-1.5 text-xs">
                    <span>Start Fresh (Recommended)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">Clean ₱0</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clears sample transactions so you can immediately input your actual cash balances and real expenses.
                  </p>
                </div>
              </button>

              {/* Option 2: Explore Sample Data */}
              <button
                type="button"
                onClick={onExploreWithSampleData}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group flex items-start gap-3.5"
              >
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300 text-xs">
                    Explore with Sample Data First
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keep preloaded Philippine sample records to test out charts, payday wizard, and PDF report features first. (You can reset anytime later!)
                  </p>
                </div>
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
