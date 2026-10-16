import React, { useState, useMemo } from 'react';
import { PieChart, Plus, ChevronDown, Calendar } from 'lucide-react';
import { formatPeso } from '../utils/formatters';

export const CATEGORY_PALETTE: Record<string, string> = {
  // Main Expense Categories (Distinct, High-Contrast Slices)
  'Food & Dining Out': '#EA580C',        // Vivid Coral Flame / Warm Orange (Food outside)
  'Groceries & Wet Market': '#059669',   // Fresh Emerald Green (Market / Ingredients)
  'Food & Groceries': '#10B981',         // Bright Jade Mint (Combined groceries variant)
  'Rent & Housing': '#2563EB',           // Royal Cobalt Blue (Housing / Shelter)
  'Utilities & Monthly Bills': '#F59E0B', // Vivid Amber Gold (Power / Water / Internet)
  'Utilities & Bills': '#F59E0B',        // Amber Gold alias
  'Utilities': '#F59E0B',                // Amber Gold alias
  'Transportation & Fuel': '#7C3AED',    // Deep Violet (Commute / Gas)
  'Transportation': '#7C3AED',           // Deep Violet alias
  'Healthcare & Medicines': '#E11D48',   // Vivid Crimson Rose (Medical / Pharmacy)
  'Healthcare & Medical': '#E11D48',     // Crimson Rose alias
  'Installments & PayLater': '#4F46E5',  // Vibrant Indigo (Fintech BNPL / Credit)
  'Loan Repayments': '#475569',          // Slate Charcoal Steel (Amortization)
  'Debt & Loans': '#475569',             // Slate Charcoal alias
  'Personal & Shopping': '#EC4899',      // Vivid Hot Pink (Shopping / Apparel)
  'Shopping & Retail': '#EC4899',        // Hot Pink alias
  'Education & Learning': '#06B6D4',     // Electric Cyan / Turquoise (School / Books)
  'Education': '#06B6D4',                // Electric Cyan alias
  'Savings & Investments': '#84CC16',    // Vivid Lime Green (Savings targets / MP2)
  'Investments & Savings': '#84CC16',    // Lime Green alias
  'Entertainment': '#D946EF',            // Vivid Fuchsia Orchid (Movies / Outings)
  'Personal Care': '#F43F5E',            // Warm Coral Rose (Grooming / Self-care)
  'Travel': '#0284C7',                   // Sky Cerulean Blue (Flights / Trips)
  'Donations & Family': '#FB7185',       // Soft Blush Coral (Family aid / Gifts)
  'Bills & Subscriptions': '#CA8A04',    // Warm Ochre Gold (Subscriptions / Digital)
  'Emergency Fund': '#0F172A',           // Midnight Dark Slate (Emergency reserves)
  'Other Expenses': '#94A3B8',           // Silver Slate (Miscellaneous)
  'Other': '#94A3B8',                    // Silver Slate alias
  'General': '#94A3B8',                  // Silver Slate alias
  'Transfer': '#6B7280',                 // Cool Neutral Gray

  // Income Categories
  'Salary & Wages': '#16A34A',           // Prosperity Grass Green (Payroll)
  'Salary & Income': '#16A34A',          // Grass Green alias
  'Salary': '#16A34A',                   // Grass Green alias
  'Freelance & Side Hustles': '#0D9488', // Deep Aqua Teal (Client work)
  'Business & Sales': '#1D4ED8',         // Deep Sapphire Blue (Commercial sales)
  'Investments & Dividends': '#65A30D',  // Olive Lime (Dividends)
  'Remittances & Allowances': '#9333EA', // Electric Purple (OFW / Family)
  'Bonuses & Grants': '#FBBF24',         // Sun Marigold Yellow (Awards / Grants)
  'Other Income': '#34D399',             // Spring Mint Green (Incidental income)
};

// Rich set of 32 distinct contrasted color variants to guarantee zero duplicate colors
export const CONTRASTED_PALETTE: string[] = [
  '#EA580C', // 0: Vivid Orange
  '#2563EB', // 1: Royal Blue
  '#059669', // 2: Emerald Green
  '#F59E0B', // 3: Amber Gold
  '#7C3AED', // 4: Deep Violet
  '#E11D48', // 5: Crimson Rose
  '#06B6D4', // 6: Electric Cyan
  '#EC4899', // 7: Hot Pink
  '#84CC16', // 8: Lime Green
  '#4F46E5', // 9: Indigo Blue
  '#D946EF', // 10: Bright Fuchsia
  '#0284C7', // 11: Sky Cerulean
  '#F97316', // 12: Coral Flame
  '#0D9488', // 13: Aqua Teal
  '#CA8A04', // 14: Ochre Gold
  '#9333EA', // 15: Electric Purple
  '#F43F5E', // 16: Coral Rose
  '#10B981', // 17: Jade Mint
  '#3B82F6', // 18: Cobalt Blue
  '#A855F7', // 19: Orchid Lavender
  '#65A30D', // 20: Olive Lime
  '#475569', // 21: Slate Steel
  '#FB7185', // 22: Blush Coral
  '#0891B2', // 23: Deep Cyan
  '#FBBF24', // 24: Sun Marigold
  '#C026D3', // 25: Deep Magenta
  '#16A34A', // 26: Grass Green
  '#1D4ED8', // 27: Deep Sapphire
  '#94A3B8', // 28: Silver Slate
  '#B45309', // 29: Bronze Amber
  '#6D28D9', // 30: Royal Purple
  '#047857', // 31: Pine Green
];

/**
 * Returns a distinct color for a given category.
 * If usedColors set is supplied, guarantees no duplicate color is returned.
 */
export function getCategoryColor(
  categoryName: string,
  index: number = 0,
  usedColors?: Set<string>
): string {
  const normalized = categoryName?.trim() || '';
  const directColor = CATEGORY_PALETTE[normalized];

  // If a direct color exists and hasn't been used yet in this chart, use it
  if (directColor && (!usedColors || !usedColors.has(directColor.toLowerCase()))) {
    return directColor;
  }

  // If direct color is already used or not mapped, pick the next available unused color from CONTRASTED_PALETTE
  if (usedColors) {
    for (let i = 0; i < CONTRASTED_PALETTE.length; i++) {
      const candidateIndex = (index + i) % CONTRASTED_PALETTE.length;
      const candidate = CONTRASTED_PALETTE[candidateIndex];
      if (!usedColors.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }

  // Fallback if all colors in palette are exhausted or usedColors is not provided
  return directColor || CONTRASTED_PALETTE[index % CONTRASTED_PALETTE.length];
}

interface CategoryBreakdownItem {
  category: string;
  totalAmount: number;
  percentage: number;
  count: number;
}

interface CategoryPieChartProps {
  categories: CategoryBreakdownItem[];
  totalExpense: number;
  selectedMonth: string;
  availableMonths?: string[];
  onSelectMonth?: (month: string) => void;
  onOpenNewTransaction?: () => void;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categories,
  totalExpense,
  selectedMonth,
  availableMonths = [],
  onSelectMonth,
  onOpenNewTransaction,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Format month for display (e.g., "2026-10" -> "October 2026")
  const formattedMonth = useMemo(() => {
    if (!selectedMonth) return 'Current Month';
    try {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Guaranteed duplicate-free color mapping for all categories currently in the chart
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const usedColors = new Set<string>();

    categories.forEach((item, index) => {
      const color = getCategoryColor(item.category, index, usedColors);
      usedColors.add(color.toLowerCase());
      map.set(item.category, color);
    });

    return map;
  }, [categories]);

  // Compute angles and distinct colors for slices
  const slices = useMemo(() => {
    if (!categories || categories.length === 0 || totalExpense <= 0) return [];

    let currentAngle = 0;
    return categories.map((item, index) => {
      const angleDelta = (item.totalAmount / totalExpense) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleDelta;
      currentAngle = endAngle;

      const color = categoryColorMap.get(item.category) || getCategoryColor(item.category, index);

      return {
        ...item,
        startAngle,
        endAngle,
        color,
      };
    });
  }, [categories, totalExpense, categoryColorMap]);

  // SVG Donut Path helper
  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  const createDonutSlicePath = (
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const delta = Math.min(endAngle - startAngle, 359.99);
    const effectiveEnd = startAngle + delta;

    const startOuter = polarToCartesian(cx, cy, outerRadius, effectiveEnd);
    const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
    const startInner = polarToCartesian(cx, cy, innerRadius, effectiveEnd);
    const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

    const largeArcFlag = delta <= 180 ? '0' : '1';

    return [
      `M ${endOuter.x} ${endOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${startOuter.x} ${startOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  const activeHoverItem = useMemo(() => {
    if (!hoveredCategory) return null;
    return categories.find((c) => c.category === hoveredCategory) || null;
  }, [hoveredCategory, categories]);

  return (
    <div className="space-y-4">
      {/* Month Selector & Controls Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Monthly Expense Distribution
          </span>
        </div>

        {availableMonths.length > 1 && onSelectMonth ? (
          <div className="relative inline-flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="pl-8 pr-7 py-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer appearance-none"
            >
              {availableMonths.map((m) => {
                const [y, mon] = m.split('-');
                const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
                const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {formattedMonth}
          </span>
        )}
      </div>

      {/* Case 1: No expenditures in that month -> NO CHART ON CONTAINER */}
      {categories.length === 0 || totalExpense <= 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <PieChart className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No expenditure recorded for {formattedMonth} yet
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Once you add an expense transaction, the circle chart and category labels will automatically appear here.
            </p>
          </div>
          {onOpenNewTransaction && (
            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="py-1.5 px-3.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      ) : (
        /* Case 2: Expenditures exist -> Render circle chart and ONLY the included category labels */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Circle / Donut Chart Container */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {slices.length === 1 ? (
                  // Single category: Render full donut ring
                  <circle
                    cx="100"
                    cy="100"
                    r="68"
                    fill="none"
                    stroke={slices[0].color}
                    strokeWidth="28"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredCategory(slices[0].category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                ) : (
                  // Multiple categories: Render slices with distinct colors
                  slices.map((slice) => {
                    const isHovered = hoveredCategory === slice.category;
                    const path = createDonutSlicePath(
                      100,
                      100,
                      isHovered ? 52 : 54,
                      isHovered ? 86 : 82,
                      slice.startAngle,
                      slice.endAngle
                    );

                    return (
                      <path
                        key={slice.category}
                        d={path}
                        fill={slice.color}
                        stroke="transparent"
                        className="cursor-pointer transition-all duration-200"
                        style={{
                          filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' : 'none',
                          opacity: hoveredCategory && !isHovered ? 0.6 : 1,
                        }}
                        onMouseEnter={() => setHoveredCategory(slice.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })
                )}
              </svg>

              {/* Center Donut Hole Information */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
                style={{ zIndex: 10 }}
              >
                {activeHoverItem ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[120px]">
                      {activeHoverItem.category}
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {formatPeso(activeHoverItem.totalAmount)}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      {activeHoverItem.percentage}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Total Spent
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
                      {formatPeso(totalExpense)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Labels & Breakdown (ONLY active categories rendered to avoid wasting space) */}
          <div className="md:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>Category ({categories.length})</span>
              <span>Amount & Share</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {categories.map((cat, index) => {
                const color = categoryColorMap.get(cat.category) || getCategoryColor(cat.category, index);
                const isHovered = hoveredCategory === cat.category;

                return (
                  <div
                    key={cat.category}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-100 dark:bg-slate-800 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    onMouseEnter={() => setHoveredCategory(cat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Distinct category color indicator */}
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          ({cat.count} {cat.count === 1 ? 'tx' : 'txs'})
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatPeso(cat.totalAmount)}
                        </span>
                        <span
                          className="text-[11px] font-bold ml-1.5 px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                          }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar matching the specific category color */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
