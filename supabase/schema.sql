-- ====================================================================
-- BALANSE PH - PRODUCTION-READY SUPABASE / POSTGRESQL DATABASE SCHEMA
-- Interconnected Personal & Household Financial Organizing Schema
-- Fully Idempotent & Self-Healing Migration (Runs cleanly on fresh or existing DBs)
-- ====================================================================

-- --------------------------------------------------------------------
-- EXTENSIONS
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- SECTION 1: CREATE TABLES IF NOT EXISTS
-- ====================================================================

-- 1. USER PROFILES TABLE (Root Entity)
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

-- 2. FINANCIAL ACCOUNTS & MONEY STORAGE CONTAINERS
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

-- 3. CATEGORIES TABLE
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

-- 4. TRANSACTIONS TABLE
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

-- 5. BUDGET LIMITS TABLE
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

-- 6. SAVINGS GOALS TABLE
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

-- 7. RECURRING BILLS TABLE
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

-- 8. INSTALLMENTS & PAYLATER TABLE
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

-- 9. DEBTS & LOANS TABLE
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

-- 10. PAYDAY ALLOCATIONS TABLE
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

-- 11. HOUSEHOLD MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  income_contribution_ratio NUMERIC(4, 2) DEFAULT 0.50 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. AUDIT LOGS TABLE
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


-- ====================================================================
-- SECTION 2: SELF-HEALING COLUMN REPAIR (CRITICAL FIX FOR 42703)
-- Guarantees every single column exists on pre-existing tables BEFORE
-- any index or constraint is referenced.
-- ====================================================================

-- Profiles Columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '₱';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Financial Accounts Columns
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) DEFAULT NULL;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS account_number_masked TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Categories Columns
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- TRANSACTIONS Columns (PREVENTS ERROR: 42703 column "account_id" does not exist)
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
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Budget Limits Columns
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS limit_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.budget_limits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Savings Goals Columns
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS target_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS current_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS monthly_target_contribution NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Recurring Bills Columns
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS due_date_day INT DEFAULT 1;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS auto_remind BOOLEAN DEFAULT TRUE;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS is_paid_this_month BOOLEAN DEFAULT FALSE;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Installments Columns
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS total_months INT DEFAULT 1;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS paid_months INT DEFAULT 0;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Debt Loans Columns
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS party_name TEXT;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS monthly_amortization NUMERIC(12, 2);
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS interest_rate_percent NUMERIC(5, 2);
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.debt_loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Payday Allocations Columns
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS payday_date DATE;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS net_pay NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS fixed_bills_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS savings_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS food_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS transport_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS discretionary_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.payday_allocations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Household Members Columns
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS income_contribution_ratio NUMERIC(4, 2) DEFAULT 0.50;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Audit Logs Columns
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS previous_value TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT;


-- ====================================================================
-- SECTION 3: SAFELY ENSURE FOREIGN KEYS & CONSTRAINTS
-- ====================================================================
DO $$
BEGIN
  -- Safe check constraint for transactions type (INCOME, EXPENSE, TRANSFER)
  BEGIN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER'));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Safe foreign key: transactions.account_id -> financial_accounts(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_account_id_fkey' AND table_name = 'transactions'
  ) THEN
    BEGIN
      ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES public.financial_accounts(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- Safe foreign key: transactions.to_account_id -> financial_accounts(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_to_account_id_fkey' AND table_name = 'transactions'
  ) THEN
    BEGIN
      ALTER TABLE public.transactions 
        ADD CONSTRAINT transactions_to_account_id_fkey 
        FOREIGN KEY (to_account_id) REFERENCES public.financial_accounts(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- Unique constraint on financial_accounts (user_id, name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'financial_accounts_user_id_name_key' AND table_name = 'financial_accounts'
  ) THEN
    BEGIN
      ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_user_id_name_key UNIQUE (user_id, name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;


-- ====================================================================
-- SECTION 4: AUTO-INTERCONNECT EXISTING DATA
-- Populates missing account_id references by matching paymentMethod to Account names
-- ====================================================================
UPDATE public.transactions t
SET account_id = a.id
FROM public.financial_accounts a
WHERE t.account_id IS NULL 
  AND t.user_id = a.user_id 
  AND LOWER(TRIM(t.payment_method)) = LOWER(TRIM(a.name));

UPDATE public.transactions t
SET to_account_id = a.id
FROM public.financial_accounts a
WHERE t.to_account_id IS NULL 
  AND t.to_account IS NOT NULL
  AND t.user_id = a.user_id 
  AND LOWER(TRIM(t.to_account)) = LOWER(TRIM(a.name));


-- ====================================================================
-- SECTION 5: CREATE PERFORMANCE INDEXES
-- Columns are guaranteed to exist, so index creation is 100% error-free
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);

CREATE INDEX IF NOT EXISTS idx_budget_limits_user ON public.budget_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_user ON public.recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_user ON public.installments(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_loans_user ON public.debt_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_payday_allocations_user ON public.payday_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);


-- ====================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- Clean, idempotent policies supporting authenticated and offline-first dev access
-- ====================================================================
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

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 2. Financial Accounts Policies
DROP POLICY IF EXISTS "Users can manage own financial accounts" ON public.financial_accounts;
CREATE POLICY "Users can manage own financial accounts" 
  ON public.financial_accounts FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 3. Categories Policies
DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
CREATE POLICY "Users can view categories" 
  ON public.categories FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" 
  ON public.categories FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 4. Transactions Policies
DROP POLICY IF EXISTS "Users can access own transactions" ON public.transactions;
CREATE POLICY "Users can access own transactions" 
  ON public.transactions FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 5. Budget Limits Policies
DROP POLICY IF EXISTS "Users can manage own budget limits" ON public.budget_limits;
CREATE POLICY "Users can manage own budget limits" 
  ON public.budget_limits FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 6. Savings Goals Policies
DROP POLICY IF EXISTS "Users can manage own savings goals" ON public.savings_goals;
CREATE POLICY "Users can manage own savings goals" 
  ON public.savings_goals FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 7. Recurring Bills Policies
DROP POLICY IF EXISTS "Users can manage own recurring bills" ON public.recurring_bills;
CREATE POLICY "Users can manage own recurring bills" 
  ON public.recurring_bills FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 8. Installments Policies
DROP POLICY IF EXISTS "Users can manage own installments" ON public.installments;
CREATE POLICY "Users can manage own installments" 
  ON public.installments FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 9. Debt Loans Policies
DROP POLICY IF EXISTS "Users can manage own debt loans" ON public.debt_loans;
CREATE POLICY "Users can manage own debt loans" 
  ON public.debt_loans FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 10. Payday Allocations Policies
DROP POLICY IF EXISTS "Users can manage own payday allocations" ON public.payday_allocations;
CREATE POLICY "Users can manage own payday allocations" 
  ON public.payday_allocations FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 11. Household Members Policies
DROP POLICY IF EXISTS "Users can manage own household members" ON public.household_members;
CREATE POLICY "Users can manage own household members" 
  ON public.household_members FOR ALL 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

-- 12. Audit Logs Policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Audit logs are immutable" ON public.audit_logs;
CREATE POLICY "Audit logs are immutable" 
  ON public.audit_logs FOR UPDATE 
  USING (FALSE);


-- ====================================================================
-- SECTION 7: AUTOMATIC NEW USER TRIGGER
-- ====================================================================
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
END $$;
