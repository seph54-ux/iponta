import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (profile: UserProfile) => void;
  onOpenPolicies: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  onOpenPolicies,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Required compliance checkboxes
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeTrackerOnly, setAgreeTrackerOnly] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isSignUp) {
      if (!username.trim()) {
        setErrorMsg('Please enter your preferred username.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (!agreeTerms || !agreeTrackerOnly) {
        setErrorMsg('You must explicitly acknowledge and accept both policy agreements to proceed.');
        return;
      }
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter valid email and password credentials.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { username: username.trim() },
            },
          });
          if (error) throw error;

          if (data.user) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email.trim(),
              username: username.trim(),
              has_accepted_terms: true,
              terms_accepted_date: new Date().toISOString(),
            });

            const profile: UserProfile = {
              id: data.user.id,
              email: email.trim(),
              username: username.trim(),
              hasAcceptedTerms: true,
              termsAcceptedDate: new Date().toISOString(),
              isDarkMode: false,
              currencySymbol: '₱',
              createdAt: new Date().toISOString(),
            };
            onLoginSuccess(profile);
          }
        } else {
          let targetEmail = email.trim();
          if (!targetEmail.includes('@')) {
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('email')
              .eq('username', targetEmail)
              .maybeSingle();
            if (profileRow?.email) targetEmail = profileRow.email;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password,
          });

          if (error) {
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('Authentication Failed: Invalid username/email or password.');
            }
            throw error;
          }

          if (data.user) {
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email || targetEmail,
              username: profileRow?.username || data.user.user_metadata?.username || targetEmail.split('@')[0],
              hasAcceptedTerms: true,
              isDarkMode: false,
              currencySymbol: '₱',
              createdAt: new Date().toISOString(),
            };
            onLoginSuccess(profile);
          }
        }
      } else {
        const userId = 'usr_' + btoa(email.trim().toLowerCase()).replace(/=/g, '').substring(0, 10);
        const profile: UserProfile = {
          id: userId,
          email: email.trim(),
          username: isSignUp ? username.trim() : (email.split('@')[0] || 'User'),
          hasAcceptedTerms: true,
          termsAcceptedDate: new Date().toISOString(),
          isDarkMode: false,
          currencySymbol: '₱',
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Branding */}
        <div className="p-6 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white text-center relative">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">IponTa</h2>
          <p className="text-xs text-emerald-200 font-semibold mt-0.5">Tara, Ipon Ta!</p>
          <p className="text-[11px] text-emerald-100/80 mt-0.5">
            Personal & Household Financial Organizer
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-1">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              !isSignUp
                ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              isSignUp
                ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Free Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g., JuanDelaCruz"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Username or Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Username or email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Registration Compliance Requirements */}
          {isSignUp && (
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs text-center">
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider text-center">
                Policy & Legal Compliance Requirements
              </p>

              <label className="inline-flex items-center justify-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-center">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
                <span className="text-center">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={onOpenPolicies}
                    className="underline text-emerald-700 dark:text-emerald-400 font-semibold hover:text-emerald-800"
                  >
                    Terms of Service & Privacy Policy
                  </button>.
                </span>
              </label>

              <label className="inline-flex items-center justify-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-center">
                <input
                  type="checkbox"
                  checked={agreeTrackerOnly}
                  onChange={(e) => setAgreeTrackerOnly(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
                <span className="text-center">
                  I understand IponTa is strictly a financial tracker and <strong className="text-amber-800 dark:text-amber-300 font-semibold">NOT a bank or payment platform</strong>.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account & Access Tracker' : 'Sign In to IponTa'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={onOpenPolicies}
              className="hover:underline text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              Read full IponTa Terms & Disclaimers
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
