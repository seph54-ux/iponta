import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  PieChart,
  Home,
  PiggyBank,
  Utensils,
  Car,
  ShoppingBag,
  Sliders,
  Info,
} from 'lucide-react';
import { formatPeso } from '../utils/formatters';

export type BudgetingStyleKey =
  | 'ph_standard'
  | 'classic_503020'
  | 'aggressive_savings'
  | 'metro_rent_heavy'
  | 'essentials_702010'
  | 'custom';

export interface EnvelopeItem {
  id: string;
  name: string;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  examples: string;
}

interface BudgetingStyleDefinition {
  key: BudgetingStyleKey;
  name: string;
  badge: string;
  description: string;
  envelopes: Omit<EnvelopeItem, 'percentage'>[];
  defaultPercentages: number[];
}

const BUDGETING_STYLES: BudgetingStyleDefinition[] = [
  {
    key: 'ph_standard',
    name: '50/20/15/5/10 Pinoy Standard',
    badge: 'Recommended for Filipino Households',
    description: 'Balanced formula allocating priority reserves for bills, savings vaults, palengke groceries, and commute.',
    defaultPercentages: [50, 20, 15, 5, 10],
    envelopes: [
      {
        id: 'bills',
        name: 'Fixed Bills & Housing',
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        borderColor: 'border-sky-200 dark:border-sky-800/60',
        icon: Home,
        description: 'Rent, condo dues, Meralco, water, Converge internet',
        examples: 'Rent/Mortgage, Meralco electricity, Manila Water/Maynilad, WiFi, monthly condo association fees',
      },
      {
        id: 'savings',
        name: 'Savings & Emergency Fund',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: PiggyBank,
        description: 'Emergency vault, high-yield digital banks, Pag-IBIG MP2',
        examples: 'Seabank / Maya high-interest vaults, Pag-IBIG MP2 voluntary savings, insurance premiums, paluwagan',
      },
      {
        id: 'food',
        name: 'Groceries & Wet Market',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        borderColor: 'border-orange-200 dark:border-orange-800/60',
        icon: Utensils,
        description: 'Palengke wet market, Puregold groceries, rice supply',
        examples: 'Rice sack, weekend palengke visit, Puregold / SM Supermarket essential provisions, cooking oil, meats',
      },
      {
        id: 'transport',
        name: 'Transportation & Commute',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        borderColor: 'border-purple-200 dark:border-purple-800/60',
        icon: Car,
        description: 'Daily jeepney, MRT/LRT Beep card, Angkas, Grab, gas',
        examples: 'Beep card reloads, daily jeepney / UV Express fares, gas fill-ups, Angkas / Grab rides, RFID tollways',
      },
      {
        id: 'discretionary',
        name: 'Discretionary & Personal Buffer',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-200 dark:border-rose-800/60',
        icon: ShoppingBag,
        description: 'Weekend dining out, milk tea, leisure, guilt-free treats',
        examples: 'Coffee shops, weekend dinners, Shopee/Lazada treats, cinema, hobbies, family pasalubong',
      },
    ],
  },
  {
    key: 'classic_503020',
    name: '50 / 30 / 20 Classic Rule',
    badge: 'Global Financial Standard',
    description: 'Divides your take-home pay strictly between essential needs (50%), lifestyle wants (30%), and future savings or debt freedom (20%).',
    defaultPercentages: [50, 30, 20],
    envelopes: [
      {
        id: 'needs',
        name: 'Needs & Living Essentials',
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        borderColor: 'border-sky-200 dark:border-sky-800/60',
        icon: Home,
        description: 'Housing, basic utilities, staple groceries, daily commute',
        examples: 'Rent, electric/water utility bills, staple home groceries, essential transportation',
      },
      {
        id: 'wants',
        name: 'Wants & Lifestyle Comforts',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        borderColor: 'border-purple-200 dark:border-purple-800/60',
        icon: ShoppingBag,
        description: 'Dining out, streaming subscriptions, leisure, shopping',
        examples: 'Restaurants, Netflix / Spotify, hobbies, weekend road trips, casual shopping',
      },
      {
        id: 'savings_debt',
        name: 'Savings & Debt Payoff',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: PiggyBank,
        description: 'Emergency fund, debt acceleration, investments',
        examples: 'Building 3-6 months emergency buffer, extra loan principal payments, MP2 / index funds',
      },
    ],
  },
  {
    key: 'aggressive_savings',
    name: 'Aggressive Wealth Builder (40/30/15/5/10)',
    badge: 'High Savings & Investment',
    description: 'Optimized for savers aiming to rapidly build an emergency fund, invest in Pag-IBIG MP2, or achieve financial independence.',
    defaultPercentages: [40, 30, 15, 5, 10],
    envelopes: [
      {
        id: 'bills',
        name: 'Fixed Bills & Essentials',
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        borderColor: 'border-sky-200 dark:border-sky-800/60',
        icon: Home,
        description: 'Keeps overhead strictly limited to 40% of take-home pay',
        examples: 'Modest rent or shared living, essential utilities, internet plan',
      },
      {
        id: 'savings',
        name: 'Savings, MP2 & Investments',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: PiggyBank,
        description: 'Bold 30% allocation to high-yield vaults and long-term assets',
        examples: 'Pag-IBIG MP2, digital bank time deposits, stock portfolios, rainy day reserve',
      },
      {
        id: 'food',
        name: 'Food & Home Cooking',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        borderColor: 'border-orange-200 dark:border-orange-800/60',
        icon: Utensils,
        description: 'Home-cooked baon and palengke staples',
        examples: 'Bulk meal prep, palengke wet market trips, basic pantry goods',
      },
      {
        id: 'transport',
        name: 'Commute & Fares',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        borderColor: 'border-purple-200 dark:border-purple-800/60',
        icon: Car,
        description: 'Cost-effective daily transit',
        examples: 'Public transit, MRT/LRT passes, carpooling, bicycle commute',
      },
      {
        id: 'discretionary',
        name: 'Modest Personal Pocket Money',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-200 dark:border-rose-800/60',
        icon: ShoppingBag,
        description: 'Intentional, guilt-free personal allowance',
        examples: 'Occasional coffee, small celebrations, monthly treat',
      },
    ],
  },
  {
    key: 'metro_rent_heavy',
    name: 'Metro Manila Rent-Heavy (60/15/15/5/5)',
    badge: 'Urban CBD & Renter Friendly',
    description: 'Designed for urban professionals residing in Makati, BGC, Ortigas, or QC where housing eats up a higher portion of earnings.',
    defaultPercentages: [60, 15, 15, 5, 5],
    envelopes: [
      {
        id: 'bills',
        name: 'Rent, Condo & Utilities',
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        borderColor: 'border-sky-200 dark:border-sky-800/60',
        icon: Home,
        description: 'High city rental rates, association dues, and Meralco cooling bills',
        examples: 'Condo/Apartment rent, association dues, AC electric consumption, water, fiber internet',
      },
      {
        id: 'savings',
        name: 'Savings & Security Vault',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: PiggyBank,
        description: 'Consistent 15% reserve to protect against lease security & emergencies',
        examples: 'Emergency fund vault, lease renewal buffer, health cushion',
      },
      {
        id: 'food',
        name: 'Groceries & Quick Meals',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        borderColor: 'border-orange-200 dark:border-orange-800/60',
        icon: Utensils,
        description: 'Supermarket supplies and workday baon',
        examples: 'SM Supermarket, Robinson’s Easymart, daily work lunch',
      },
      {
        id: 'transport',
        name: 'City Commute',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        borderColor: 'border-purple-200 dark:border-purple-800/60',
        icon: Car,
        description: 'Short CBD hops, Grab, Angkas, or walking buffer',
        examples: 'Angkas / Joyride rides, MRT-3, BGC bus pass, city tolls',
      },
      {
        id: 'discretionary',
        name: 'Discretionary Allowance',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-200 dark:border-rose-800/60',
        icon: ShoppingBag,
        description: 'Modest entertainment & personal allowance',
        examples: 'Coffee, weekend movie, small online delivery',
      },
    ],
  },
  {
    key: 'essentials_702010',
    name: '70 / 20 / 10 Essentials First',
    badge: 'High Baseline Expenses',
    description: 'Practical for single-income providers or families supporting dependents where baseline living expenses require 70% of income.',
    defaultPercentages: [70, 20, 10],
    envelopes: [
      {
        id: 'living',
        name: 'Living Essentials & Household',
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        borderColor: 'border-sky-200 dark:border-sky-800/60',
        icon: Home,
        description: 'Comprehensive living costs: shelter, food, bills, family support, commute',
        examples: 'Rent/Mortgage, electricity, food, child allowances, health maintenance, transport',
      },
      {
        id: 'savings',
        name: 'Savings & Debt Protection',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: PiggyBank,
        description: 'Dedicated 20% cushion toward emergency security and debts',
        examples: 'Emergency fund accumulation, paying down credit/installments, insurance',
      },
      {
        id: 'fun',
        name: 'Personal Pocket Buffer',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-200 dark:border-rose-800/60',
        icon: ShoppingBag,
        description: '10% guilt-free comfort money to avoid budgeting burnout',
        examples: 'Weekend family treat, personal hobby, occasional dining out',
      },
    ],
  },
  {
    key: 'custom',
    name: 'Custom Interactive Envelopes',
    badge: 'Fully Customizable',
    description: 'Fine-tune your own envelope distribution using real-time sliders to fit your unique financial situation.',
    defaultPercentages: [45, 20, 15, 10, 10],
    envelopes: [
      {
        id: 'bills',
        name: 'Fixed Bills & Housing',
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        borderColor: 'border-sky-200 dark:border-sky-800/60',
        icon: Home,
        description: 'Rent, utilities, monthly bills',
        examples: 'Rent, electricity, water, internet, recurring subscriptions',
      },
      {
        id: 'savings',
        name: 'Savings & Investments',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: PiggyBank,
        description: 'Rainy day funds, MP2, goals',
        examples: 'Emergency fund, Pag-IBIG MP2, investments, savings targets',
      },
      {
        id: 'food',
        name: 'Food & Groceries',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        borderColor: 'border-orange-200 dark:border-orange-800/60',
        icon: Utensils,
        description: 'Palengke, supermarket, meals',
        examples: 'Puregold, local wet market, rice, groceries',
      },
      {
        id: 'transport',
        name: 'Transportation',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        borderColor: 'border-purple-200 dark:border-purple-800/60',
        icon: Car,
        description: 'Daily commute & mobility',
        examples: 'Jeepney, MRT/LRT, Angkas, Grab, fuel, tollways',
      },
      {
        id: 'discretionary',
        name: 'Personal & Discretionary',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-200 dark:border-rose-800/60',
        icon: ShoppingBag,
        description: 'Lifestyle, shopping, entertainment',
        examples: 'Dining out, coffee, online orders, hobbies',
      },
    ],
  },
];

export interface PaydayBudgetWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const PaydayBudgetWizard: React.FC<PaydayBudgetWizardProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
}) => {
  // Income frequency: 'MONTHLY' or 'BIWEEKLY'
  const [frequency, setFrequency] = useState<'MONTHLY' | 'BIWEEKLY'>('MONTHLY');
  const [incomeInput, setIncomeInput] = useState<number>(35000);
  const [selectedStyle, setSelectedStyle] = useState<BudgetingStyleKey>('ph_standard');
  const [customPercentages, setCustomPercentages] = useState<number[]>([45, 20, 15, 10, 10]);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  if (!isOpen && !isEmbedded) return null;

  // Compute base amounts
  const currentIncome = Math.max(0, incomeInput || 0);

  // If user selected monthly, biweekly is income / 2.
  // If user selected biweekly, monthly is income * 2.
  const monthlyAmount = frequency === 'MONTHLY' ? currentIncome : currentIncome * 2;
  const biweeklyAmount = frequency === 'MONTHLY' ? Math.round(currentIncome / 2) : currentIncome;

  // The active cycle amount for primary display
  const activeCycleAmount = frequency === 'MONTHLY' ? monthlyAmount : biweeklyAmount;

  const currentStyleDef =
    BUDGETING_STYLES.find((s) => s.key === selectedStyle) || BUDGETING_STYLES[0];

  const activePercentages =
    selectedStyle === 'custom' ? customPercentages : currentStyleDef.defaultPercentages;

  const totalPercentage = activePercentages.reduce((a, b) => a + b, 0);

  // Calculate envelope breakdowns
  const envelopeBreakdowns = currentStyleDef.envelopes.map((env, idx) => {
    const pct = activePercentages[idx] || 0;
    const cycleShare = Math.round((activeCycleAmount * pct) / 100);
    const monthlyShare = Math.round((monthlyAmount * pct) / 100);
    const biweeklyShare = Math.round((biweeklyAmount * pct) / 100);

    return {
      ...env,
      percentage: pct,
      cycleShare,
      monthlyShare,
      biweeklyShare,
    };
  });

  const handleCustomSliderChange = (index: number, newPct: number) => {
    const updated = [...customPercentages];
    updated[index] = newPct;
    setCustomPercentages(updated);
  };

  const handleCopySummary = () => {
    const lines = [
      `📊 Payday Budgeting Guide Summary`,
      `Budgeting Model: ${currentStyleDef.name}`,
      `Estimated Income: ${formatPeso(activeCycleAmount)} (${frequency === 'MONTHLY' ? 'Monthly' : 'Bi-Weekly / Per Cutoff'})`,
      `Equivalent: ${frequency === 'MONTHLY' ? `${formatPeso(biweeklyAmount)} per cutoff (Bi-Weekly)` : `${formatPeso(monthlyAmount)} per month`}`,
      ``,
      `Envelope Breakdown:`,
      ...envelopeBreakdowns.map(
        (b) =>
          `• ${b.name} (${b.percentage}%): ${formatPeso(b.cycleShare)} (${frequency === 'MONTHLY' ? `${formatPeso(b.biweeklyShare)}/cutoff` : `${formatPeso(b.monthlyShare)}/month`})`
      ),
      ``,
      `💡 Note: This is an educational guide and does not record or alter any accounts or active budgets.`,
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  const content = (
    <div className="space-y-6">
      {/* Simulation / Non-Overwriting Safety Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Planning Guide Only:</span> This Payday Budgeter is an interactive budgeting guide to illustrate how money can be organized across various strategies. It{' '}
          <strong className="underline font-semibold">never modifies</strong> your bank or e-wallet accounts, records transactions, or overwrites your existing budget limits, income, or expenses.
        </div>
      </div>

      {/* Income & Frequency Setup */}
      <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Estimated Take-Home Income
            </label>
            <p className="text-[11px] text-slate-500">
              Input your net salary to simulate allocation across budgeting models
            </p>
          </div>

          {/* Monthly vs Bi-Weekly Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (frequency !== 'MONTHLY') {
                  setFrequency('MONTHLY');
                  setIncomeInput((prev) => prev * 2);
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                frequency === 'MONTHLY'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (frequency !== 'BIWEEKLY') {
                  setFrequency('BIWEEKLY');
                  setIncomeInput((prev) => Math.round(prev / 2));
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                frequency === 'BIWEEKLY'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bi-Weekly (Per Cutoff)</span>
            </button>
          </div>
        </div>

        {/* Input Field & Conversion Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-7 relative">
            <span className="absolute left-3.5 top-2.5 text-base font-bold text-emerald-600 dark:text-emerald-400">
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="500"
              value={incomeInput || ''}
              onChange={(e) => setIncomeInput(Math.max(0, Number(e.target.value)))}
              placeholder="e.g. 35000"
              className="w-full pl-9 pr-4 py-2.5 text-base font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-5 flex sm:flex-col justify-between sm:justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[11px] text-slate-500">
              {frequency === 'MONTHLY' ? 'Bi-Weekly (15th & 30th) Cutoff:' : 'Monthly Equivalent:'}
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {frequency === 'MONTHLY'
                ? `${formatPeso(biweeklyAmount)} / cutoff`
                : `${formatPeso(monthlyAmount)} / month`}
            </span>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 mr-1">Quick Presets:</span>
          {[20000, 30000, 45000, 60000, 80000, 100000].map((presetVal) => {
            const displayVal = frequency === 'MONTHLY' ? presetVal : Math.round(presetVal / 2);
            return (
              <button
                key={presetVal}
                type="button"
                onClick={() => setIncomeInput(displayVal)}
                className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {formatPeso(displayVal)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Various Budgeting Styles Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-emerald-600" />
            Budgeting Styles & Allocation Models
          </label>
          <span className="text-[11px] text-slate-500">Click a style to inspect its distribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {BUDGETING_STYLES.map((style) => {
            const isSelected = selectedStyle === style.key;
            return (
              <button
                key={style.key}
                type="button"
                onClick={() => setSelectedStyle(style.key)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {style.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2">
                    {style.badge}
                  </span>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {style.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Proportion Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
          <span className="flex items-center gap-1.5">
            <span>Visual Envelope Distribution</span>
            <span className="text-[10px] font-normal text-slate-500">
              ({totalPercentage}% total allocation)
            </span>
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {formatPeso(activeCycleAmount)} {frequency === 'MONTHLY' ? '/ mo' : '/ cutoff'}
          </span>
        </div>

        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
          {envelopeBreakdowns.map((env, i) => {
            const barColors = [
              'bg-sky-500',
              'bg-emerald-500',
              'bg-orange-500',
              'bg-purple-500',
              'bg-rose-500',
              'bg-amber-500',
            ];
            const colorClass = barColors[i % barColors.length];
            return (
              <div
                key={env.id}
                style={{ width: `${Math.max(0, env.percentage)}%` }}
                className={`${colorClass} transition-all duration-300 relative group`}
                title={`${env.name}: ${env.percentage}% (${formatPeso(env.cycleShare)})`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-slate-500">
          {envelopeBreakdowns.map((env, i) => {
            const dotColors = [
              'bg-sky-500',
              'bg-emerald-500',
              'bg-orange-500',
              'bg-purple-500',
              'bg-rose-500',
              'bg-amber-500',
            ];
            return (
              <div key={env.id} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                <span>
                  {env.name} ({env.percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Envelope Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Envelope Spending Guidance Breakdown
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {frequency === 'MONTHLY' ? 'Monthly' : 'Bi-Weekly Cutoff'} Spending Targets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {envelopeBreakdowns.map((env, idx) => {
            const Icon = env.icon;
            return (
              <div
                key={env.id}
                className={`p-4 rounded-2xl border ${env.bgColor} ${env.borderColor} flex flex-col justify-between space-y-3`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 ${env.color} shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {env.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {env.percentage}% of income
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {formatPeso(env.cycleShare)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {frequency === 'MONTHLY'
                          ? `≈ ${formatPeso(env.biweeklyShare)}/cutoff`
                          : `≈ ${formatPeso(env.monthlyShare)}/mo`}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider for Custom mode */}
                  {selectedStyle === 'custom' && (
                    <div className="py-2 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400">Custom Allocation:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {env.percentage}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="1"
                        value={env.percentage}
                        onChange={(e) => handleCustomSliderChange(idx, Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1">
                    {env.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Suggested uses: </span>
                  {env.examples}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guide Summary Card & Actions */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
            <span>Guiding Model: {currentStyleDef.name}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Use these numbers as your personal benchmark when distributing your salary.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex-1 sm:flex-none py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copiedToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {!isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none py-2 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Done Viewing Guide</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // If embedded directly on page (e.g. inside Payday Budgeter tab)
  if (isEmbedded) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Payday Envelope Budget Guide
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive salary envelope planning and budgeting style guide (Monthly or Bi-Weekly)
            </p>
          </div>
        </div>

        {content}
      </div>
    );
  }

  // Modal display mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Payday Envelope Budget Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive guide for monthly & bi-weekly paycheck allocation models
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">{content}</div>
      </div>
    </div>
  );
};
