import React, { useState } from 'react';
import { 
  Plus, Tag, Search, Trash2, Edit3, X, Check,
  Utensils, ShoppingCart, Zap, Car, Home, Activity,
  Briefcase, Heart, Sparkles, Smartphone, Plane, 
  GraduationCap, Gift, DollarSign, Wallet, Coffee, 
  Music, Book, Film, Laptop, Store, Send, TrendingUp, Landmark
} from 'lucide-react';
import { Category, TransactionType } from '../types';

interface CategoriesViewProps {
  categories: Category[];
  onSaveCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onOpenNewTransaction: () => void;
}

// Icon map for dynamic category icon rendering
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Utensils,
  ShoppingCart,
  Zap,
  Car,
  Home,
  Activity,
  Briefcase,
  Heart,
  Sparkles,
  Smartphone,
  Plane,
  GraduationCap,
  Gift,
  DollarSign,
  Wallet,
  Coffee,
  Music,
  Book,
  Film,
  Laptop,
  Store,
  Send,
  TrendingUp,
  Landmark,
  Tag,
};

const COLOR_PRESETS = [
  '#2E7D5B', // Emerald Pine
  '#059669', // Emerald
  '#0D9488', // Teal
  '#0284C7', // Sky
  '#2563EB', // Blue
  '#7C5CFC', // Violet
  '#DB2777', // Pink
  '#E11D48', // Rose
  '#E06D53', // Terracotta
  '#D97706', // Amber
  '#8B5CF6', // Purple
  '#0F172A', // Slate
];

const AVAILABLE_ICONS = [
  'Utensils', 'ShoppingCart', 'Zap', 'Car', 'Home', 'Activity',
  'Briefcase', 'Heart', 'Sparkles', 'Smartphone', 'Plane',
  'GraduationCap', 'Gift', 'DollarSign', 'Wallet', 'Coffee',
  'Music', 'Book', 'Film', 'Laptop', 'Store', 'Send', 'TrendingUp', 'Landmark'
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onSaveCategory,
  onDeleteCategory,
  onOpenNewTransaction,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state for adding/editing custom category
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#2E7D5B');
  const [categoryDesc, setCategoryDesc] = useState('');

  const filteredCategories = categories.filter((cat) => {
    if (filterType !== 'ALL' && cat.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const expenseCount = categories.filter(c => c.type === 'EXPENSE').length;
  const incomeCount = categories.filter(c => c.type === 'INCOME').length;

  const handleOpenAddModal = () => {
    setCategoryName('');
    setCategoryType(filterType === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setSelectedIcon('Tag');
    setSelectedColor(filterType === 'INCOME' ? '#059669' : '#E06D53');
    setCategoryDesc('');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const newCat: Category = {
      id: `cat_custom_${Date.now()}`,
      name: categoryName.trim(),
      type: categoryType,
      iconName: selectedIcon,
      colorHex: selectedColor,
      subcategories: [],
      isCustom: true,
      description: categoryDesc.trim() || undefined,
    };

    onSaveCategory(newCat);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              <Tag className="w-4 h-4" />
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Transaction Categories ({categories.length})
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-made Filipino-tailored categories and customized groupings for expenses and income.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E293B] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Type Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60">
          <button
            onClick={() => setFilterType('ALL')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All ({categories.length})
          </button>
          <button
            onClick={() => setFilterType('EXPENSE')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            Expenses ({expenseCount})
          </button>
          <button
            onClick={() => setFilterType('INCOME')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'INCOME'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            Income ({incomeCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const IconComp = ICON_COMPONENTS[cat.iconName] || Tag;
          const isIncome = cat.type === 'INCOME';

          return (
            <div
              key={cat.id}
              className="p-4 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.colorHex || (isIncome ? '#059669' : '#E06D53') }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {cat.isCustom ? 'Custom' : 'Pre-made'}
                      </span>
                    </div>
                  </div>
                </div>

                {cat.isCustom && (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                    title="Delete custom category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {cat.description && (
                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {cat.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200 dark:border-slate-800">
          No categories found matching your search. Click "Add Category" to create a new one!
        </div>
      )}

      {/* Add Custom Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Add Customized Category</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Category Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => { setCategoryType('EXPENSE'); setSelectedColor('#E06D53'); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      categoryType === 'EXPENSE'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCategoryType('INCOME'); setSelectedColor('#059669'); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      categoryType === 'INCOME'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Supplies & Vet, Crypto Staking, Coffee & Snacks"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description / Subcategory Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dog food, vet checkups, vitamins..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Color Preset Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(hex)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white ${
                        selectedColor === hex ? 'scale-110 ring-2 ring-emerald-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {selectedColor === hex && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                  {AVAILABLE_ICONS.map((iconKey) => {
                    const Icon = ICON_COMPONENTS[iconKey] || Tag;
                    const isSelected = selectedIcon === iconKey;

                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setSelectedIcon(iconKey)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={iconKey}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Save Category</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
