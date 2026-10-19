import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, Category, PaymentMethod, BudgetLimit, SavingsGoal, RecurringBill, Installment, DebtLoan, AuditLog, HouseholdMember, FinancialAccount, BudgetCycle } from './types';
import { StorageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { AuthScreen } from './components/AuthScreen';
import { PoliciesModal } from './components/PoliciesModal';
import { SpendingInsightsModal } from './components/SpendingInsightsModal';
import { ExpenseHeatmapModal } from './components/ExpenseHeatmapModal';
import { PaydayBudgetWizard } from './components/PaydayBudgetWizard';
import { TransactionModal } from './components/TransactionModal';
import { CSVExportImportModal } from './components/CSVExportImportModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { AutomatedTestsModal } from './components/AutomatedTestsModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { LogoutConfirmationModal } from './components/LogoutConfirmationModal';
import { FirstTimeWelcomeModal } from './components/FirstTimeWelcomeModal';
import { DashboardView } from './components/DashboardView';
import { BudgetsView } from './components/BudgetsView';
import { AccountsView } from './components/AccountsView';
import { TransactionsView } from './components/TransactionsView';
import { HouseholdBudgetView } from './components/HouseholdBudgetView';
import { FinancialHealthView } from './components/FinancialHealthView';
import { BillsAndInstallmentsView } from './components/BillsAndInstallmentsView';
import { SavingsAndDebtsView } from './components/SavingsAndDebtsView';
import { SettingsView } from './components/SettingsView';
import { CategoriesView } from './components/CategoriesView';
import { PDFReportGenerator } from './components/PDFReportGenerator';
import { exportFinancialReportPDF } from './utils/pdfReportService';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';

export default function App() {
  // User & Auth State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem('iponta_user_session') || localStorage.getItem('balanse_ph_user_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // Theme State (Night mode is default unless explicitly switched to Daylight mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('iponta_dark_mode') ?? localStorage.getItem('balanse_ph_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Night mode is the default theme
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('iponta_dark_mode', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  const handleToggleDarkMode = (targetMode?: boolean) => {
    const nextMode = typeof targetMode === 'boolean' ? targetMode : !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('iponta_dark_mode', nextMode ? 'true' : 'false');
    if (userProfile && userProfile.isDarkMode !== nextMode) {
      const updated = { ...userProfile, isDarkMode: nextMode };
      setUserProfile(updated);
      localStorage.setItem('iponta_user_session', JSON.stringify(updated));
      storage.updateUserProfile(updated).catch(console.warn);
    }
  };

  // Active View Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal States
  const [showPoliciesModal, setShowPoliciesModal] = useState<boolean>(false);
  const [showSpendingInsights, setShowSpendingInsights] = useState<boolean>(false);
  const [showExpenseHeatmap, setShowExpenseHeatmap] = useState<boolean>(false);
  const [showPaydayWizard, setShowPaydayWizard] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showCSVModal, setShowCSVModal] = useState<boolean>(false);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState<boolean>(false);
  const [showTestsModal, setShowTestsModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState<boolean>(false);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Storage Service Instance
  const currentUserId = userProfile?.id || 'guest_user';
  const storage = new StorageService(currentUserId);

  // App Data States
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [budgetCycles, setBudgetCycles] = useState<BudgetCycle[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [debts, setDebts] = useState<DebtLoan[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load user data on startup or profile change
  const reloadData = () => {
    if (!userProfile) return;
    storage.seedSamplePHData(userProfile.username);
    setAccounts(storage.getAccounts());
    setTransactions(storage.getTransactions());
    setCategories(storage.getCategories());
    setPaymentMethods(storage.getPaymentMethods());
    setBudgets(storage.getBudgets());
    setBudgetCycles(storage.getBudgetCycles());
    setSavingsGoals(storage.getSavingsGoals());
    setBills(storage.getRecurringBills());
    setInstallments(storage.getInstallments());
    setDebts(storage.getDebts());
    setHouseholdMembers(storage.getHouseholdMembers());
    setAuditLogs(storage.getAuditLogs());

    // Synchronize live with Supabase PostgreSQL tables in the background
    storage.pullFromSupabase().then((hasRemoteUpdates) => {
      if (hasRemoteUpdates) {
        setAccounts(storage.getAccounts());
        setTransactions(storage.getTransactions());
        setCategories(storage.getCategories());
        setPaymentMethods(storage.getPaymentMethods());
        setBudgets(storage.getBudgets());
        setBudgetCycles(storage.getBudgetCycles());
        setSavingsGoals(storage.getSavingsGoals());
        setBills(storage.getRecurringBills());
        setInstallments(storage.getInstallments());
        setDebts(storage.getDebts());
        setHouseholdMembers(storage.getHouseholdMembers());
        setAuditLogs(storage.getAuditLogs());
      }
    }).catch((err) => {
      console.warn('Supabase sync check warning:', err);
    });
  };

  useEffect(() => {
    reloadData();
  }, [currentUserId]);

  // First-time user welcome setup prompt
  useEffect(() => {
    if (userProfile) {
      const promptedKey = `iponta_prompted_fresh_${userProfile.id}`;
      const legacyKey = `balanse_ph_prompted_fresh_${userProfile.id}`;
      if (!localStorage.getItem(promptedKey) && !localStorage.getItem(legacyKey)) {
        setShowFirstTimeWelcome(true);
      }
    }
  }, [userProfile?.id]);

  // Auth Success Handler
  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('iponta_user_session', JSON.stringify(profile));
    if (typeof profile.isDarkMode === 'boolean') {
      setIsDarkMode(profile.isDarkMode);
    }
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('iponta_user_session', JSON.stringify(updatedProfile));
    // Persist new username and preferences to database & local accounts vault
    await storage.updateUserProfile(updatedProfile);
  };

  const handlePromptLogout = () => {
    setShowLogoutConfirmModal(true);
  };

  const handleConfirmLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('iponta_user_session');
    localStorage.removeItem('balanse_ph_user_session');
    setShowLogoutConfirmModal(false);
  };

  const handleFirstTimeStartFresh = () => {
    if (userProfile) {
      storage.resetAllDataToZero(userProfile.username);
      reloadData();
      localStorage.setItem(`iponta_prompted_fresh_${userProfile.id}`, 'true');
    }
    setShowFirstTimeWelcome(false);
  };

  const handleFirstTimeKeepSample = () => {
    if (userProfile) {
      localStorage.setItem(`iponta_prompted_fresh_${userProfile.id}`, 'true');
    }
    setShowFirstTimeWelcome(false);
  };

  const handleConfirmResetAll = () => {
    if (userProfile) {
      storage.resetAllDataToZero(userProfile.username);
      reloadData();
    }
  };

  // If NOT logged in, show Auth Screen before dashboard
  if (!userProfile) {
    return (
      <>
        <OfflineSyncBanner storage={storage} onSyncComplete={reloadData} />
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenPolicies={() => setShowPoliciesModal(true)}
        />
        <PoliciesModal
          isOpen={showPoliciesModal}
          onClose={() => setShowPoliciesModal(false)}
        />
      </>
    );
  }

  // Transaction Handlers
  const handleSaveTransaction = (transactionData: Partial<Transaction>) => {
    storage.saveTransaction(
      {
        id: transactionData.id || 'tx_' + Date.now(),
        userId: currentUserId,
        type: transactionData.type || 'EXPENSE',
        amount: transactionData.amount || 0,
        category: transactionData.category || (transactionData.type === 'TRANSFER' ? 'Transfer' : 'General'),
        paymentMethod: transactionData.paymentMethod || (accounts[0]?.name || 'GCash'),
        toAccount: transactionData.toAccount,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        time: transactionData.time,
        description: transactionData.description || 'Transaction',
        notes: transactionData.notes,
        isShared: transactionData.isShared || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      userProfile?.username || 'User'
    );
    reloadData();
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    storage.deleteTransaction(id, userProfile?.username || 'User');
    reloadData();
  };

  // Category Handlers
  const handleSaveCategory = (cat: Category) => {
    storage.saveCategory(cat);
    reloadData();
  };

  const handleDeleteCategory = (id: string) => {
    storage.deleteCategory(id);
    reloadData();
  };

  // Account Handlers
  const handleSaveAccount = (acc: FinancialAccount) => {
    storage.saveAccount(acc);
    reloadData();
  };

  const handleDeleteAccount = (id: string) => {
    storage.deleteAccount(id);
    reloadData();
  };

  // Budget Handlers
  const handleSaveBudget = (b: BudgetLimit) => {
    storage.saveBudget(b);
    reloadData();
  };

  const handleDeleteBudget = (budgetId: string) => {
    storage.deleteBudget(budgetId);
    reloadData();
  };

  const handleSaveBudgetsBulk = (budgetsList: BudgetLimit[]) => {
    storage.saveBudgetsBulk(budgetsList);
    reloadData();
  };

  const handleSaveBudgetCycle = (cycle: BudgetCycle) => {
    storage.saveBudgetCycle(cycle);
    reloadData();
  };

  const handleDeleteBudgetCycle = (cycleId: string) => {
    storage.deleteBudgetCycle(cycleId);
    reloadData();
  };


  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12181F] text-[#2C3E35] dark:text-[#E2E8F0] font-sans flex flex-col transition-colors duration-200 overflow-x-hidden">
      
      {/* Offline Connectivity & Auto-Sync Banner */}
      <OfflineSyncBanner storage={storage} onSyncComplete={reloadData} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setShowTransactionModal(true);
        }}
        onOpenSpendingInsights={() => setShowSpendingInsights(true)}
        onOpenExpenseHeatmap={() => setShowExpenseHeatmap(true)}
        onOpenCSVModal={() => setShowCSVModal(true)}
        onOpenAuditLogs={() => setShowAuditLogsModal(true)}
        onOpenTestsModal={() => setShowTestsModal(true)}
        onOpenPolicies={() => setShowPoliciesModal(true)}
        onLogout={handlePromptLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row lg:items-start gap-6">
        
        {/* Navigation Sidebar (Desktop view) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSpendingInsights={() => setShowSpendingInsights(true)}
          onOpenExpenseHeatmap={() => setShowExpenseHeatmap(true)}
          onOpenCSVModal={() => setShowCSVModal(true)}
          onOpenAuditLogs={() => setShowAuditLogsModal(true)}
          onOpenPolicies={() => setShowPoliciesModal(true)}
          onOpenTestsModal={() => setShowTestsModal(true)}
          onLogout={handlePromptLogout}
        />

        {/* View Content Canvas */}
        <div className="flex-1 space-y-6 w-full min-w-0">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              accounts={accounts}
              bills={bills}
              installments={installments}
              savingsGoals={savingsGoals}
              budgets={budgets}
              budgetCycles={budgetCycles}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
              onOpenPaydayWizard={() => setShowPaydayWizard(true)}
              onOpenSpendingInsights={() => setShowSpendingInsights(true)}
              onOpenExpenseHeatmap={() => setShowExpenseHeatmap(true)}
              onNavigateTab={setActiveTab}
              onOpenResetConfirmation={() => setShowResetConfirmModal(true)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              budgetCycles={budgetCycles}
              categories={categories}
              transactions={transactions}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              onSaveBudgetsBulk={handleSaveBudgetsBulk}
              onSaveBudgetCycle={handleSaveBudgetCycle}
              onDeleteBudgetCycle={handleDeleteBudgetCycle}
              onSaveCategory={handleSaveCategory}
              userId={currentUserId}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView
              accounts={accounts}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              userId={currentUserId}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              paymentMethods={paymentMethods}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setShowTransactionModal(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'payday' && (
            <div className="space-y-6">
              <PaydayBudgetWizard isEmbedded={true} />

              <PDFReportGenerator
                userName={userProfile?.username || 'Pinoy User'}
                transactions={transactions}
                budgets={budgets}
                bills={bills}
                installments={installments}
                debts={debts}
                accounts={accounts}
              />
            </div>
          )}

          {activeTab === 'bills' && (
            <BillsAndInstallmentsView
              bills={bills}
              installments={installments}
              accounts={accounts}
              onToggleBillPaid={(billId) => {
                const target = bills.find(b => b.id === billId);
                if (target) {
                  storage.saveRecurringBill({ ...target, isPaidThisMonth: !target.isPaidThisMonth });
                  reloadData();
                }
              }}
              onPayBillWithTransaction={(bill, amount, paymentMethod, date, notes) => {
                storage.saveTransaction(
                  {
                    id: 'tx_bill_' + Date.now(),
                    userId: currentUserId,
                    type: 'EXPENSE',
                    amount: amount,
                    category: bill.category || 'Utilities & Monthly Bills',
                    paymentMethod: paymentMethod,
                    date: date || new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5),
                    description: `Bill Payment: ${bill.title}`,
                    notes: notes || `Monthly utility payment for ${bill.title}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  userProfile?.username || 'User'
                );
                storage.saveRecurringBill({ ...bill, isPaidThisMonth: true });
                reloadData();
              }}
              onAddBill={(bill) => {
                storage.saveRecurringBill(bill);
                reloadData();
              }}
              onDeleteBill={(billId) => {
                storage.deleteRecurringBill(billId);
                reloadData();
              }}
              onAddInstallment={(inst) => {
                storage.saveInstallment(inst);
                reloadData();
              }}
              onIncrementInstallmentMonth={(instId) => {
                const target = installments.find(i => i.id === instId);
                if (target && target.paidMonths < target.totalMonths) {
                  storage.saveInstallment({ ...target, paidMonths: target.paidMonths + 1 });
                  reloadData();
                }
              }}
              onPayInstallmentWithTransaction={(installment, amount, paymentMethod, date, notes) => {
                const nextMonth = installment.paidMonths + 1;
                storage.saveTransaction(
                  {
                    id: 'tx_inst_' + Date.now(),
                    userId: currentUserId,
                    type: 'EXPENSE',
                    amount: amount,
                    category: installment.category || 'Installments & PayLater',
                    paymentMethod: paymentMethod,
                    date: date || new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5),
                    description: `Installment: ${installment.merchantName} - ${installment.itemName} (Mo. ${nextMonth}/${installment.totalMonths})`,
                    notes: notes || `Monthly installment payment for ${installment.itemName} via ${installment.merchantName}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  userProfile?.username || 'User'
                );
                storage.saveInstallment({
                  ...installment,
                  paidMonths: Math.min(installment.totalMonths, installment.paidMonths + 1),
                });
                reloadData();
              }}
              onDeleteInstallment={(instId) => {
                storage.deleteInstallment(instId);
                reloadData();
              }}
              userId={currentUserId}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsAndDebtsView
              savingsGoals={savingsGoals}
              debts={debts}
              accounts={accounts}
              onAddSavingsGoal={(goal) => {
                storage.saveSavingsGoal(goal);
                reloadData();
              }}
              onUpdateGoalAmount={(goalId, added) => {
                const target = savingsGoals.find(g => g.id === goalId);
                if (target) {
                  storage.saveSavingsGoal({ ...target, currentAmount: target.currentAmount + added });
                  reloadData();
                }
              }}
              onDepositToGoalWithTransaction={(goal, amount, fromAccount, notes) => {
                storage.saveTransaction(
                  {
                    id: 'tx_sg_' + Date.now(),
                    userId: currentUserId,
                    type: 'TRANSFER',
                    amount: amount,
                    category: 'Savings & Investments',
                    paymentMethod: fromAccount,
                    toAccount: `Goal: ${goal.title}`,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5),
                    description: `Savings Deposit: ${goal.title}`,
                    notes: notes || `Direct deposit into ${goal.title} savings goal`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  userProfile?.username || 'User'
                );
                reloadData();
              }}
              onDeleteSavingsGoal={(goalId) => {
                storage.deleteSavingsGoal(goalId);
                reloadData();
              }}
              onAddDebt={(debt) => {
                storage.saveDebt(debt);
                reloadData();
              }}
              onPayDebtWithTransaction={(debt, paymentAmount, fromAccount, notes) => {
                storage.saveTransaction(
                  {
                    id: 'tx_debt_' + Date.now(),
                    userId: currentUserId,
                    type: 'EXPENSE',
                    amount: paymentAmount,
                    category: 'Loan Repayments',
                    paymentMethod: fromAccount,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5),
                    description: `Debt Payment: ${debt.partyName}`,
                    notes: notes || `Payment for debt/loan: ${debt.partyName}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  userProfile?.username || 'User'
                );
                const newRemaining = Math.max(0, debt.remainingAmount - paymentAmount);
                storage.saveDebt({
                  ...debt,
                  remainingAmount: newRemaining,
                });
                reloadData();
              }}
              onCollectDebtWithTransaction={(debt, collectedAmount, toAccount, notes) => {
                storage.saveTransaction(
                  {
                    id: 'tx_coll_' + Date.now(),
                    userId: currentUserId,
                    type: 'INCOME',
                    amount: collectedAmount,
                    category: 'Loan Repayments',
                    paymentMethod: toAccount,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5),
                    description: `Debt Collected: ${debt.partyName}`,
                    notes: notes || `Payment collected from ${debt.partyName}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  userProfile?.username || 'User'
                );
                const newRemaining = Math.max(0, debt.remainingAmount - collectedAmount);
                storage.saveDebt({
                  ...debt,
                  remainingAmount: newRemaining,
                });
                reloadData();
              }}
              onReopenDebt={(debt) => {
                storage.saveDebt({
                  ...debt,
                  remainingAmount: debt.originalAmount,
                });
                reloadData();
              }}
              onDeleteDebt={(debtId) => {
                storage.deleteDebt(debtId);
                reloadData();
              }}
              userId={currentUserId}
            />
          )}

          {activeTab === 'household' && (
            <HouseholdBudgetView
              transactions={transactions}
              members={householdMembers}
              onSaveMembers={(m) => {
                storage.saveHouseholdMembers(m);
                reloadData();
              }}
              onAddSharedExpense={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
            />
          )}

          {activeTab === 'health' && (
            <FinancialHealthView
              transactions={transactions}
              bills={bills}
              installments={installments}
              debts={debts}
              savingsGoals={savingsGoals}
              accounts={accounts}
              budgets={budgets}
              budgetCycles={budgetCycles}
              categories={categories}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenPaydayWizard={() => setShowPaydayWizard(true)}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenPolicies={() => setShowPoliciesModal(true)}
              onOpenResetConfirmation={() => setShowResetConfirmModal(true)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}

        </div>

      </main>

      {/* Footer */}
      <Footer
        onOpenPolicies={() => setShowPoliciesModal(true)}
        onOpenCSVModal={() => setShowCSVModal(true)}
        onOpenAuditLogs={() => setShowAuditLogsModal(true)}
      />

      {/* Modals & Overlays */}
      <FirstTimeWelcomeModal
        isOpen={showFirstTimeWelcome}
        userName={userProfile.username}
        onStartFresh={handleFirstTimeStartFresh}
        onExploreWithSampleData={handleFirstTimeKeepSample}
      />

      <ResetConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirmReset={handleConfirmResetAll}
      />

      <LogoutConfirmationModal
        isOpen={showLogoutConfirmModal}
        onClose={() => setShowLogoutConfirmModal(false)}
        onConfirmLogout={handleConfirmLogout}
        username={userProfile?.username}
      />

      <PoliciesModal
        isOpen={showPoliciesModal}
        onClose={() => setShowPoliciesModal(false)}
      />

      <SpendingInsightsModal
        isOpen={showSpendingInsights}
        onClose={() => setShowSpendingInsights(false)}
        transactions={transactions}
        budgets={budgets}
      />

      <ExpenseHeatmapModal
        isOpen={showExpenseHeatmap}
        onClose={() => setShowExpenseHeatmap(false)}
        transactions={transactions}
      />

      <PaydayBudgetWizard
        isOpen={showPaydayWizard}
        onClose={() => setShowPaydayWizard(false)}
      />

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
        savingsGoals={savingsGoals}
      />

      <CSVExportImportModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        transactions={transactions}
        onImportTransactions={(imported) => {
          imported.forEach(t => storage.saveTransaction(t, userProfile?.username || 'User'));
          reloadData();
        }}
        onExportFullJson={() => {
          const json = storage.exportBackupData();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `IponTa_Dataset_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        onExportPDF={() => {
          exportFinancialReportPDF({
            userName: userProfile?.username || 'Pinoy User',
            transactions,
            budgets,
            bills,
            installments,
            debts,
            accounts,
          });
        }}
      />

      <AuditLogsModal
        isOpen={showAuditLogsModal}
        onClose={() => setShowAuditLogsModal(false)}
        logs={auditLogs}
      />

      <AutomatedTestsModal
        isOpen={showTestsModal}
        onClose={() => setShowTestsModal(false)}
      />

    </div>
  );
}
