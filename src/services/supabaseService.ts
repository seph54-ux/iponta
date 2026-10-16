import { getSupabaseClient } from '../lib/supabase';
import {
  FinancialAccount,
  Transaction,
  Category,
  BudgetLimit,
  SavingsGoal,
  RecurringBill,
  Installment,
  DebtLoan,
  PaydayAllocation,
  HouseholdMember,
  AuditLog,
} from '../types';

/**
 * Validates and converts any arbitrary string ID into a valid PostgreSQL UUID v4 string.
 * If the string is already a valid UUID, returns it. Otherwise generates a deterministic valid UUID.
 */
export function toValidUuid(id: string): string {
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return '00000000-0000-4000-8000-000000000001';
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }

  // Generate deterministic 32-hex characters from input string
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < id.length; i++) {
    const ch = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hexPart1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hexPart2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hexPart3 = ((h1 ^ 0x12345678) >>> 0).toString(16).padStart(8, '0');
  const hexPart4 = ((h2 ^ 0x87654321) >>> 0).toString(16).padStart(8, '0');
  const fullHex = (hexPart1 + hexPart2 + hexPart3 + hexPart4).substring(0, 32);

  // Format as 8-4-4-4-12 with valid version 4 and variant bits
  return `${fullHex.substring(0, 8)}-${fullHex.substring(8, 12)}-4${fullHex.substring(13, 16)}-a${fullHex.substring(17, 20)}-${fullHex.substring(20, 32)}`;
}

export interface AllUserData {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  categories: Category[];
  budgets: BudgetLimit[];
  savingsGoals: SavingsGoal[];
  recurringBills: RecurringBill[];
  installments: Installment[];
  debts: DebtLoan[];
  paydayAllocations: PaydayAllocation[];
  householdMembers: HouseholdMember[];
  auditLogs: AuditLog[];
}

export class SupabaseDbService {
  /**
   * Fetches all user data across all 11 tables from Supabase PostgreSQL in parallel.
   */
  async fetchUserData(rawUserId: string): Promise<AllUserData | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const userId = toValidUuid(rawUserId);

    try {
      const [
        accountsRes,
        categoriesRes,
        transactionsRes,
        budgetsRes,
        savingsRes,
        billsRes,
        installmentsRes,
        debtsRes,
        paydayRes,
        householdRes,
        auditRes,
      ] = await Promise.all([
        supabase.from('financial_accounts').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('budget_limits').select('*').eq('user_id', userId),
        supabase.from('savings_goals').select('*').eq('user_id', userId),
        supabase.from('recurring_bills').select('*').eq('user_id', userId),
        supabase.from('installments').select('*').eq('user_id', userId),
        supabase.from('debt_loans').select('*').eq('user_id', userId),
        supabase.from('payday_allocations').select('*').eq('user_id', userId).order('payday_date', { ascending: false }),
        supabase.from('household_members').select('*').eq('user_id', userId),
        supabase.from('audit_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(200),
      ]);

      // Map financial_accounts
      const accounts: FinancialAccount[] = (accountsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        type: row.type,
        balance: Number(row.balance) || 0,
        creditLimit: row.credit_limit !== null ? Number(row.credit_limit) : undefined,
        accountNumberMasked: row.account_number_masked || undefined,
        isDefault: Boolean(row.is_default),
        colorHex: row.color_hex || undefined,
      }));

      // Map categories
      const categories: Category[] = (categoriesRes.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        iconName: row.icon_name || 'Tag',
        colorHex: row.color_hex || '#2E7D5B',
        subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
        isCustom: Boolean(row.is_custom),
        description: row.description || undefined,
      }));

      // Map transactions
      const transactions: Transaction[] = (transactionsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        amount: Number(row.amount) || 0,
        category: row.category,
        subcategory: row.subcategory || undefined,
        paymentMethod: row.payment_method,
        toAccount: row.to_account || undefined,
        date: row.date,
        time: row.time || undefined,
        description: row.description,
        notes: row.notes || undefined,
        tags: Array.isArray(row.tags) ? row.tags : undefined,
        receiptUrl: row.receipt_url || undefined,
        isShared: Boolean(row.is_shared),
        sharedSplitRatio: row.shared_split_ratio !== null ? Number(row.shared_split_ratio) : 0.5,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      }));

      // Map budget_limits
      const budgets: BudgetLimit[] = (budgetsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        categoryName: row.category_name,
        period: row.period,
        limitAmount: Number(row.limit_amount) || 0,
      }));

      // Map savings_goals
      const savingsGoals: SavingsGoal[] = (savingsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        targetAmount: Number(row.target_amount) || 0,
        currentAmount: Number(row.current_amount) || 0,
        targetDate: row.target_date,
        monthlyTargetContribution: Number(row.monthly_target_contribution) || 0,
        iconName: row.icon_name || undefined,
        colorHex: row.color_hex || undefined,
      }));

      // Map recurring_bills
      const recurringBills: RecurringBill[] = (billsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        amount: Number(row.amount) || 0,
        dueDateDay: Number(row.due_date_day) || 1,
        category: row.category,
        paymentMethod: row.payment_method,
        autoRemind: Boolean(row.auto_remind),
        isPaidThisMonth: Boolean(row.is_paid_this_month),
        notes: row.notes || undefined,
      }));

      // Map installments
      const installments: Installment[] = (installmentsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        merchantName: row.merchant_name,
        itemName: row.item_name,
        totalAmount: Number(row.total_amount) || 0,
        monthlyPayment: Number(row.monthly_payment) || 0,
        totalMonths: Number(row.total_months) || 1,
        paidMonths: Number(row.paid_months) || 0,
        startDate: row.start_date,
        paymentMethod: row.payment_method,
        category: row.category,
        interestRatePercent: row.interest_rate_percent !== null && row.interest_rate_percent !== undefined ? Number(row.interest_rate_percent) : undefined,
        interestRateType: row.interest_rate_type || undefined,
        interestCalculationType: row.interest_calculation_type || undefined,
        totalInterestAmount: row.total_interest_amount !== null && row.total_interest_amount !== undefined ? Number(row.total_interest_amount) : undefined,
        totalPayableAmount: row.total_payable_amount !== null && row.total_payable_amount !== undefined ? Number(row.total_payable_amount) : undefined,
        notes: row.notes || undefined,
      }));

      // Map debt_loans
      const debts: DebtLoan[] = (debtsRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        partyName: row.party_name,
        type: row.type,
        originalAmount: Number(row.original_amount) || 0,
        remainingAmount: Number(row.remaining_amount) || 0,
        monthlyAmortization: row.monthly_amortization !== null ? Number(row.monthly_amortization) : undefined,
        dueDate: row.due_date || undefined,
        interestRatePercent: row.interest_rate_percent !== null ? Number(row.interest_rate_percent) : undefined,
        notes: row.notes || undefined,
      }));

      // Map payday_allocations
      const paydayAllocations: PaydayAllocation[] = (paydayRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        paydayDate: row.payday_date,
        netPay: Number(row.net_pay) || 0,
        fixedBillsAmount: Number(row.fixed_bills_amount) || 0,
        savingsAmount: Number(row.savings_amount) || 0,
        foodAmount: Number(row.food_amount) || 0,
        transportAmount: Number(row.transport_amount) || 0,
        discretionaryAmount: Number(row.discretionary_amount) || 0,
        notes: row.notes || undefined,
      }));

      // Map household_members
      const householdMembers: HouseholdMember[] = (householdRes.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email || undefined,
        role: row.role,
        incomeContributionRatio: row.income_contribution_ratio !== null ? Number(row.income_contribution_ratio) : 0.5,
      }));

      // Map audit_logs
      const auditLogs: AuditLog[] = (auditRes.data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        timestamp: row.timestamp,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        summary: row.summary,
        previousValue: row.previous_value || undefined,
        newValue: row.new_value || undefined,
      }));

      return {
        accounts,
        transactions,
        categories,
        budgets,
        savingsGoals,
        recurringBills,
        installments,
        debts,
        paydayAllocations,
        householdMembers,
        auditLogs,
      };
    } catch (err) {
      console.error('Failed to fetch user data from Supabase:', err);
      return null;
    }
  }

  /**
   * Syncs ALL existing local application tables to Supabase.
   * Resolves relational foreign keys (accounts -> transactions).
   */
  async syncAllDataToSupabase(rawUserId: string, data: AllUserData): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    const userId = toValidUuid(rawUserId);

    try {
      // 1. Ensure User Profile exists in profiles table
      await supabase.from('profiles').upsert(
        {
          id: userId,
          email: `${rawUserId.replace(/[^a-zA-Z0-9]/g, '')}@iponta.local`,
          username: rawUserId,
          has_accepted_terms: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      // 2. Sync Financial Accounts
      const accountRows = data.accounts.map((a) => ({
        id: toValidUuid(a.id),
        user_id: userId,
        name: a.name,
        type: a.type,
        balance: a.balance,
        credit_limit: a.creditLimit ?? null,
        account_number_masked: a.accountNumberMasked ?? null,
        is_default: Boolean(a.isDefault),
        color_hex: a.colorHex ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (accountRows.length > 0) {
        const { error } = await supabase.from('financial_accounts').upsert(accountRows, { onConflict: 'id' });
        if (error) console.warn('Supabase accounts sync warning:', error.message);
      }

      // Map account names to their clean UUIDs for foreign key linking in transactions
      const accountMap = new Map<string, string>();
      data.accounts.forEach((a) => {
        accountMap.set(a.name.toLowerCase(), toValidUuid(a.id));
      });

      // 3. Sync Categories
      const categoryRows = data.categories
        .filter((c) => c.isCustom)
        .map((c) => ({
          id: toValidUuid(c.id),
          user_id: userId,
          name: c.name,
          type: c.type,
          icon_name: c.iconName,
          color_hex: c.colorHex,
          subcategories: c.subcategories || [],
          description: c.description ?? null,
          is_custom: true,
        }));

      if (categoryRows.length > 0) {
        const { error } = await supabase.from('categories').upsert(categoryRows, { onConflict: 'id' });
        if (error) console.warn('Supabase categories sync warning:', error.message);
      }

      // 4. Sync Transactions with proper foreign keys
      const transactionRows = data.transactions.map((t) => {
        const srcAccId = accountMap.get(t.paymentMethod.toLowerCase()) || null;
        const destAccId = t.toAccount ? accountMap.get(t.toAccount.toLowerCase()) || null : null;

        return {
          id: toValidUuid(t.id),
          user_id: userId,
          account_id: srcAccId,
          to_account_id: destAccId,
          type: t.type,
          amount: t.amount,
          category: t.category,
          subcategory: t.subcategory ?? null,
          payment_method: t.paymentMethod,
          to_account: t.toAccount ?? null,
          date: t.date,
          time: t.time ?? null,
          description: t.description,
          notes: t.notes ?? null,
          tags: t.tags ?? null,
          is_shared: Boolean(t.isShared),
          shared_split_ratio: t.sharedSplitRatio ?? 0.5,
          created_at: t.createdAt || new Date().toISOString(),
          updated_at: t.updatedAt || new Date().toISOString(),
        };
      });

      if (transactionRows.length > 0) {
        const { error } = await supabase.from('transactions').upsert(transactionRows, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase transactions sync warning:', error.message);
          // Self-healing fallback: if remote table was created from an older schema without account_id, retry without account_id so data is preserved!
          if (error.message && (error.message.includes('account_id') || error.message.includes('column'))) {
            const fallbackRows = transactionRows.map(({ account_id, to_account_id, ...rest }) => rest);
            const fallbackRes = await supabase.from('transactions').upsert(fallbackRows, { onConflict: 'id' });
            if (fallbackRes.error) {
              console.warn('Supabase transactions fallback warning:', fallbackRes.error.message);
            }
          }
        }
      }

      // 5. Sync Budgets
      const budgetRows = data.budgets.map((b) => ({
        id: toValidUuid(b.id),
        user_id: userId,
        category_id: b.categoryId,
        category_name: b.categoryName,
        period: b.period,
        limit_amount: b.limitAmount,
        updated_at: new Date().toISOString(),
      }));

      if (budgetRows.length > 0) {
        const { error } = await supabase.from('budget_limits').upsert(budgetRows, { onConflict: 'id' });
        if (error) console.warn('Supabase budget limits sync warning:', error.message);
      }

      // 6. Sync Savings Goals
      const savingsRows = data.savingsGoals.map((g) => ({
        id: toValidUuid(g.id),
        user_id: userId,
        title: g.title,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate,
        monthly_target_contribution: g.monthlyTargetContribution,
        icon_name: g.iconName ?? null,
        color_hex: g.colorHex ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (savingsRows.length > 0) {
        const { error } = await supabase.from('savings_goals').upsert(savingsRows, { onConflict: 'id' });
        if (error) console.warn('Supabase savings sync warning:', error.message);
      }

      // 7. Sync Recurring Bills
      const billRows = data.recurringBills.map((b) => ({
        id: toValidUuid(b.id),
        user_id: userId,
        title: b.title,
        amount: b.amount,
        due_date_day: b.dueDateDay,
        category: b.category,
        payment_method: b.paymentMethod,
        auto_remind: Boolean(b.autoRemind),
        is_paid_this_month: Boolean(b.isPaidThisMonth),
        notes: b.notes ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (billRows.length > 0) {
        const { error } = await supabase.from('recurring_bills').upsert(billRows, { onConflict: 'id' });
        if (error) console.warn('Supabase bills sync warning:', error.message);
      }

      // 8. Sync Installments
      const installmentRows = data.installments.map((i) => ({
        id: toValidUuid(i.id),
        user_id: userId,
        merchant_name: i.merchantName,
        item_name: i.itemName,
        total_amount: i.totalAmount,
        monthly_payment: i.monthlyPayment,
        total_months: i.totalMonths,
        paid_months: i.paidMonths,
        start_date: i.startDate,
        payment_method: i.paymentMethod,
        category: i.category,
        interest_rate_percent: i.interestRatePercent ?? null,
        interest_rate_type: i.interestRateType ?? null,
        interest_calculation_type: i.interestCalculationType ?? null,
        total_interest_amount: i.totalInterestAmount ?? null,
        total_payable_amount: i.totalPayableAmount ?? null,
        notes: i.notes ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (installmentRows.length > 0) {
        const { error } = await supabase.from('installments').upsert(installmentRows, { onConflict: 'id' });
        if (error) console.warn('Supabase installments sync warning:', error.message);
      }

      // 9. Sync Debts & Loans
      const debtRows = data.debts.map((d) => ({
        id: toValidUuid(d.id),
        user_id: userId,
        party_name: d.partyName,
        type: d.type,
        original_amount: d.originalAmount,
        remaining_amount: d.remainingAmount,
        monthly_amortization: d.monthlyAmortization ?? null,
        due_date: d.dueDate ?? null,
        interest_rate_percent: d.interestRatePercent ?? null,
        notes: d.notes ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (debtRows.length > 0) {
        const { error } = await supabase.from('debt_loans').upsert(debtRows, { onConflict: 'id' });
        if (error) console.warn('Supabase debt loans sync warning:', error.message);
      }

      // 10. Sync Payday Allocations
      const paydayRows = data.paydayAllocations.map((p) => ({
        id: toValidUuid(p.id),
        user_id: userId,
        payday_date: p.paydayDate,
        net_pay: p.netPay,
        fixed_bills_amount: p.fixedBillsAmount,
        savings_amount: p.savingsAmount,
        food_amount: p.foodAmount,
        transport_amount: p.transportAmount,
        discretionary_amount: p.discretionaryAmount,
        notes: p.notes ?? null,
      }));

      if (paydayRows.length > 0) {
        const { error } = await supabase.from('payday_allocations').upsert(paydayRows, { onConflict: 'id' });
        if (error) console.warn('Supabase payday sync warning:', error.message);
      }

      // 11. Sync Household Members
      const householdRows = data.householdMembers.map((m) => ({
        id: toValidUuid(m.id),
        user_id: userId,
        name: m.name,
        email: m.email ?? null,
        role: m.role,
        income_contribution_ratio: m.incomeContributionRatio ?? 0.5,
      }));

      if (householdRows.length > 0) {
        const { error } = await supabase.from('household_members').upsert(householdRows, { onConflict: 'id' });
        if (error) console.warn('Supabase household members sync warning:', error.message);
      }

      return { success: true, message: 'All tables synced to Supabase successfully!' };
    } catch (err: any) {
      console.error('Failed to sync data to Supabase:', err);
      return { success: false, message: err.message || 'Supabase sync failed' };
    }
  }

  // -------------------------------------------------------------
  // Live Real-Time Mutations
  // -------------------------------------------------------------

  async upsertAccount(rawUserId: string, account: FinancialAccount): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('financial_accounts').upsert({
        id: toValidUuid(account.id),
        user_id: userId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        credit_limit: account.creditLimit ?? null,
        account_number_masked: account.accountNumberMasked ?? null,
        is_default: Boolean(account.isDefault),
        color_hex: account.colorHex ?? null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase upsertAccount error:', e);
    }
  }

  async deleteAccount(rawUserId: string, accountId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('financial_accounts').delete().eq('id', toValidUuid(accountId));
    } catch (e) {
      console.warn('Supabase deleteAccount error:', e);
    }
  }

  async upsertTransaction(rawUserId: string, transaction: Transaction, accounts: FinancialAccount[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);

    // Relational Foreign Key lookup
    const srcAccount = accounts.find((a) => a.name.toLowerCase() === transaction.paymentMethod.toLowerCase());
    const destAccount = transaction.toAccount
      ? accounts.find((a) => a.name.toLowerCase() === transaction.toAccount!.toLowerCase())
      : undefined;

    try {
      const payload: any = {
        id: toValidUuid(transaction.id),
        user_id: userId,
        account_id: srcAccount ? toValidUuid(srcAccount.id) : null,
        to_account_id: destAccount ? toValidUuid(destAccount.id) : null,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        subcategory: transaction.subcategory ?? null,
        payment_method: transaction.paymentMethod,
        to_account: transaction.toAccount ?? null,
        date: transaction.date,
        time: transaction.time ?? null,
        description: transaction.description,
        notes: transaction.notes ?? null,
        tags: transaction.tags ?? null,
        is_shared: Boolean(transaction.isShared),
        shared_split_ratio: transaction.sharedSplitRatio ?? 0.5,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('transactions').upsert(payload);
      if (error) {
        if (error.message && (error.message.includes('account_id') || error.message.includes('column'))) {
          delete payload.account_id;
          delete payload.to_account_id;
          await supabase.from('transactions').upsert(payload);
        } else {
          console.warn('Supabase upsertTransaction error:', error.message);
        }
      }
    } catch (e) {
      console.warn('Supabase upsertTransaction error:', e);
    }
  }

  async deleteTransaction(rawUserId: string, transactionId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('transactions').delete().eq('id', toValidUuid(transactionId));
    } catch (e) {
      console.warn('Supabase deleteTransaction error:', e);
    }
  }

  async upsertCategory(rawUserId: string, category: Category): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('categories').upsert({
        id: toValidUuid(category.id),
        user_id: userId,
        name: category.name,
        type: category.type,
        icon_name: category.iconName,
        color_hex: category.colorHex,
        subcategories: category.subcategories || [],
        description: category.description ?? null,
        is_custom: true,
      });
    } catch (e) {
      console.warn('Supabase upsertCategory error:', e);
    }
  }

  async deleteCategory(rawUserId: string, categoryId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('categories').delete().eq('id', toValidUuid(categoryId));
    } catch (e) {
      console.warn('Supabase deleteCategory error:', e);
    }
  }

  async upsertBudget(rawUserId: string, budget: BudgetLimit): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('budget_limits').upsert({
        id: toValidUuid(budget.id),
        user_id: userId,
        category_id: budget.categoryId,
        category_name: budget.categoryName,
        period: budget.period,
        limit_amount: budget.limitAmount,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase upsertBudget error:', e);
    }
  }

  async deleteBudget(rawUserId: string, budgetId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      await supabase.from('budget_limits').delete().eq('id', toValidUuid(budgetId));
    } catch (e) {
      console.warn('Supabase deleteBudget error:', e);
    }
  }

  async upsertSavingsGoal(rawUserId: string, goal: SavingsGoal): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('savings_goals').upsert({
        id: toValidUuid(goal.id),
        user_id: userId,
        title: goal.title,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        target_date: goal.targetDate,
        monthly_target_contribution: goal.monthlyTargetContribution,
        icon_name: goal.iconName ?? null,
        color_hex: goal.colorHex ?? null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase upsertSavingsGoal error:', e);
    }
  }

  async deleteSavingsGoal(rawUserId: string, goalId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('savings_goals').delete().eq('id', toValidUuid(goalId));
    } catch (e) {
      console.warn('Supabase deleteSavingsGoal error:', e);
    }
  }

  async upsertRecurringBill(rawUserId: string, bill: RecurringBill): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('recurring_bills').upsert({
        id: toValidUuid(bill.id),
        user_id: userId,
        title: bill.title,
        amount: bill.amount,
        due_date_day: bill.dueDateDay,
        category: bill.category,
        payment_method: bill.paymentMethod,
        auto_remind: Boolean(bill.autoRemind),
        is_paid_this_month: Boolean(bill.isPaidThisMonth),
        notes: bill.notes ?? null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase upsertRecurringBill error:', e);
    }
  }

  async deleteRecurringBill(rawUserId: string, billId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('recurring_bills').delete().eq('id', toValidUuid(billId));
    } catch (e) {
      console.warn('Supabase deleteRecurringBill error:', e);
    }
  }

  async upsertInstallment(rawUserId: string, installment: Installment): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('installments').upsert({
        id: toValidUuid(installment.id),
        user_id: userId,
        merchant_name: installment.merchantName,
        item_name: installment.itemName,
        total_amount: installment.totalAmount,
        monthly_payment: installment.monthlyPayment,
        total_months: installment.totalMonths,
        paid_months: installment.paidMonths,
        start_date: installment.startDate,
        payment_method: installment.paymentMethod,
        category: installment.category,
        interest_rate_percent: installment.interestRatePercent ?? null,
        interest_rate_type: installment.interestRateType ?? null,
        interest_calculation_type: installment.interestCalculationType ?? null,
        total_interest_amount: installment.totalInterestAmount ?? null,
        total_payable_amount: installment.totalPayableAmount ?? null,
        notes: installment.notes ?? null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase upsertInstallment error:', e);
    }
  }

  async deleteInstallment(rawUserId: string, installmentId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('installments').delete().eq('id', toValidUuid(installmentId));
    } catch (e) {
      console.warn('Supabase deleteInstallment error:', e);
    }
  }

  async upsertDebt(rawUserId: string, debt: DebtLoan): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('debt_loans').upsert({
        id: toValidUuid(debt.id),
        user_id: userId,
        party_name: debt.partyName,
        type: debt.type,
        original_amount: debt.originalAmount,
        remaining_amount: debt.remainingAmount,
        monthly_amortization: debt.monthlyAmortization ?? null,
        due_date: debt.dueDate ?? null,
        interest_rate_percent: debt.interestRatePercent ?? null,
        notes: debt.notes ?? null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase upsertDebt error:', e);
    }
  }

  async deleteDebt(rawUserId: string, debtId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('debt_loans').delete().eq('id', toValidUuid(debtId));
    } catch (e) {
      console.warn('Supabase deleteDebt error:', e);
    }
  }

  async upsertPaydayAllocation(rawUserId: string, alloc: PaydayAllocation): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('payday_allocations').upsert({
        id: toValidUuid(alloc.id),
        user_id: userId,
        payday_date: alloc.paydayDate,
        net_pay: alloc.netPay,
        fixed_bills_amount: alloc.fixedBillsAmount,
        savings_amount: alloc.savingsAmount,
        food_amount: alloc.foodAmount,
        transport_amount: alloc.transportAmount,
        discretionary_amount: alloc.discretionaryAmount,
        notes: alloc.notes ?? null,
      });
    } catch (e) {
      console.warn('Supabase upsertPaydayAllocation error:', e);
    }
  }

  async upsertHouseholdMembers(rawUserId: string, members: HouseholdMember[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      const rows = members.map((m) => ({
        id: toValidUuid(m.id),
        user_id: userId,
        name: m.name,
        email: m.email ?? null,
        role: m.role,
        income_contribution_ratio: m.incomeContributionRatio ?? 0.5,
      }));
      await supabase.from('household_members').upsert(rows, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase upsertHouseholdMembers error:', e);
    }
  }

  async upsertUserProfile(rawUserId: string, profile: { username: string; email: string; householdName?: string; currencySymbol?: string }): Promise<{ success: boolean; message?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: true }; // Local-first fallback

    const userId = toValidUuid(rawUserId);
    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email: profile.email,
          username: profile.username,
          household_name: profile.householdName ?? null,
          currency_symbol: profile.currencySymbol ?? '₱',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('Supabase upsertUserProfile error:', error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.warn('Supabase upsertUserProfile exception:', e);
      return { success: false, message: e.message };
    }
  }

  async insertAuditLog(rawUserId: string, log: AuditLog): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);
    try {
      await supabase.from('audit_logs').insert({
        id: toValidUuid(log.id),
        user_id: userId,
        user_name: log.userName,
        timestamp: log.timestamp || new Date().toISOString(),
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        summary: log.summary,
        previous_value: log.previousValue ?? null,
        new_value: log.newValue ?? null,
      });
    } catch (e) {
      console.warn('Supabase insertAuditLog error:', e);
    }
  }

  /**
   * Resets all data for the user in Supabase (deletes rows across all tables)
   */
  async resetAllUserDataInSupabase(rawUserId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const userId = toValidUuid(rawUserId);

    try {
      await Promise.allSettled([
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('budget_limits').delete().eq('user_id', userId),
        supabase.from('recurring_bills').delete().eq('user_id', userId),
        supabase.from('installments').delete().eq('user_id', userId),
        supabase.from('debt_loans').delete().eq('user_id', userId),
        supabase.from('savings_goals').delete().eq('user_id', userId),
        supabase.from('payday_allocations').delete().eq('user_id', userId),
      ]);
    } catch (e) {
      console.warn('Supabase resetAllUserDataInSupabase error:', e);
    }
  }
}

export const supabaseDbService = new SupabaseDbService();
