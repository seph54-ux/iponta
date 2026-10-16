import React from 'react';
import { ShieldCheck, Lock, Info, FileText } from 'lucide-react';

interface FooterProps {
  onOpenPolicies: () => void;
  onOpenCSVModal: () => void;
  onOpenAuditLogs: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicies,
  onOpenCSVModal,
  onOpenAuditLogs,
}) => {
  return (
    <footer className="w-full mt-12 bg-white/60 dark:bg-[#12181F]/60 border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Prominent Financial Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Important Disclaimer Notice
            </p>
            <p className="text-[11px] leading-relaxed">
              IponTa is purely a personal and household financial organizing and budget tracking software tool. <strong className="text-slate-900 dark:text-white">It is NOT a bank, direct transaction gateway, e-wallet, payment processor, or licensed financial institution.</strong> IponTa does not process monetary transfers, handle real funds, or provide banking services. All figures are rendered for user organizational clarity only.
            </p>
          </div>
        </div>

        {/* Links & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 pt-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">IponTa</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">· Tara, Ipon Ta!</span>
            <span className="hidden md:inline">· Personal & Household Financial Organizer</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={onOpenPolicies}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 font-medium underline transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Policies & T&C</span>
            </button>

            <button
              onClick={onOpenCSVModal}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
            >
              CSV / Excel Backup
            </button>

            <button
              onClick={onOpenAuditLogs}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
            >
              Audit Trail
            </button>

            <span>© {new Date().getFullYear()} IponTa · Tara, Ipon Ta!</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
