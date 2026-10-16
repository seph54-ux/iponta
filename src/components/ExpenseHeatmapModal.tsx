import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Flame, Calendar as CalendarIcon, Info, TrendingUp, 
  ChevronLeft, ChevronRight, Award, Zap, CheckCircle2, 
  Layers, ArrowRight
} from 'lucide-react';
import { Transaction } from '../types';
import { formatPeso, formatDate } from '../utils/formatters';

interface ExpenseHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

type HeatmapMode = 'MONTHLY' | 'YEARLY';

interface DayData {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ...
  dayOfMonth: number;
  monthIndex: number;
  year: number;
  totalSpent: number;
  transactionCount: number;
  transactions: Transaction[];
  level: 0 | 1 | 2 | 3 | 4; // 0=No spending, 1=Low, 2=Medium, 3=High, 4=Very High
}

export const ExpenseHeatmapModal: React.FC<ExpenseHeatmapModalProps> = ({
  isOpen,
  onClose,
  transactions,
}) => {
  const [mode, setMode] = useState<HeatmapMode>('MONTHLY');
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-11
  
  // Tooltip / Hover / Selected state
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset selected day when month or year changes
  useEffect(() => {
    setSelectedDay(null);
    setHoveredDay(null);
  }, [selectedYear, selectedMonth, mode]);

  // Filter only valid expense transactions
  const expenseTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.filter(t => {
      const typeStr = String(t.type || '').toUpperCase();
      return typeStr === 'EXPENSE';
    });
  }, [transactions]);

  // Aggregate daily expenses into Map<dateStr, { totalSpent, count, txs }>
  const dailyMap = useMemo(() => {
    const map = new Map<string, { totalSpent: number; count: number; txs: Transaction[] }>();
    expenseTransactions.forEach(t => {
      if (!t.date) return;
      const dateKey = String(t.date).substring(0, 10);
      if (!dateKey || dateKey.length < 10) return;
      
      const amt = typeof t.amount === 'number' && !isNaN(t.amount) ? Math.abs(t.amount) : 0;
      const existing = map.get(dateKey) || { totalSpent: 0, count: 0, txs: [] };
      existing.totalSpent += amt;
      existing.count += 1;
      existing.txs.push(t);
      map.set(dateKey, existing);
    });
    return map;
  }, [expenseTransactions]);

  // Compute spending scale thresholds (percentiles of active spending days)
  const thresholds = useMemo(() => {
    const nonZeroAmounts: number[] = [];
    dailyMap.forEach(d => {
      if (d.totalSpent > 0) nonZeroAmounts.push(d.totalSpent);
    });

    if (nonZeroAmounts.length === 0) {
      return { q1: 500, q2: 1200, q3: 2500 };
    }

    nonZeroAmounts.sort((a, b) => a - b);
    const q1 = nonZeroAmounts[Math.floor(nonZeroAmounts.length * 0.25)] || 300;
    const q2 = nonZeroAmounts[Math.floor(nonZeroAmounts.length * 0.50)] || 800;
    const q3 = nonZeroAmounts[Math.floor(nonZeroAmounts.length * 0.75)] || 1800;

    return { q1, q2, q3 };
  }, [dailyMap]);

  // Helper to assign intensity level safely
  const getLevel = (amount: number): 0 | 1 | 2 | 3 | 4 => {
    if (!amount || amount <= 0 || isNaN(amount)) return 0; // No spending = Level 0
    if (amount <= thresholds.q1) return 1; // Low
    if (amount <= thresholds.q2) return 2; // Medium
    if (amount <= thresholds.q3) return 3; // High
    return 4; // Very High
  };

  // Build full-year dataset using day-offset (safe against timezone & daylight saving time shifts)
  const yearlyData = useMemo(() => {
    const days: DayData[] = [];
    const isLeap = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
    const totalDaysInYear = isLeap ? 366 : 365;

    for (let dayOffset = 0; dayOffset < totalDaysInYear; dayOffset++) {
      // Use noon (12:00) to avoid any DST midnight transition edge cases
      const cur = new Date(selectedYear, 0, 1 + dayOffset, 12, 0, 0);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const rec = dailyMap.get(dateStr);
      const totalSpent = rec ? rec.totalSpent : 0;
      const count = rec ? rec.count : 0;
      const txs = rec ? rec.txs : [];

      days.push({
        dateStr,
        dayOfWeek: cur.getDay(), // 0 = Sun, 1 = Mon, ...
        dayOfMonth: cur.getDate(),
        monthIndex: cur.getMonth(),
        year: y,
        totalSpent,
        transactionCount: count,
        transactions: txs,
        level: getLevel(totalSpent),
      });
    }
    return days;
  }, [selectedYear, dailyMap, thresholds]);

  // Group yearly data into 53 GitHub week columns (Sunday to Saturday)
  const yearlyWeeks = useMemo(() => {
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Pad before Jan 1 if Jan 1 is not Sunday
    const firstDayOfWeek = yearlyData[0]?.dayOfWeek || 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        dateStr: '',
        dayOfWeek: i,
        dayOfMonth: 0,
        monthIndex: -1,
        year: selectedYear,
        totalSpent: 0,
        transactionCount: 0,
        transactions: [],
        level: 0,
      });
    }

    yearlyData.forEach(d => {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          dateStr: '',
          dayOfWeek: currentWeek.length,
          dayOfMonth: 0,
          monthIndex: -1,
          year: selectedYear,
          totalSpent: 0,
          transactionCount: 0,
          transactions: [],
          level: 0,
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [yearlyData, selectedYear]);

  // Build Monthly calendar dataset (with leading blanks before day 1)
  const monthlyData = useMemo(() => {
    const days: DayData[] = [];
    const firstDay = new Date(selectedYear, selectedMonth, 1, 12, 0, 0);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0, 12, 0, 0);
    const daysInMonth = lastDay.getDate();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cur = new Date(selectedYear, selectedMonth, dayNum, 12, 0, 0);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const rec = dailyMap.get(dateStr);
      const totalSpent = rec ? rec.totalSpent : 0;
      const count = rec ? rec.count : 0;
      const txs = rec ? rec.txs : [];

      days.push({
        dateStr,
        dayOfWeek: cur.getDay(),
        dayOfMonth: cur.getDate(),
        monthIndex: cur.getMonth(),
        year: y,
        totalSpent,
        transactionCount: count,
        transactions: txs,
        level: getLevel(totalSpent),
      });
    }

    return {
      paddingBefore: firstDay.getDay(), // blanks before day 1
      days,
    };
  }, [selectedYear, selectedMonth, dailyMap, thresholds]);

  // Aggregate Insights for active mode (Month or Year)
  const activeMetrics = useMemo(() => {
    const list = mode === 'YEARLY' ? yearlyData : monthlyData.days;
    let highestDay: DayData | null = null;
    let lowestDay: DayData | null = null;
    let totalSpent = 0;
    let activeSpendingDays = 0;
    let zeroSpendingDays = 0;

    const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];

    for (const d of list) {
      totalSpent += d.totalSpent;
      if (d.totalSpent > 0) {
        activeSpendingDays++;
        if (!highestDay || d.totalSpent > highestDay.totalSpent) {
          highestDay = d;
        }
        if (!lowestDay || d.totalSpent < lowestDay.totalSpent) {
          lowestDay = d;
        }
      } else {
        zeroSpendingDays++;
      }

      const dow = d.dayOfWeek;
      if (dow >= 0 && dow <= 6) {
        dayOfWeekTotals[dow] += d.totalSpent;
        dayOfWeekCounts[dow] += 1;
      }
    }

    const avgDaily = list.length > 0 ? Math.round(totalSpent / list.length) : 0;
    const avgActiveDaily = activeSpendingDays > 0 ? Math.round(totalSpent / activeSpendingDays) : 0;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let mostActiveDayOfWeek = 'None';
    let maxDOWTotal = -1;
    dayOfWeekTotals.forEach((amt, idx) => {
      if (amt > maxDOWTotal && amt > 0) {
        maxDOWTotal = amt;
        mostActiveDayOfWeek = dayNames[idx];
      }
    });

    return {
      highestDay,
      lowestDay,
      totalSpent,
      avgDaily,
      avgActiveDaily,
      zeroSpendingDays,
      activeSpendingDays,
      mostActiveDayOfWeek,
      totalDays: list.length,
    };
  }, [mode, yearlyData, monthlyData]);

  // ALL HOOKS ARE COMPLETE - Safe conditional return here
  if (!isOpen) return null;

  const monthLabels = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Intensity color styling map with high contrast and readable borders
  const getLevelClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        // No spending = Slate subtle
        return 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500';
      case 1:
        // Low spending = Emerald/Mint
        return 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-semibold';
      case 2:
        // Medium spending = Amber/Yellow
        return 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold';
      case 3:
        // High spending = Orange
        return 'bg-orange-100 dark:bg-orange-950/80 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-200 font-bold';
      case 4:
        // Very high spending = Rose
        return 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold';
    }
  };

  const getYearlyCellClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'bg-slate-200/70 dark:bg-slate-800 border-slate-300/60 dark:border-slate-700';
      case 1:
        return 'bg-emerald-400 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-500';
      case 2:
        return 'bg-amber-400 dark:bg-amber-600 border-amber-500 dark:border-amber-500';
      case 3:
        return 'bg-orange-400 dark:bg-orange-600 border-orange-500 dark:border-orange-500';
      case 4:
        return 'bg-rose-500 dark:bg-rose-600 border-rose-600 dark:border-rose-500 ring-1 ring-rose-400';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl lg:max-w-4xl bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Expense Calendar Heatmap
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Daily Spending Intensity
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualize daily cash outflow intensity, active burn days, and celebrate zero-spend achievements.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Close Expense Heatmap"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          {/* Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setMode('MONTHLY')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                mode === 'MONTHLY'
                  ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Calendar
            </button>
            <button
              onClick={() => setMode('YEARLY')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                mode === 'YEARLY'
                  ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Yearly 52-Week Grid
            </button>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center gap-2">
            {mode === 'MONTHLY' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 text-xs rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {monthLabels.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Previous Year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-xs font-mono text-slate-900 dark:text-white">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Next Year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Key Metric Highlights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            <div className="p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Highest Spending Day
              </span>
              <p className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 truncate">
                {activeMetrics.highestDay ? formatPeso(activeMetrics.highestDay.totalSpent) : '₱0.00'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {activeMetrics.highestDay ? formatDate(activeMetrics.highestDay.dateStr) : 'No recorded outflow'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Daily Average
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(activeMetrics.avgDaily)}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {activeMetrics.avgActiveDaily > 0 ? `₱${activeMetrics.avgActiveDaily.toLocaleString()}/active day` : 'No active days'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Zero-Spend Days
              </span>
              <p className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {activeMetrics.zeroSpendingDays} Days
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {Math.round((activeMetrics.zeroSpendingDays / Math.max(1, activeMetrics.totalDays)) * 100)}% of period
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak Day of Week
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeMetrics.mostActiveDayOfWeek}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Highest weekly burn rate
              </p>
            </div>

          </div>

          {/* Heatmap Visual Canvas */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>
                  {mode === 'MONTHLY'
                    ? `${monthLabels[selectedMonth]} ${selectedYear} Expenses Calendar`
                    : `Full Year ${selectedYear} Daily Spending Distribution`}
                </span>
              </h3>

              {/* Intensity Legend */}
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                <span>₱0 Spend</span>
                <span className="w-3 h-3 rounded-xs bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" title="₱0 (No spending)" />
                <span className="w-3 h-3 rounded-xs bg-emerald-400 dark:bg-emerald-600 border border-emerald-500" title={`Low spending (≤ ₱${thresholds.q1})`} />
                <span className="w-3 h-3 rounded-xs bg-amber-400 dark:bg-amber-600 border border-amber-500" title={`Medium spending (≤ ₱${thresholds.q2})`} />
                <span className="w-3 h-3 rounded-xs bg-orange-400 dark:bg-orange-600 border border-orange-500" title={`High spending (≤ ₱${thresholds.q3})`} />
                <span className="w-3 h-3 rounded-xs bg-rose-500 dark:bg-rose-600 border border-rose-600" title={`Very high spending (> ₱${thresholds.q3})`} />
                <span>Heavy Outflow</span>
              </div>
            </div>

            {/* MONTHLY CALENDAR VIEW (Default - Clean on all devices) */}
            {mode === 'MONTHLY' ? (
              <div className="space-y-2">
                {/* Day of Week Header */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {/* Leading padding blanks */}
                  {Array.from({ length: monthlyData.paddingBefore }).map((_, idx) => (
                    <div 
                      key={`blank-${idx}`} 
                      className="h-14 sm:h-16 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-transparent" 
                    />
                  ))}

                  {/* Active month days */}
                  {monthlyData.days.map((day) => {
                    const isSelected = selectedDay?.dateStr === day.dateStr;

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => setSelectedDay(day)}
                        onMouseEnter={() => setHoveredDay(day)}
                        className={`h-14 sm:h-16 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          getLevelClass(day.level)
                        } ${
                          isSelected 
                            ? 'ring-2 ring-emerald-500 scale-[1.03] shadow-md z-10' 
                            : 'hover:scale-[1.02] hover:shadow-xs'
                        }`}
                        title={`${formatDate(day.dateStr)}: ${day.totalSpent > 0 ? formatPeso(day.totalSpent) : '₱0'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] sm:text-xs">{day.dayOfMonth}</span>
                          {day.transactionCount > 0 && (
                            <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono font-bold">
                              {day.transactionCount}
                            </span>
                          )}
                        </div>

                        <span className="font-mono text-[9px] sm:text-[10px] font-bold truncate">
                          {day.totalSpent > 0 ? formatPeso(day.totalSpent, false) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* YEARLY VIEW: GitHub 52-Week Grid */
              <div className="space-y-2">
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[650px] space-y-1.5">
                    
                    {/* Month header labels */}
                    <div className="flex pl-7 text-[10px] text-slate-400 font-semibold">
                      {shortMonthLabels.map(m => (
                        <span key={m} className="flex-1 text-left">{m}</span>
                      ))}
                    </div>

                    {/* Grid of 7 days x 53 weeks */}
                    <div className="flex gap-1 items-start">
                      {/* Days of week labels on left (Sun, Tue, Thu, Sat) */}
                      <div className="flex flex-col justify-between pr-2 text-[9px] text-slate-400 font-medium h-[94px] shrink-0">
                        <span>Sun</span>
                        <span>Tue</span>
                        <span>Thu</span>
                        <span>Sat</span>
                      </div>

                      {/* Columns of weeks */}
                      <div className="flex gap-1 flex-1">
                        {yearlyWeeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                            {week.map((day, dIdx) => {
                              if (!day.dateStr) {
                                return <div key={dIdx} className="w-3 h-3 rounded-xs opacity-0" />;
                              }

                              const isSelected = selectedDay?.dateStr === day.dateStr;

                              return (
                                <button
                                  key={day.dateStr}
                                  type="button"
                                  onMouseEnter={() => setHoveredDay(day)}
                                  onClick={() => setSelectedDay(day)}
                                  className={`w-3 h-3 rounded-xs border transition-all cursor-pointer ${
                                    getYearlyCellClass(day.level)
                                  } ${
                                    isSelected 
                                      ? 'ring-2 ring-emerald-500 scale-125 z-10' 
                                      : 'hover:scale-125 hover:z-10'
                                  }`}
                                  aria-label={`${day.dateStr}: ₱${day.totalSpent}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center sm:text-left">
                  Tip: Scroll horizontally if viewing on a smaller screen to explore all 52 weeks.
                </p>
              </div>
            )}

            {/* Hover Tooltip / Status Preview Box */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-[11px] sm:text-xs">
                  {hoveredDay ? (
                    <p className="text-slate-800 dark:text-slate-200">
                      <strong>{formatDate(hoveredDay.dateStr)}</strong>: Spent <strong>{formatPeso(hoveredDay.totalSpent)}</strong> across <strong>{hoveredDay.transactionCount}</strong> transactions.
                    </p>
                  ) : (
                    <p className="text-slate-500">
                      Hover or tap any day tile to inspect spending amount, or click to open that day's transaction list.
                    </p>
                  )}
                </div>
              </div>

              {hoveredDay && hoveredDay.totalSpent > 0 && (
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold shrink-0 ml-2 text-[10px] sm:text-xs">
                  {hoveredDay.level === 1 ? 'Low Outflow' : hoveredDay.level === 2 ? 'Moderate Outflow' : hoveredDay.level === 3 ? 'High Outflow' : 'Peak Outflow'}
                </span>
              )}
            </div>

          </div>

          {/* Selected Day Transaction Breakdown Drawer */}
          {selectedDay && (
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    <span>Transactions for {formatDate(selectedDay.dateStr)}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {selectedDay.transactions.length} Records
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Total Day Outflow: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatPeso(selectedDay.totalSpent)}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  title="Close Day Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDay.transactions.length === 0 ? (
                <div className="p-4 sm:p-5 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No expenses recorded on this date. Zero-spend achievement! 🎉</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDay.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tx.description || 'Expense'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 font-medium">
                            {tx.category || 'General'}
                          </span>
                          <span>via {tx.paymentMethod || 'Cash'}</span>
                          {tx.time && <span>at {tx.time}</span>}
                        </div>
                      </div>

                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                        -{formatPeso(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Heatmap colors dynamically adapt to your personal spending percentiles (low, moderate, high, peak).
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all shadow-xs cursor-pointer ml-auto"
          >
            Close Heatmap
          </button>
        </div>

      </div>
    </div>
  );
};
