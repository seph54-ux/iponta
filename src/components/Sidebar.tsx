import React from 'react';
import { LayoutDashboard, Landmark, Tag, Receipt, Wallet, Sparkles, CreditCard, PiggyBank, Users, Activity, TrendingUp, Flame, FileSpreadsheet, History, ShieldCheck, Cpu, Settings, LogOut } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSpendingInsights: () => void;
  onOpenExpenseHeatmap: () => void;
  onOpenCSVModal: () => void;
  onOpenAuditLogs: () => void;
  onOpenPolicies: () => void;
  onOpenTestsModal: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSpendingInsights,
  onOpenExpenseHeatmap,
  onOpenCSVModal,
  onOpenAuditLogs,
  onOpenPolicies,
  onOpenTestsModal,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budget Cycles', icon: Wallet },
    { id: 'accounts', label: 'Money Accounts', icon: Landmark },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'transactions', label: 'Transactions Log', icon: Receipt },
    { id: 'payday', label: 'Payday Budgeter', icon: Sparkles },
    { id: 'bills', label: 'Bills & Installments', icon: CreditCard },
    { id: 'savings', label: 'Savings & Debts', icon: PiggyBank },
    { id: 'household', label: 'Household Budget', icon: Users },
    { id: 'health', label: 'Financial Health', icon: Activity },
    { id: 'settings', label: 'Settings & Profile', icon: Settings },
  ];

  return (
    <aside className="hidden lg:block w-64 h-fit self-start bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-5 shrink-0 shadow-xs">
      
      {/* Brand Hero Card in Sidebar */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
          ₱
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">IponTa</p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">Tara, Ipon Ta!</p>
        </div>
      </div>

      {/* Primary Views Section */}
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Core Tracker Views
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tools & Utilities Section */}
      <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Financial Tools
        </p>

        <button
          onClick={onOpenSpendingInsights}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Spending Insights</span>
        </button>

        <button
          onClick={onOpenExpenseHeatmap}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Expense Heatmap</span>
        </button>

        <button
          onClick={onOpenCSVModal}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>CSV, Excel & Export</span>
        </button>

        <button
          onClick={onOpenAuditLogs}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <History className="w-4 h-4 text-slate-400" />
          <span>Security Audit Trail</span>
        </button>

        <button
          onClick={onOpenTestsModal}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <Cpu className="w-4 h-4 text-slate-400" />
          <span>Automated Calc Tests</span>
        </button>
      </div>

      {/* PWA Install, Policies & Logout */}
      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <PWAInstallButton />

        <button
          onClick={onOpenPolicies}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Policies & Legal T&C</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Sign Out / Logout</span>
        </button>
      </div>

    </aside>
  );
};
