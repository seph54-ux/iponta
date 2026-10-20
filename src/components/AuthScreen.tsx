import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, FileText, UserPlus, LogIn } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile, isNewSignup?: boolean) => void;
  onOpenPolicies: () => void;
}

interface RegisteredAccount {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
}

const REGISTERED_ACCOUNTS_KEY = 'iponta_registered_accounts';
const LEGACY_ACCOUNTS_KEY = 'balanse_ph_registered_accounts';

function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY) || localStorage.getItem(LEGACY_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredAccount(acc: RegisteredAccount): void {
  const list = getRegisteredAccounts();
  const idx = list.findIndex(a => a.email.toLowerCase() === acc.email.toLowerCase() || a.username.toLowerCase() === acc.username.toLowerCase());
  if (idx >= 0) {
    list[idx] = acc;
  } else {
    list.push(acc);
  }
  localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(list));
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onOpenPolicies,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Signup Fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAgreed, setSignupAgreed] = useState(false);

  // Login Fields
  const [loginIdentifier, setLoginEmailOrUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginAgreed, setLoginAgreed] = useState(false);

  // Status Messages & Action Prompts
  const [errorMsg, setErrorMsg] = useState('');
  const [promptAction, setPromptAction] = useState<'signup' | 'login' | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // SIGNUP SUBMIT HANDLER
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPromptAction(null);
    setSuccessMsg('');

    const trimmedUsername = signupUsername.trim();
    const trimmedEmail = signupEmail.trim();

    if (!trimmedUsername || !trimmedEmail || !signupPassword.trim()) {
      setErrorMsg('Please fill in all required fields (Username, Email, and Password).');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Security Requirement: Password must be at least 6 characters long.');
      return;
    }

    if (!signupAgreed) {
      setErrorMsg('You must check the required checkbox agreeing to the Terms of Service & Policies before signing up.');
      return;
    }

    setIsLoading(true);

    try {
      const accounts = getRegisteredAccounts();

      // 1. Verify if email or username is ALREADY in the local accounts database
      const existingEmail = accounts.find(a => a.email.toLowerCase() === trimmedEmail.toLowerCase());
      const existingUsername = accounts.find(a => a.username.toLowerCase() === trimmedUsername.toLowerCase());

      // 2. Also verify against Supabase profiles table if Supabase is connected
      const supabase = getSupabaseClient();
      let supabaseEmailExists = false;
      let supabaseUsernameExists = false;

      if (supabase) {
        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id, email, username')
            .or(`email.ilike.${trimmedEmail},username.ilike.${trimmedUsername}`)
            .maybeSingle();

          if (profileRow) {
            if (profileRow.email?.toLowerCase() === trimmedEmail.toLowerCase()) supabaseEmailExists = true;
            if (profileRow.username?.toLowerCase() === trimmedUsername.toLowerCase()) supabaseUsernameExists = true;
          }
        } catch (e) {
          console.warn('Supabase profile duplicate check warning:', e);
        }
      }

      if (existingEmail || supabaseEmailExists) {
        setIsLoading(false);
        setErrorMsg(`An account with the email "${trimmedEmail}" is already registered. Please sign in instead.`);
        setPromptAction('login');
        return;
      }

      if (existingUsername || supabaseUsernameExists) {
        setIsLoading(false);
        setErrorMsg(`The username "${trimmedUsername}" is already registered. Please choose another username or sign in.`);
        setPromptAction('login');
        return;
      }

      let userId = 'usr_' + btoa(trimmedEmail.toLowerCase()).replace(/=/g, '').substring(0, 12);

      if (supabase) {
        // Attempt Supabase Auth Signup
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: signupPassword,
          options: {
            data: {
              username: trimmedUsername,
            },
          },
        });

        if (error && !error.message.includes('already registered')) {
          console.warn('Supabase signup notice:', error.message);
        }

        if (data?.user?.id) {
          userId = data.user.id;
          // Store/Upsert record in public.profiles table
          await supabase.from('profiles').upsert({
            id: userId,
            email: trimmedEmail,
            username: trimmedUsername,
            has_accepted_terms: true,
            terms_accepted_date: new Date().toISOString(),
          });
        }
      }

      // Store in local account vault
      saveRegisteredAccount({
        id: userId,
        email: trimmedEmail,
        username: trimmedUsername,
        passwordHash: signupPassword,
      });

      const profile: UserProfile = {
        id: userId,
        email: trimmedEmail,
        username: trimmedUsername,
        hasAcceptedTerms: true,
        termsAcceptedDate: new Date().toISOString(),
        isDarkMode: false,
        currencySymbol: '₱',
        createdAt: new Date().toISOString(),
        isNewSignup: true,
        isExistingUser: false,
      };

      // Newly signed-up user -> isNewSignup = true
      onLoginSuccess(profile, true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed. Please check credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIN SUBMIT HANDLER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPromptAction(null);
    setSuccessMsg('');

    const input = loginIdentifier.trim();
    if (!input || !loginPassword.trim()) {
      setErrorMsg('Please enter both your Username/Email and Password.');
      return;
    }

    if (!loginAgreed) {
      setErrorMsg('You must check the required checkbox acknowledging the Terms of Service & Policies.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const accounts = getRegisteredAccounts();

      // 1. Verify first if the inputted username or email exists in the local database
      const localMatch = accounts.find(
        a => a.email.toLowerCase() === input.toLowerCase() || a.username.toLowerCase() === input.toLowerCase()
      );

      // 2. Also verify if it exists in Supabase profiles table
      let supabaseUserMatch: { id: string; email: string; username: string } | null = null;
      if (supabase) {
        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id, email, username')
            .or(`email.ilike.${input},username.ilike.${input}`)
            .maybeSingle();

          if (profileRow) {
            supabaseUserMatch = profileRow;
          }
        } catch (e) {
          console.warn('Supabase user verification warning:', e);
        }
      }

      const accountExists = !!localMatch || !!supabaseUserMatch;

      // REQUIREMENT: If the inputted username/email address is NOT in the database, prompt user to signup first!
      if (!accountExists) {
        setIsLoading(false);
        setErrorMsg(`Account not found: "${input}" is not registered in our database. Please sign up first.`);
        setPromptAction('signup');
        return;
      }

      // If user exists locally and password matches
      if (localMatch && localMatch.passwordHash === loginPassword) {
        const profile: UserProfile = {
          id: localMatch.id,
          email: localMatch.email,
          username: localMatch.username,
          hasAcceptedTerms: true,
          termsAcceptedDate: new Date().toISOString(),
          isDarkMode: false,
          currencySymbol: '₱',
          createdAt: new Date().toISOString(),
          isExistingUser: true,
          isNewSignup: false,
        };

        // Mark as existing user so they are NEVER prompted again and their data is protected
        localStorage.setItem(`iponta_prompted_fresh_${localMatch.id}`, 'true');
        localStorage.setItem(`iponta_is_existing_user_${localMatch.id}`, 'true');

        onLoginSuccess(profile, false);
        setIsLoading(false);
        return;
      }

      // If Supabase is connected, attempt Supabase Auth Sign In
      if (supabase) {
        let targetEmail = supabaseUserMatch?.email || (input.includes('@') ? input : null);

        if (!targetEmail) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', input)
            .maybeSingle();

          if (profileRow?.email) {
            targetEmail = profileRow.email;
          }
        }

        if (targetEmail) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: loginPassword,
          });

          if (error) {
            throw new Error('Authentication Failed: Incorrect password for this account. Please try again.');
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
              username: profileRow?.username || data.user.user_metadata?.username || (supabaseUserMatch?.username || targetEmail.split('@')[0]),
              householdName: profileRow?.household_name,
              hasAcceptedTerms: true,
              termsAcceptedDate: profileRow?.terms_accepted_date || new Date().toISOString(),
              isDarkMode: false,
              currencySymbol: profileRow?.currency_symbol || '₱',
              createdAt: profileRow?.created_at || new Date().toISOString(),
              isExistingUser: true,
              isNewSignup: false,
            };

            // Store in local vault so offline mode also works
            saveRegisteredAccount({
              id: data.user.id,
              email: profile.email,
              username: profile.username,
              passwordHash: loginPassword,
            });

            // Mark as existing user so they are NEVER prompted again
            localStorage.setItem(`iponta_prompted_fresh_${data.user.id}`, 'true');
            localStorage.setItem(`iponta_is_existing_user_${data.user.id}`, 'true');

            onLoginSuccess(profile, false);
            setIsLoading(false);
            return;
          }
        }
      }

      // If account was found in database but password did not match
      throw new Error('Authentication Failed: Incorrect password for this account. Please verify your credentials and try again.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] dark:bg-[#12181F] text-[#2C3E35] dark:text-[#E2E8F0] flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200">
      
      {/* Container Box */}
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Hero */}
        <div className="p-8 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white text-center relative space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
            <span className="text-2xl font-bold">₱</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">IponTa</h1>
          <p className="text-sm font-bold text-emerald-200">Tara, Ipon Ta!</p>
          <p className="text-xs text-emerald-100/90 max-w-xs mx-auto leading-relaxed">
            IponTa is a Filipino-focused personal finance and budget tracking platform designed to help users take control of their money, monitor spending, achieve savings goals, and build better financial habits.
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-1.5">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all ${
              !isSignUp
                ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all ${
              isSignUp
                ? 'bg-white dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Free Account
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6">
          
          {errorMsg && (
            <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>

              {promptAction === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setPromptAction(null);
                    setErrorMsg('');
                    if (loginIdentifier.includes('@')) {
                      setSignupEmail(loginIdentifier);
                      setSignupUsername(loginIdentifier.split('@')[0]);
                    } else {
                      setSignupUsername(loginIdentifier);
                    }
                  }}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up with &quot;{loginIdentifier}&quot;</span>
                </button>
              )}

              {promptAction === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setPromptAction(null);
                    setErrorMsg('');
                    setLoginEmailOrUsername(signupEmail || signupUsername);
                  }}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Switch to Sign In</span>
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGNUP FORM */}
          {isSignUp ? (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. JuanDelaCruz"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="juan@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account & Access Tracker</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Mandatory Policy Agreement Checkbox below button - Centered */}
              <div className="pt-2 flex justify-center text-center">
                <label className="inline-flex items-center justify-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto text-center">
                  <input
                    type="checkbox"
                    required
                    checked={signupAgreed}
                    onChange={(e) => setSignupAgreed(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                  />
                  <span className="leading-tight text-center">
                    I agree and understand the IponTa{' '}
                    <button
                      type="button"
                      onClick={onOpenPolicies}
                      className="underline font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                    >
                      Terms of Service & Privacy Policies
                    </button>, strictly as a personal finance tracker.
                  </span>
                </label>
              </div>

            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Field 1: Username or Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username or Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Username or email"
                    value={loginIdentifier}
                    onChange={(e) => setLoginEmailOrUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to IponTa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Mandatory Policy Agreement Checkbox below button - Centered */}
              <div className="pt-2 flex justify-center text-center">
                <label className="inline-flex items-center justify-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto text-center">
                  <input
                    type="checkbox"
                    required
                    checked={loginAgreed}
                    onChange={(e) => setLoginAgreed(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                  />
                  <span className="leading-tight text-center">
                    I acknowledge and agree to the IponTa{' '}
                    <button
                      type="button"
                      onClick={onOpenPolicies}
                      className="underline font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                    >
                      Terms of Service & Privacy Policies
                    </button>.
                  </span>
                </label>
              </div>

            </form>
          )}

          {/* Footer Policy Link */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenPolicies}
              className="text-xs text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read IponTa Terms & Disclaimers</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
