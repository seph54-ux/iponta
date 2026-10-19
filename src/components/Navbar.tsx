import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Landmark,
  Tag,
  Receipt,
  Wallet,
  Sparkles,
  CreditCard,
  PiggyBank,
  Users,
  Activity,
  TrendingUp,
  Flame,
  FileSpreadsheet,
  History,
  ShieldCheck,
  Cpu,
  ChevronDown,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onOpenNewTransaction: () => void;
  onOpenSpendingInsights?: () => void;
  onOpenExpenseHeatmap?: () => void;
  onOpenCSVModal?: () => void;
  onOpenAuditLogs?: () => void;
  onOpenTestsModal?: () => void;
  onOpenPolicies?: () => void;
  onLogout: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: (targetMode?: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onOpenNewTransaction,
  onOpenSpendingInsights,
  onOpenExpenseHeatmap,
  onOpenCSVModal,
  onOpenAuditLogs,
  onOpenTestsModal,
  onOpenPolicies,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isOnline, isSyncing, pendingCount } = useOnlineStatus();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    if (moreDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [moreDropdownOpen]);

  // Primary 4 frequent views displayed directly in top bar
  const primaryNavTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budget Cycles', icon: Wallet },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
  ];

  // Secondary views housed in the clean "More Views" dropdown
  const secondaryNavTabs = [
    { id: 'payday', label: 'Payday Budgeter', description: 'Cutoff envelope & income allocation', icon: Sparkles },
    { id: 'bills', label: 'Bills & Installments', description: 'Recurring utilities & BNPL monitor', icon: CreditCard },
    { id: 'savings', label: 'Savings & Debts', description: 'Emergency funds & loans payoff', icon: PiggyBank },
    { id: 'household', label: 'Household Budget', description: 'Shared family contribution tracker', icon: Users },
    { id: 'categories', label: 'Categories', description: 'Custom income & expense tags', icon: Tag },
    { id: 'health', label: 'Financial Health', description: 'Net worth & financial health score', icon: Activity },
    { id: 'settings', label: 'Settings & Profile', description: 'Preferences, currency & theme', icon: Settings },
  ];

  // All navigation items for mobile drawer
  const allNavTabs = [
    ...primaryNavTabs,
    ...secondaryNavTabs,
  ];

  const activeSecondaryTab = secondaryNavTabs.find(tab => tab.id === activeTab);

  const handleMobileNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleSecondaryNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMoreDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 dark:bg-[#12181F]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
          title="IponTa – Tara, Ipon Ta!"
        >
          <span className="w-8 h-8 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {userProfile?.currencySymbol || '₱'}
          </span>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight leading-none text-base">IponTa</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold tracking-normal leading-tight hidden sm:inline">Tara, Ipon Ta!</span>
          </div>
        </a>

        {/* Zone 2: Streamlined Desktop Navigation (Uncluttered Primary + More Views Dropdown) */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          
          {/* Primary core tabs */}
          {primaryNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* More Views Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs font-semibold ${
                activeSecondaryTab
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/60 dark:border-emerald-800 shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
              }`}
            >
              {activeSecondaryTab ? (
                <>
                  <activeSecondaryTab.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{activeSecondaryTab.label}</span>
                </>
              ) : (
                <span>More Views</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Panel */}
            {moreDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Additional Tools & Trackers
                </div>
                {secondaryNavTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSecondaryNavClick(tab.id)}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs leading-tight">{tab.label}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{tab.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </nav>

        {/* Zone 3: Primary Actions (Theme icon cleanly removed) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Connectivity Status Indicator */}
          {!isOnline ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80"
              title="Offline Mode: All edits and records are stored locally"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Offline</span>
            </div>
          ) : isSyncing ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border border-teal-300/80 dark:border-teal-700/80 animate-pulse"
              title="Synchronizing data with cloud"
            >
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-teal-600 dark:text-teal-400" />
              <span>Syncing</span>
            </div>
          ) : pendingCount > 0 ? (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              title={`${pendingCount} changes waiting to sync`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>{pendingCount} Queued</span>
            </div>
          ) : (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
              title="Cloud Connected & Synced"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Synced</span>
            </div>
          )}

          {/* Quick Add Record Button */}
          <button
            onClick={onOpenNewTransaction}
            className="px-3 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Record</span>
          </button>

          {/* Quick Theme Toggle Button */}
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={() => onToggleDarkMode()}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
              title={isDarkMode ? 'Switch to Daylight Clean (Day Mode)' : 'Switch to Midnight Slate (Night Mode)'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          )}

          {/* User Profile Badge (Desktop) */}
          {userProfile && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                title="Account Settings & Theme"
              >
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{userProfile.username}</span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button (< lg screens) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-200/60 dark:bg-slate-800/60 transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile & Tablet Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#1E293B]/98 backdrop-blur-xl px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl max-h-[85vh] overflow-y-auto">
          
          {/* Core Navigation Views */}
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Core Tracker Navigation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMobileNavClick(tab.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial Tools Section in Hamburger Drawer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <p className="px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Financial Tools & Utilities
            </p>

            {onOpenSpendingInsights && (
              <button
                onClick={() => { onOpenSpendingInsights(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Spending Insights</span>
              </button>
            )}

            {onOpenExpenseHeatmap && (
              <button
                onClick={() => { onOpenExpenseHeatmap(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Expense Heatmap</span>
              </button>
            )}

            {onOpenCSVModal && (
              <button
                onClick={() => { onOpenCSVModal(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>CSV, Excel & JSON Export</span>
              </button>
            )}

            {onOpenAuditLogs && (
              <button
                onClick={() => { onOpenAuditLogs(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>Security Audit Trail</span>
              </button>
            )}

            {onOpenTestsModal && (
              <button
                onClick={() => { onOpenTestsModal(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-slate-400" />
                <span>Automated Calc Tests</span>
              </button>
            )}

            <div className="pt-2 pb-1">
              <PWAInstallButton />
            </div>

            {onOpenPolicies && (
              <button
                onClick={() => { onOpenPolicies(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Policies & Legal T&C</span>
              </button>
            )}
          </div>

          {/* Theme Quick Switcher in Mobile Drawer */}
          {onToggleDarkMode && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {isDarkMode ? 'Midnight Slate' : 'Daylight Clean'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isDarkMode ? 'Night Mode Active' : 'Day Mode Active'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleDarkMode()}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
              >
                Switch
              </button>
            </div>
          )}

          {/* User Account Controls */}
          {userProfile && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{userProfile.username}</p>
                  <p className="text-[10px] text-slate-400 truncate">{userProfile.email}</p>
                </div>
              </div>

              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="py-1.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

        </div>
      )}

    </header>
  );
};
