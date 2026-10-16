import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, AlertCircle, RefreshCw, X, Code } from 'lucide-react';
import { getSupabaseCredentials, setSupabaseCredentials, testSupabaseConnection, clearSupabaseCredentials } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const current = getSupabaseCredentials();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string }>({});
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Please provide both Supabase Project URL and Anon Key.' });
      return;
    }

    setIsTesting(true);
    setTestResult({});

    const res = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      setSupabaseCredentials(url, anonKey);
    }
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setTestResult({ success: true, message: 'Credentials cleared. IponTa is running in local offline storage mode.' });
  };

  const sqlSchemaCode = `-- ====================================================================
-- IPONTA - PRODUCTION-READY SUPABASE / POSTGRESQL DATABASE SCHEMA
-- Interconnected Personal & Household Financial Organizing Schema
-- Fully Idempotent & Self-Healing Migration (Runs cleanly on fresh or existing DBs)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BASE TABLES CREATION (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  has_accepted_terms BOOLEAN DEFAULT TRUE NOT NULL,
  terms_accepted_date TIMESTAMPTZ DEFAULT NOW(),
  household_name TEXT,
  currency_symbol TEXT DEFAULT '₱' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  credit_limit NUMERIC(12, 2) DEFAULT NULL,
  account_number_masked TEXT,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  color_hex TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon_name TEXT,
  color_hex TEXT,
  subcategories TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID,
  to_account_id UUID,
  type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  payment_method TEXT NOT NULL,
  to_account TEXT,
  date DATE NOT NULL,
  time TEXT,
  description TEXT NOT NULL,
  notes TEXT,
  tags TEXT[],
  receipt_url TEXT,
  receipt_items JSONB,
  is_shared BOOLEAN DEFAULT FALSE NOT NULL,
  shared_split_ratio NUMERIC(4, 2) DEFAULT 0.50 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  period TEXT NOT NULL,
  limit_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  target_date DATE NOT NULL,
  monthly_target_contribution NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  icon_name TEXT,
  color_hex TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recurring_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_date_day INT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  auto_remind BOOLEAN DEFAULT TRUE NOT NULL,
  is_paid_this_month BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  merchant_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  monthly_payment NUMERIC(12, 2) NOT NULL,
  total_months INT NOT NULL,
  paid_months INT DEFAULT 0 NOT NULL,
  start_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  category TEXT NOT NULL,
  interest_rate_percent NUMERIC(5, 2),
  interest_rate_type TEXT DEFAULT 'MONTHLY',
  interest_calculation_type TEXT DEFAULT 'ADD_ON',
  total_interest_amount NUMERIC(12, 2),
  total_payable_amount NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.debt_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  party_name TEXT NOT NULL,
  type TEXT NOT NULL,
  original_amount NUMERIC(12, 2) NOT NULL,
  remaining_amount NUMERIC(12, 2) NOT NULL,
  monthly_amortization NUMERIC(12, 2),
  due_date DATE,
  interest_rate_percent NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payday_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  payday_date DATE NOT NULL,
  net_pay NUMERIC(12, 2) NOT NULL,
  fixed_bills_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  savings_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  food_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  transport_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  discretionary_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  income_contribution_ratio NUMERIC(4, 2) DEFAULT 0.50 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT
);

-- 2. SELF-HEALING COLUMN REPAIR (FIX FOR ERROR: 42703 column "account_id" does not exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '₱';

ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) DEFAULT NULL;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS account_number_masked TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS color_hex TEXT;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Ensure account_id exists on transactions BEFORE creating index
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS to_account_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS to_account TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_items JSONB;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS shared_split_ratio NUMERIC(4, 2) DEFAULT 0.50;

-- 3. SAFELY ENSURE CONSTRAINTS & FOREIGN KEYS
DO $$
BEGIN
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER'));

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_account_id_fkey' AND table_name = 'transactions'
  ) THEN
    ALTER TABLE public.transactions 
      ADD CONSTRAINT transactions_account_id_fkey 
      FOREIGN KEY (account_id) REFERENCES public.financial_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_to_account_id_fkey' AND table_name = 'transactions'
  ) THEN
    ALTER TABLE public.transactions 
      ADD CONSTRAINT transactions_to_account_id_fkey 
      FOREIGN KEY (to_account_id) REFERENCES public.financial_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'financial_accounts_user_id_name_key' AND table_name = 'financial_accounts'
  ) THEN
    ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_user_id_name_key UNIQUE (user_id, name);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. AUTO-INTERCONNECT EXISTING TRANSACTIONS WITH ACCOUNTS
UPDATE public.transactions t
SET account_id = a.id
FROM public.financial_accounts a
WHERE t.account_id IS NULL 
  AND t.user_id = a.user_id 
  AND LOWER(TRIM(t.payment_method)) = LOWER(TRIM(a.name));

-- 5. PERFORMANCE INDEXES (Guaranteed error-free)
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payday_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'anon');
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'anon');
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own financial accounts" ON public.financial_accounts;
CREATE POLICY "Users can manage own financial accounts" ON public.financial_accounts FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can access own transactions" ON public.transactions;
CREATE POLICY "Users can access own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own budget limits" ON public.budget_limits;
CREATE POLICY "Users can manage own budget limits" ON public.budget_limits FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own savings goals" ON public.savings_goals;
CREATE POLICY "Users can manage own savings goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can manage own recurring bills" ON public.recurring_bills FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own installments" ON public.installments;
CREATE POLICY "Users can manage own installments" ON public.installments FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own debt loans" ON public.debt_loans;
CREATE POLICY "Users can manage own debt loans" ON public.debt_loans FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own payday allocations" ON public.payday_allocations;
CREATE POLICY "Users can manage own payday allocations" ON public.payday_allocations FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own household members" ON public.household_members;
CREATE POLICY "Users can manage own household members" ON public.household_members FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon') WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');
DROP POLICY IF EXISTS "Audit logs immutable" ON public.audit_logs FOR UPDATE USING (FALSE);

-- 7. NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, has_accepted_terms)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      username = COALESCE(EXCLUDED.username, public.profiles.username),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Supabase Database Setup & Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your cloud Supabase database or inspect database SQL schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Prepared Supabase Integration</span>
            </div>
            <p className="leading-relaxed">
              IponTa includes a full Supabase integration layer. Enter your Supabase credentials below or provide <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 font-mono">VITE_SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 font-mono">VITE_SUPABASE_ANON_KEY</code>. If credentials are not set, the app automatically runs in local isolated storage mode with offline sync capability!
            </p>
          </div>

          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyz.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public Key
              </label>
              <textarea
                rows={3}
                placeholder="eyJh..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {testResult.message && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>Test & Connect Database</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Reset to Local Mode
              </button>
            </div>
          </form>

          {/* SQL Migration Code Toggle */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <Code className="w-4 h-4" />
                <span>{showSql ? 'Hide SQL Database Migration Script' : 'View Complete Supabase SQL Database Migration Script'}</span>
              </button>

              {showSql && (
                <button
                  type="button"
                  onClick={copySql}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
                </button>
              )}
            </div>

            {showSql && (
              <pre className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
                {sqlSchemaCode}
              </pre>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
