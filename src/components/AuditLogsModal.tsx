import React from 'react';
import { History, X, ShieldCheck, FileSpreadsheet, Lock } from 'lucide-react';
import { AuditLog } from '../types';
import { formatDate } from '../utils/formatters';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Immutable Audit Trail & Data Security Logs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed record of all created, edited, and deleted financial entries
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Audit logs are read-only and automatically updated whenever records are added or modified.</span>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No audit logs recorded yet. Changes to transactions, budgets, or goals will appear here automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const isCreate = log.action === 'CREATE';
                const isUpdate = log.action === 'UPDATE';
                const isDelete = log.action === 'DELETE';

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isCreate
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isUpdate
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{log.entityType}</span>
                        <span className="text-slate-400">· {log.userName}</span>
                      </div>

                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="font-medium text-slate-900 dark:text-white pt-0.5">
                      {log.summary}
                    </p>

                    {log.previousValue && (
                      <div className="text-[10px] font-mono p-2 rounded bg-slate-50 dark:bg-slate-900 text-slate-500 overflow-x-auto truncate">
                        Previous state: {log.previousValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
