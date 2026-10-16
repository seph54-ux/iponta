import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Tag,
  Search,
  Sparkles,
  Utensils,
  ShoppingCart,
  Zap,
  Home,
  Car,
  Activity,
  CreditCard,
  Landmark,
  ShoppingBag,
  GraduationCap,
  PiggyBank,
  Coffee,
  Heart,
  Smartphone,
  Plane,
  Gift,
  DollarSign,
  Briefcase,
  X,
  Check,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Sliders,
  Layers
} from 'lucide-react';
import { BudgetLimit, Category, Transaction, BudgetCycle, BudgetCycleType } from '../types';
import { formatPeso } from '../utils/formatters';

interface BudgetsViewProps {
  budgets: BudgetLimit[];
  budgetCycles: BudgetCycle[];
  categories: Category[];
  transactions: Transaction[];
  onSaveBudget: (budget: BudgetLimit) => void;
  onDeleteBudget: (budgetId: string) => void;
  onSaveBudgetsBulk: (budgets: BudgetLimit[]) => void;
  onSaveBudgetCycle: (cycle: BudgetCycle) => void;
  onDeleteBudgetCycle: (cycleId: string) => void;
  onSaveCategory?: (cat: Category) => void;
  userId: string;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  ShoppingCart,
  Zap,
  Home,
  Car,
  Activity,
  CreditCard,
  Landmark,
  ShoppingBag,
  GraduationCap,
  PiggyBank,
  Coffee,
  Heart,
  Smartphone,
  Plane,
  Gift,
  DollarSign,
  Briefcase,
  Tag,
};

// Common Filipino household budget presets
const DEFAULT_PRESET_CATEGORIES = [
  { name: 'Food & Dining Out', iconName: 'Utensils', colorHex: '#EA580C', defaultLimit: 5000 },
  { name: 'Groceries & Wet Market', iconName: 'ShoppingCart', colorHex: '#059669', defaultLimit: 6000 },
  { name: 'Utilities & Bills', iconName: 'Zap', colorHex: '#F59E0B', defaultLimit: 3500 },
  { name: 'Rent & Housing', iconName: 'Home', colorHex: '#2563EB', defaultLimit: 7500 },
  { name: 'Transportation & Fuel', iconName: 'Car', colorHex: '#7C3AED', defaultLimit: 2500 },
  { name: 'Healthcare & Medicines', iconName: 'Activity', colorHex: '#E11D48', defaultLimit: 1500 },
  { name: 'Personal & Shopping', iconName: 'ShoppingBag', colorHex: '#EC4899', defaultLimit: 2000 },
  { name: 'Savings & Investments', iconName: 'PiggyBank', colorHex: '#84CC16', defaultLimit: 4000 },
  { name: 'Installments & PayLater', iconName: 'CreditCard', colorHex: '#4F46E5', defaultLimit: 2500 },
  { name: 'Emergency Fund', iconName: 'Landmark', colorHex: '#0F172A', defaultLimit: 2500 },
];

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  budgetCycles,
  categories,
  transactions,
  onSaveBudget,
  onDeleteBudget,
  onSaveBudgetsBulk,
  onSaveBudgetCycle,
  onDeleteBudgetCycle,
  onSaveCategory,
  userId,
}) => {
  // Sort budget cycles by startDate descending
  const sortedCycles = useMemo(() => {
    return [...budgetCycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [budgetCycles]);

  // Current today string
  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Determine active default cycle (one covering today, or most recent)
  const defaultSelectedCycleId = useMemo(() => {
    if (sortedCycles.length === 0) return '';
    const active = sortedCycles.find(c => c.startDate <= todayStr && c.endDate >= todayStr);
    return active ? active.id : sortedCycles[0].id;
  }, [sortedCycles, todayStr]);

  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => defaultSelectedCycleId || (sortedCycles[0]?.id ?? ''));

  // Sync if cycles change
  React.useEffect(() => {
    if ((!selectedCycleId || !sortedCycles.some(c => c.id === selectedCycleId)) && sortedCycles.length > 0) {
      const active = sortedCycles.find(c => c.startDate <= todayStr && c.endDate >= todayStr);
      setSelectedCycleId(active ? active.id : sortedCycles[0].id);
    }
  }, [sortedCycles, selectedCycleId, todayStr]);

  const currentCycle = useMemo(() => {
    return sortedCycles.find(c => c.id === selectedCycleId) || sortedCycles[0] || null;
  }, [sortedCycles, selectedCycleId]);

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modal: Add/Edit Cycle Modal
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleTypeInput, setCycleTypeInput] = useState<BudgetCycleType>('BI_WEEKLY');
  const [cycleNameInput, setCycleNameInput] = useState('');
  const [cycleStartDateInput, setCycleStartDateInput] = useState(todayStr);
  const [cycleEndDateInput, setCycleEndDateInput] = useState(todayStr);
  const [cycleIncomeInput, setCycleIncomeInput] = useState<string>('25000');
  const [customDaysInterval, setCustomDaysInterval] = useState<number>(14);

  // Modal / Form state for adding category budget in cycle
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<BudgetCycle | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [budgetLimitInput, setBudgetLimitInput] = useState<string>('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customColor, setCustomColor] = useState('#059669');

  // Inline amount editing state for active budget card
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingAmountInput, setEditingAmountInput] = useState<string>('');

  // Handle cycle type change inside modal and auto-suggest dates
  const handleCycleTypeSelect = (type: BudgetCycleType) => {
    setCycleTypeInput(type);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const lastDay = new Date(y, m + 1, 0).getDate();

    if (type === 'BI_WEEKLY') {
      const day = now.getDate();
      if (day <= 15) {
        setCycleStartDateInput(`${y}-${pad(m + 1)}-01`);
        setCycleEndDateInput(`${y}-${pad(m + 1)}-15`);
        setCycleNameInput(`${now.toLocaleString('default', { month: 'short' })} 1-15 Cutoff`);
      } else {
        setCycleStartDateInput(`${y}-${pad(m + 1)}-16`);
        setCycleEndDateInput(`${y}-${pad(m + 1)}-${pad(lastDay)}`);
        setCycleNameInput(`${now.toLocaleString('default', { month: 'short' })} 16-${lastDay} Cutoff`);
      }
    } else if (type === 'MONTHLY') {
      setCycleStartDateInput(`${y}-${pad(m + 1)}-01`);
      setCycleEndDateInput(`${y}-${pad(m + 1)}-${pad(lastDay)}`);
      setCycleNameInput(`${now.toLocaleString('default', { month: 'long' })} ${y} Monthly`);
    } else if (type === 'WEEKLY') {
      const end = new Date(now);
      end.setDate(now.getDate() + 6);
      setCycleStartDateInput(todayStr);
      setCycleEndDateInput(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
      setCycleNameInput(`Week of ${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}`);
    } else if (type === 'CUSTOM') {
      const end = new Date(now);
      end.setDate(now.getDate() + (customDaysInterval - 1));
      setCycleStartDateInput(todayStr);
      setCycleEndDateInput(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
      setCycleNameInput(`Custom ${customDaysInterval}-Day Cycle`);
    }
  };

  // Open modal to configure new cycle
  const handleOpenNewCycleModal = () => {
    handleCycleTypeSelect('BI_WEEKLY');
    setShowCycleModal(true);
  };

  // Save new cycle
  const handleSaveCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleStartDateInput || !cycleEndDateInput) return;
    if (cycleEndDateInput < cycleStartDateInput) {
      setFeedbackMsg('End date cannot be earlier than start date.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const incomeVal = parseFloat(cycleIncomeInput);
    const newCycle: BudgetCycle = {
      id: `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: cycleNameInput.trim() || `${cycleStartDateInput} to ${cycleEndDateInput}`,
      cycleType: cycleTypeInput,
      startDate: cycleStartDateInput,
      endDate: cycleEndDateInput,
      incomeAmount: isNaN(incomeVal) ? undefined : incomeVal,
      customIntervalDays: cycleTypeInput === 'CUSTOM' ? customDaysInterval : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onSaveBudgetCycle(newCycle);
    setSelectedCycleId(newCycle.id);
    setShowCycleModal(false);
    setFeedbackMsg(`New budget cycle "${newCycle.name}" created!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Delete budget cycle confirmation handler
  const handleConfirmDeleteCycle = () => {
    if (!cycleToDelete) return;
    const targetId = cycleToDelete.id;
    const targetName = cycleToDelete.name;

    // Pick next cycle to view before deleting
    const remaining = sortedCycles.filter(c => c.id !== targetId);
    if (remaining.length > 0) {
      const active = remaining.find(c => c.startDate <= todayStr && c.endDate >= todayStr);
      setSelectedCycleId(active ? active.id : remaining[0].id);
    }

    onDeleteBudgetCycle(targetId);
    setCycleToDelete(null);
    setFeedbackMsg(`Successfully deleted budget cycle "${targetName}".`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Filter budgets belonging to the selected cycle
  // (matches either cycleId === currentCycle.id, or legacy budgets within the month)
  const activeCycleBudgets = useMemo(() => {
    if (!currentCycle) return [];
    return budgets.filter(b => {
      if (b.cycleId) {
        return b.cycleId === currentCycle.id;
      }
      // Backward compatibility for generic monthly budgets: match if currentCycle is monthly and starts with that month
      if (b.month && currentCycle.cycleType === 'MONTHLY') {
        return currentCycle.startDate.startsWith(b.month);
      }
      return false;
    });
  }, [budgets, currentCycle]);

  // Previous cycles to copy from (other than currentCycle)
  const otherCycles = useMemo(() => {
    if (!currentCycle) return [];
    return sortedCycles.filter(c => c.id !== currentCycle.id);
  }, [sortedCycles, currentCycle]);

  // Actual expenses incurred within the current cycle date window
  const cycleExpenses = useMemo(() => {
    if (!currentCycle) return [];
    return transactions.filter(t => {
      if (t.type !== 'EXPENSE') return false;
      return t.date >= currentCycle.startDate && t.date <= currentCycle.endDate;
    });
  }, [transactions, currentCycle]);

  // Category spent map for this cycle
  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>();
    cycleExpenses.forEach(t => {
      const cat = t.category || 'General';
      map.set(cat, (map.get(cat) || 0) + t.amount);
    });
    return map;
  }, [cycleExpenses]);

  // Calculations for current cycle
  const totalAllocatedBudget = activeCycleBudgets.reduce((acc, b) => acc + b.limitAmount, 0);
  const totalSpentInCycle = cycleExpenses.reduce((acc, t) => acc + t.amount, 0);
  const remainingBudget = totalAllocatedBudget - totalSpentInCycle;
  const budgetUtilizationPct = totalAllocatedBudget > 0 ? Math.round((totalSpentInCycle / totalAllocatedBudget) * 100) : 0;

  // Days calculations: total days, elapsed days, days remaining
  const cycleDaysMetrics = useMemo(() => {
    if (!currentCycle) {
      return { totalDays: 1, elapsedDays: 1, daysRemaining: 0, isPast: false, isFuture: false };
    }
    const start = new Date(currentCycle.startDate);
    const end = new Date(currentCycle.endDate);
    const today = new Date(todayStr);

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);

    let elapsedDays = 0;
    let daysRemaining = 0;
    let isPast = false;
    let isFuture = false;

    if (today < start) {
      isFuture = true;
      elapsedDays = 0;
      daysRemaining = totalDays;
    } else if (today > end) {
      isPast = true;
      elapsedDays = totalDays;
      daysRemaining = 0;
    } else {
      elapsedDays = Math.max(1, Math.round((today.getTime() - start.getTime()) / msPerDay) + 1);
      daysRemaining = Math.max(0, Math.round((end.getTime() - today.getTime()) / msPerDay) + 1);
    }

    return { totalDays, elapsedDays, daysRemaining, isPast, isFuture };
  }, [currentCycle, todayStr]);

  // Additional Metrics: Safe Daily Spending & Burn Rate Analysis
  const metrics = useMemo(() => {
    const { elapsedDays, daysRemaining, isPast, isFuture } = cycleDaysMetrics;

    // Safe Daily Spending: Remaining budget / days remaining
    const safeDailySpending = daysRemaining > 0 && remainingBudget > 0 ? remainingBudget / daysRemaining : 0;

    // Average spent per day elapsed
    const avgDailySpent = elapsedDays > 0 ? totalSpentInCycle / elapsedDays : 0;

    // Projected total spend if current burn rate continues
    const projectedTotalSpend = totalSpentInCycle + (avgDailySpent * daysRemaining);

    // Burn rate / Health insight determination
    let insightType: 'HEALTHY' | 'WARNING' | 'ALERT' = 'HEALTHY';
    let insightTitle = 'On track to finish within budget';
    let insightMessage = 'Your current spending rate is within your daily allowance.';

    if (totalAllocatedBudget > 0) {
      if (totalSpentInCycle > totalAllocatedBudget) {
        insightType = 'ALERT';
        insightTitle = 'Budget Limit Exceeded';
        insightMessage = `You have exceeded this cycle's budget by ${formatPeso(totalSpentInCycle - totalAllocatedBudget)}.`;
      } else if (projectedTotalSpend > totalAllocatedBudget * 1.05 && !isPast) {
        insightType = 'ALERT';
        insightTitle = 'Spending faster than planned';
        insightMessage = `At your current burn rate of ${formatPeso(avgDailySpent)}/day, you may exceed this cycle by ~${formatPeso(projectedTotalSpend - totalAllocatedBudget)}.`;
      } else if (budgetUtilizationPct >= 80 && daysRemaining > 5) {
        insightType = 'WARNING';
        insightTitle = 'High Utilization Alert';
        insightMessage = `You have already used ${budgetUtilizationPct}% of your budget with ${daysRemaining} days left. Safe daily cap is ${formatPeso(safeDailySpending)}/day.`;
      } else {
        insightType = 'HEALTHY';
        insightTitle = 'On track to finish within budget';
        insightMessage = `You have ${formatPeso(safeDailySpending)}/day available to stay within your targets.`;
      }
    }

    return {
      safeDailySpending,
      avgDailySpent,
      projectedTotalSpend,
      insightType,
      insightTitle,
      insightMessage,
    };
  }, [cycleDaysMetrics, remainingBudget, totalSpentInCycle, totalAllocatedBudget, budgetUtilizationPct]);

  // Handler: Copy another cycle's category budgets into current cycle
  const handleCopyFromCycle = (sourceCycleId: string) => {
    if (!currentCycle) return;
    const sourceCycle = sortedCycles.find(c => c.id === sourceCycleId);
    if (!sourceCycle) return;

    // Find budgets belonging to source cycle
    const sourceBudgets = budgets.filter(b => b.cycleId === sourceCycle.id);
    if (sourceBudgets.length === 0) {
      setFeedbackMsg(`No budgets found in "${sourceCycle.name}" to copy.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const copied: BudgetLimit[] = sourceBudgets.map(b => ({
      ...b,
      id: `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cycleId: currentCycle.id,
      month: currentCycle.startDate.substring(0, 7),
      period: 'CYCLE',
    }));

    onSaveBudgetsBulk(copied);
    setFeedbackMsg(`Successfully copied ${copied.length} category budgets from "${sourceCycle.name}"!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Handler: Apply one-click preset category budget into current cycle
  const handleApplyPreset = (preset: typeof DEFAULT_PRESET_CATEGORIES[0]) => {
    if (!currentCycle) return;
    const existing = activeCycleBudgets.find(b => b.categoryName.toLowerCase() === preset.name.toLowerCase());
    const budget: BudgetLimit = {
      id: existing?.id || `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      categoryId: `cat_${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      categoryName: preset.name,
      period: 'CYCLE',
      limitAmount: existing ? existing.limitAmount : preset.defaultLimit,
      cycleId: currentCycle.id,
      month: currentCycle.startDate.substring(0, 7),
      iconName: preset.iconName,
      colorHex: preset.colorHex,
    };
    onSaveBudget(budget);
    setFeedbackMsg(`Added budget for ${preset.name} (${formatPeso(budget.limitAmount)}) in this cycle.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Handler: Save category budget modal form
  const handleSaveBudgetForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCycle) return;
    const rawNum = parseFloat(budgetLimitInput);
    if (isNaN(rawNum) || rawNum <= 0) return;
    const amount = Math.round(rawNum * 100) / 100;

    let catName = selectedCategoryName;
    let color = '#059669';
    let icon = 'Tag';

    if (isCustomCategoryMode) {
      if (!customCategoryName.trim()) return;
      catName = customCategoryName.trim();
      color = customColor;

      if (onSaveCategory) {
        onSaveCategory({
          id: `cat_custom_${Date.now()}`,
          name: catName,
          type: 'EXPENSE',
          iconName: 'Tag',
          colorHex: color,
          subcategories: ['General'],
          isCustom: true,
        });
      }
    } else {
      const match = categories.find(c => c.name === catName) || DEFAULT_PRESET_CATEGORIES.find(p => p.name === catName);
      if (match) {
        color = match.colorHex || '#059669';
        icon = match.iconName || 'Tag';
      }
    }

    const existing = activeCycleBudgets.find(b => b.categoryName.toLowerCase() === catName.toLowerCase());

    const newBudget: BudgetLimit = {
      id: existing?.id || `bgt_${Date.now()}`,
      userId,
      categoryId: `cat_${catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      categoryName: catName,
      period: 'CYCLE',
      limitAmount: amount,
      cycleId: currentCycle.id,
      month: currentCycle.startDate.substring(0, 7),
      iconName: icon,
      colorHex: color,
    };

    onSaveBudget(newBudget);
    setShowAddBudgetModal(false);
    setSelectedCategoryName('');
    setCustomCategoryName('');
    setBudgetLimitInput('');
    setIsCustomCategoryMode(false);
    setFeedbackMsg(`Saved ${formatPeso(amount)} budget for ${catName}!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Inline amount edit handlers
  const handleStartEditAmount = (budget: BudgetLimit) => {
    setEditingBudgetId(budget.id);
    setEditingAmountInput(budget.limitAmount.toString());
  };

  const handleCancelEditAmount = () => {
    setEditingBudgetId(null);
    setEditingAmountInput('');
  };

  const handleSaveEditAmount = (budget: BudgetLimit) => {
    const rawNum = parseFloat(editingAmountInput);
    if (isNaN(rawNum) || rawNum <= 0) {
      setFeedbackMsg('Please enter a valid amount greater than 0.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }
    const newAmount = Math.round(rawNum * 100) / 100;
    const updated: BudgetLimit = {
      ...budget,
      limitAmount: newAmount,
    };
    onSaveBudget(updated);
    setEditingBudgetId(null);
    setEditingAmountInput('');
    setFeedbackMsg(`Updated ${budget.categoryName} limit to ${formatPeso(newAmount)}!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Helper for rendering icons
  const renderCategoryIcon = (iconName?: string, colorHex?: string) => {
    const IconComponent = (iconName && CATEGORY_ICON_MAP[iconName]) || Tag;
    return (
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs"
        style={{ backgroundColor: colorHex || '#059669' }}
      >
        <IconComponent className="w-4 h-4" />
      </div>
    );
  };

  // Format date helper (e.g. Oct 1, 2026)
  const formatDatePretty = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-300 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold truncate">Budget Cycles & Philippine Cutoff Budgeting</h2>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
            Align your spending boundaries with how you get paid. Switch seamlessly between 15th/30th cutoffs, monthly, bi-weekly, weekly, or custom cycle days.
          </p>
        </div>

        {/* Cycle Switcher & New Cycle Action (Fully responsive) */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
          {/* Cycle Selector Dropdown */}
          <div className="w-full sm:w-auto min-w-0 max-w-full sm:max-w-xs flex items-center gap-2 bg-white/10 backdrop-blur-xs px-2.5 py-1.5 rounded-2xl border border-white/20">
            <Sliders className="w-4 h-4 text-emerald-300 shrink-0" />
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="w-full bg-transparent text-white text-xs font-bold outline-none cursor-pointer truncate [&>option]:text-slate-900 [&>option]:bg-white min-w-0"
              title="Select active budget cycle"
            >
              {sortedCycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatDatePretty(c.startDate)} - {formatDatePretty(c.endDate)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenNewCycleModal}
            className="w-full sm:w-auto justify-center py-2 px-3.5 text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Cycle</span>
          </button>
        </div>
      </div>

      {/* Quick Cutoff / Cycle Switcher Tab Bar */}
      <div className="bg-white dark:bg-[#1E293B] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">Cutoffs & Cycles:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar min-w-0 w-full sm:w-auto">
          {sortedCycles.map((c) => {
            const isSelected = c.id === currentCycle?.id;
            const isTodayInCycle = c.startDate <= todayStr && c.endDate >= todayStr;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCycleId(c.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title={`Switch to ${c.name}`}
              >
                <span>{c.name}</span>
                {isTodayInCycle && (
                  <span
                    className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-teal-500'}`}
                    title="Active current date window"
                  />
                )}
              </button>
            );
          })}
          
          <button
            type="button"
            onClick={handleOpenNewCycleModal}
            className="py-1.5 px-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
            title="Create new cutoff or cycle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cutoff</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Active Budget Cycle Hero Card */}
      {currentCycle && (
        <div className="bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 min-w-0">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {currentCycle.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase tracking-wide shrink-0">
                    {currentCycle.cycleType.replace('_', ' ')}
                  </span>
                  {currentCycle.startDate <= todayStr && currentCycle.endDate >= todayStr && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white shrink-0">
                      Active Now
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatDatePretty(currentCycle.startDate)} — {formatDatePretty(currentCycle.endDate)}</span>
                  <span>•</span>
                  <span>{cycleDaysMetrics.totalDays} Total Days</span>
                </p>
              </div>
            </div>

            {/* Quick Actions for this cycle (Responsive wrap, no horizontal scroll) */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto min-w-0">
              {otherCycles.length > 0 && (
                <div className="w-full sm:w-auto min-w-0">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCopyFromCycle(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full sm:w-auto max-w-full sm:max-w-[170px] truncate py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold outline-none cursor-pointer"
                    title="Copy category allocations from another cycle"
                  >
                    <option value="" disabled>Copy Budget From...</option>
                    {otherCycles.map(c => (
                      <option key={c.id} value={c.id}>
                        Copy from {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAddBudgetModal(true)}
                className="flex-1 sm:flex-initial py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Assign Category Budget</span>
              </button>

              {sortedCycles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCycleToDelete(currentCycle)}
                  className="py-1.5 px-3 rounded-xl text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200/80 dark:border-rose-900/60 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 whitespace-nowrap"
                  title={`Delete cycle "${currentCycle.name}"`}
                  aria-label={`Delete cycle ${currentCycle.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Delete Cycle</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Cycle Metrics Bar (Responsive grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Allocated Budget</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(totalAllocatedBudget)}
              </p>
              <p className="text-[11px] text-slate-500">
                {activeCycleBudgets.length} Category Budgets
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent In Cycle</span>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {formatPeso(totalSpentInCycle)}
              </p>
              <p className="text-[11px] text-slate-500">
                {budgetUtilizationPct}% of limit consumed
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Budget</span>
              <p className={`text-xl font-bold font-mono ${remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatPeso(Math.abs(remainingBudget))} {remainingBudget < 0 && 'Over'}
              </p>
              <p className="text-[11px] text-slate-500">
                {remainingBudget >= 0 ? 'Safe remaining funds' : 'Deficit'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Daily Safe Allowance</span>
              <p className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200">
                {formatPeso(metrics.safeDailySpending)} / day
              </p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{cycleDaysMetrics.daysRemaining} days remaining in cycle</span>
              </p>
            </div>

          </div>

          {/* Overall Cycle Utilization Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Cycle Budget Utilization
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatPeso(totalSpentInCycle)} / {formatPeso(totalAllocatedBudget)} ({budgetUtilizationPct}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalSpentInCycle > totalAllocatedBudget
                    ? 'bg-rose-600'
                    : budgetUtilizationPct >= 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
              />
            </div>
          </div>

          {/* Real-time Burn Rate & Health Insight Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            metrics.insightType === 'ALERT'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
              : metrics.insightType === 'WARNING'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="p-1.5 rounded-xl bg-white/60 dark:bg-black/20 shrink-0 mt-0.5">
              {metrics.insightType === 'ALERT' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              ) : metrics.insightType === 'WARNING' ? (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            <div className="space-y-0.5 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold">{metrics.insightTitle}</span>
                <span className="text-[11px] opacity-80 font-mono">
                  Current pace: {formatPeso(metrics.avgDailySpent)}/day • Projected total: {formatPeso(metrics.projectedTotalSpend)}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {metrics.insightMessage}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Assigned Category Budgets Grid */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Category Budget Limits in {currentCycle?.name}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Assigned limits and actual expenses incurred in this cycle window ({currentCycle?.startDate} to {currentCycle?.endDate}).
            </p>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {activeCycleBudgets.length} Categories Allocated
          </span>
        </div>

        {activeCycleBudgets.length === 0 ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No category budgets assigned in {currentCycle?.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Allocate categories to this cutoff or cycle (Food, Transport, Bills, Savings), or copy over from a previous cycle.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {otherCycles.length > 0 && (
                <button
                  onClick={() => handleCopyFromCycle(otherCycles[0].id)}
                  className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copy from {otherCycles[0].name}</span>
                </button>
              )}

              <button
                onClick={() => setShowAddBudgetModal(true)}
                className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Category Budget</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCycleBudgets.map((b) => {
              const spent = categorySpentMap.get(b.categoryName) || 0;
              const percentage = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
              const remaining = b.limitAmount - spent;
              const isOver = spent > b.limitAmount;
              const isNear = percentage >= 85 && !isOver;

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderCategoryIcon(b.iconName, b.colorHex)}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {b.categoryName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currentCycle?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditAmount(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                        title="Edit budget limit amount"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteBudget(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                        title="Remove budget limit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form vs Normal Amounts Row */}
                  {editingBudgetId === b.id ? (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-emerald-300 dark:border-emerald-700/60 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                          Edit Limit (₱)
                        </label>
                        <span className="text-[9px] text-slate-400">Category fixed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₱</span>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            autoFocus
                            value={editingAmountInput}
                            onChange={(e) => setEditingAmountInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditAmount(b);
                              if (e.key === 'Escape') handleCancelEditAmount();
                            }}
                            placeholder="Amount"
                            className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveEditAmount(b)}
                          className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                          title="Save new amount"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditAmount}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Spent</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatPeso(spent)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Limit</span>
                        <button
                          type="button"
                          onClick={() => handleStartEditAmount(b)}
                          className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 group/btn cursor-pointer"
                          title="Click to edit budget amount"
                        >
                          <span>{formatPeso(b.limitAmount)}</span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover/btn:text-emerald-600 transition-colors" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver
                            ? 'bg-rose-600'
                            : isNear
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-semibold ${
                          isOver
                            ? 'text-rose-600 dark:text-rose-400'
                            : isNear
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {isOver ? `Over budget by ${formatPeso(spent - b.limitAmount)}` : `${percentage}% used`}
                      </span>

                      <span className="text-slate-400 font-mono">
                        {remaining >= 0 ? `${formatPeso(remaining)} left` : '0 left'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Suggested Premade Filipino Budget Presets */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Premade Cutoff Budget Presets</span>
            </h3>
            <p className="text-xs text-slate-500">
              One-click Filipino household budget allocations for the active cycle.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0">
          {DEFAULT_PRESET_CATEGORIES.map((preset) => {
            const isAlreadyBudgeted = activeCycleBudgets.some(b => b.categoryName.toLowerCase() === preset.name.toLowerCase());
            return (
              <div
                key={preset.name}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-emerald-400 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {renderCategoryIcon(preset.iconName, preset.colorHex)}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {preset.name}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="font-mono text-slate-500 font-medium">
                    {formatPeso(preset.defaultLimit)}
                  </span>
                  
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors cursor-pointer ${
                      isAlreadyBudgeted
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                    }`}
                  >
                    {isAlreadyBudgeted ? 'Set' : '+ Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Create / Configure Budget Cycle */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Configure Budget Cycle</h3>
                <p className="text-[11px] text-emerald-100">Monthly, Bi-Weekly Cutoff, Weekly, or Custom Interval</p>
              </div>
              <button
                onClick={() => setShowCycleModal(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCycle} className="p-6 space-y-4 text-xs">
              
              {/* Cycle Type Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cycle Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'BI_WEEKLY' as BudgetCycleType, label: 'Bi-Weekly (Cutoff)', hint: '1-15 & 16-30/31' },
                    { type: 'MONTHLY' as BudgetCycleType, label: 'Monthly', hint: '1st - EOM' },
                    { type: 'WEEKLY' as BudgetCycleType, label: 'Weekly', hint: '7 days' },
                    { type: 'CUSTOM' as BudgetCycleType, label: 'Custom Range', hint: '14, 21 days etc' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleCycleTypeSelect(item.type)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        cycleTypeInput === item.type
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-bold text-xs">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cycle Name / Label
                </label>
                <input
                  type="text"
                  required
                  value={cycleNameInput}
                  onChange={(e) => setCycleNameInput(e.target.value)}
                  placeholder="e.g. October 1-15 Cutoff"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={cycleStartDateInput}
                    onChange={(e) => setCycleStartDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={cycleEndDateInput}
                    onChange={(e) => setCycleEndDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Custom Interval Option */}
              {cycleTypeInput === 'CUSTOM' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Repeating Interval (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customDaysInterval}
                    onChange={(e) => setCustomDaysInterval(parseInt(e.target.value) || 14)}
                    placeholder="e.g. 14, 21, 30"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Expected Income for this cycle */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Income for this Cycle / Paycheck (₱, Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cycleIncomeInput}
                    onChange={(e) => setCycleIncomeInput(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCycleModal(false)}
                  className="py-2 px-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  Save Budget Cycle
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Assign Category Budget */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Assign Category Budget</h3>
                <p className="text-[11px] text-emerald-100">For {currentCycle?.name}</p>
              </div>
              <button
                onClick={() => setShowAddBudgetModal(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetForm} className="p-6 space-y-4 text-xs">
              
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsCustomCategoryMode(false)}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                    !isCustomCategoryMode
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomCategoryMode(true)}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                    isCustomCategoryMode
                      ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Custom
                </button>
              </div>

              {!isCustomCategoryMode ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Category
                  </label>
                  <select
                    value={selectedCategoryName}
                    onChange={(e) => setSelectedCategoryName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Category --</option>
                    <optgroup label="Essential Filipino Presets">
                      {DEFAULT_PRESET_CATEGORIES.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="All Available Expense Categories">
                      {categories.filter(c => c.type === 'EXPENSE').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coffee & Merienda, Pet Care, Gaming"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Color Theme
                    </label>
                    <div className="flex gap-2">
                      {['#059669', '#0284C7', '#7C5CFC', '#E11D48', '#D97706', '#DB2777'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCustomColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${customColor === c ? 'scale-110 border-slate-800 dark:border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Budget Limit for this Cycle (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="e.g. 50, 100, 350, 5000"
                    value={budgetLimitInput}
                    onChange={(e) => setBudgetLimitInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Accepts whole numbers or up to 2 decimal places (e.g. 100, 250.50).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="py-2 px-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  Assign Budget
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Budget Cycle */}
      {cycleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-rose-700 to-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Delete Budget Cycle?</h3>
                  <p className="text-[11px] text-rose-100">{cycleToDelete.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCycleToDelete(null)}
                className="p-1 text-rose-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Are you sure you want to delete this cycle?</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  Budget cycle <strong>"{cycleToDelete.name}"</strong> ({formatDatePretty(cycleToDelete.startDate)} — {formatDatePretty(cycleToDelete.endDate)}) will be removed. Category budget limits allocated strictly to this cycle will also be cleaned up. Your transactions will not be deleted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCycleToDelete(null)}
                  className="py-2 px-3.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Keep Cycle
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCycle}
                  className="py-2 px-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Cycle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
