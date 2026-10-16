import React, { useState } from 'react';
import { User, Mail, Lock, ShieldCheck, Save, CheckCircle2, AlertCircle, KeyRound, Home, Coins, RotateCcw, Sun, Moon, Palette, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  userProfile: UserProfile | null;
  onUpdateProfile: (updatedProfile: UserProfile) => Promise<void> | void;
  onOpenPolicies: () => void;
  onOpenResetConfirmation: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: (targetMode?: boolean) => void;
}

const COMMON_CURRENCIES = [
  { symbol: '₱', name: 'Philippine Peso (₱)' },
  { symbol: '$', name: 'US Dollar ($)' },
  { symbol: '€', name: 'Euro (€)' },
  { symbol: '¥', name: 'Yen / Yuan (¥)' },
  { symbol: '£', name: 'British Pound (£)' },
  { symbol: '₩', name: 'South Korean Won (₩)' },
  { symbol: 'S$', name: 'Singapore Dollar (S$)' },
  { symbol: 'A$', name: 'Australian Dollar (A$)' },
  { symbol: 'C$', name: 'Canadian Dollar (C$)' },
  { symbol: '₹', name: 'Indian Rupee (₹)' },
  { symbol: 'CUSTOM', name: 'Custom Symbol (1-2 chars max)...' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  onOpenPolicies,
  onOpenResetConfirmation,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [username, setUsername] = useState(userProfile?.username || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [householdName, setHouseholdName] = useState(userProfile?.householdName || '');
  
  // Currency Selection State
  const initialSymbol = userProfile?.currencySymbol || '₱';
  const isPredefined = COMMON_CURRENCIES.some(c => c.symbol === initialSymbol && c.symbol !== 'CUSTOM');
  const [selectedPreset, setSelectedPreset] = useState<string>(isPredefined ? initialSymbol : 'CUSTOM');
  const [customSymbol, setCustomSymbol] = useState<string>(!isPredefined ? initialSymbol : '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeCurrencySymbol = selectedPreset === 'CUSTOM' ? customSymbol.trim() || '₱' : selectedPreset;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }

    if (selectedPreset === 'CUSTOM' && (!customSymbol.trim() || customSymbol.trim().length > 2)) {
      setErrorMsg('Custom currency symbol must be 1 to 2 characters max.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    const currentEmail = userProfile?.email || email.trim();

    const updated: UserProfile = {
      id: userProfile?.id || 'usr_' + Date.now(),
      email: currentEmail,
      username: username.trim(),
      householdName: householdName.trim() || undefined,
      currencySymbol: activeCurrencySymbol.substring(0, 2), // Strict 1-2 char safety limit
      hasAcceptedTerms: true,
      termsAcceptedDate: userProfile?.termsAcceptedDate || new Date().toISOString(),
      isDarkMode: userProfile?.isDarkMode || false,
      createdAt: userProfile?.createdAt || new Date().toISOString(),
    };

    // If new password was provided, update password in local accounts vault
    if (newPassword) {
      try {
        const REGISTERED_ACCOUNTS_KEY = 'iponta_registered_accounts';
        const LEGACY_ACCOUNTS_KEY = 'balanse_ph_registered_accounts';
        const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_ACCOUNTS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const accIdx = list.findIndex((a: any) => a.id === updated.id || a.email.toLowerCase() === updated.email.toLowerCase());
        if (accIdx >= 0) {
          list[accIdx].passwordHash = newPassword;
          localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(list));
        }
      } catch (err) {
        console.warn('Could not update password hash:', err);
      }
    }

    try {
      await onUpdateProfile(updated);
      setSuccessMsg('Account profile and username updated successfully in database!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header Callout Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xs space-y-1">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-300" />
          <h2 className="text-lg font-bold">Account Settings & User Profile</h2>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
          Manage your account credentials, preferred username, currency formatting, and fresh-start database resets.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleProfileSave} className="space-y-6">
        
        {/* Card 1: User Profile Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Profile Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Account Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. JuanDelaCruz"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Email Address (Primary Account ID)
                </label>
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-medium">
                  Read-only
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  readOnly
                  disabled
                  value={userProfile?.email || email}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed select-all"
                  title="Email cannot be modified as it serves as your permanent account identifier."
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Your email cannot be modified. Only your account username can be updated.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Household or Family Name (Optional)
              </label>
              <div className="relative">
                <Home className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g. Dela Cruz Household"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Currency Dropdown + Strict 1-2 Char Custom Input */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Preferred Currency Symbol
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Coins className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={selectedPreset}
                    onChange={(e) => {
                      setSelectedPreset(e.target.value);
                      if (e.target.value !== 'CUSTOM') {
                        setCustomSymbol('');
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {COMMON_CURRENCIES.map(c => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPreset === 'CUSTOM' && (
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Custom (1-2 chars)"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase text-center"
                  />
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                Limited strictly to 1-2 characters max (e.g. ₱, $, S$, £) to maintain clean display.
              </p>
            </div>

          </div>
        </div>

        {/* Card: Appearance & Theme Mode */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>Appearance & Color Theme</span>
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isDarkMode ? 'Dark Theme Active' : 'Light Theme Active'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Choose your preferred display aesthetic. Changes apply immediately across all tabs and are automatically remembered for your account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => {
                if (onToggleDarkMode) onToggleDarkMode(false);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                !isDarkMode
                  ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Daylight Clean</h4>
                    <p className="text-[10px] text-slate-500">Crisp daytime contrast</p>
                  </div>
                </div>
                {!isDarkMode && (
                  <span className="p-1 rounded-full bg-emerald-600 text-white shadow-2xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Warm off-white background with bold emerald accents, optimized for sunlight and daytime clarity.
              </p>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => {
                if (onToggleDarkMode) onToggleDarkMode(true);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                isDarkMode
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-100 shadow-2xs">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Midnight Slate</h4>
                    <p className="text-[10px] text-slate-500">Battery-friendly dark mode</p>
                  </div>
                </div>
                {isDarkMode && (
                  <span className="p-1 rounded-full bg-emerald-600 text-white">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Deep navy-slate backgrounds with gentle emerald glow, reducing eye strain during evening planning.
              </p>
            </button>
          </div>
        </div>

        {/* Card 2: Password Update */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Update Password</span>
          </h3>

          <p className="text-xs text-slate-500">
            Leave password fields blank if you do not wish to change your current password.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Card 3: Database Reset & Fresh Start */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-rose-200/80 dark:border-rose-900/50 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reset & Clear Financial Data</h4>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Remove all recorded transactions and reset account balances and budget limits to zero to start completely fresh.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenResetConfirmation}
              className="py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs flex items-center gap-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Records to Zero</span>
            </button>
          </div>
        </div>

        {/* Card 4: Terms & Policy Verification */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Terms & Policies Compliance</h4>
                <p className="text-[11px] text-slate-500">
                  Accepted on {userProfile?.termsAcceptedDate ? new Date(userProfile.termsAcceptedDate).toLocaleDateString() : 'Account creation'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPolicies}
              className="py-1.5 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              View Full Policies
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="py-3 px-6 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 rounded-2xl transition-all shadow-xs flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Account Changes</span>
        </button>

      </form>

    </div>
  );
};
