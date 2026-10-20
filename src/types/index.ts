export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  subcategory?: string;
  paymentMethod: string; // Refers to FinancialAccount name or id (From Account for Transfers)
  toAccount?: string; // Destination Account for Transfers
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  receiptItems?: Array<{ description: string; quantity?: number; price: number }>;
  isShared?: boolean; // For Household budget
  sharedSplitRatio?: number; // e.g. 0.5 for 50/50 split
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'BANK' | 'E_WALLET' | 'CASH' | 'CREDIT_CARD' | 'BNPL';

export interface FinancialAccount {
  id: string;
  userId: string;
  name: string; // e.g. "RCBC", "GCash", "Maya", "BPI", "BDO", "Atome Credit", "Cash"
  type: AccountType;
  balance: number; // Current balance or liquid funds stored
  creditLimit?: number; // For Credit Cards or BNPL
  colorHex?: string;
  accountNumberMasked?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  iconName: string;
  colorHex: string;
  subcategories: string[];
  isCustom?: boolean;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'E_WALLET' | 'BANK' | 'CASH' | 'CREDIT_CARD' | 'BNPL';
  accountNumberMasked?: string;
  isCustom?: boolean;
}

export type BudgetCycleType = 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY' | 'CUSTOM';

export interface BudgetCycle {
  id: string; // cycle_id
  userId: string; // user_id
  name: string; // cycle_name, e.g. "Oct 1 - Oct 15 Cutoff", "Oct 16 - Oct 31 Cutoff", "October 2026 Monthly"
  cycleType: BudgetCycleType; // cycle_type
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  incomeAmount?: number; // expected/actual income for this cutoff/period
  cutoffDay1?: number; // e.g. 15
  cutoffDay2?: number; // e.g. 30 or 31
  customIntervalDays?: number; // e.g. 14, 21
  isActive?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetLimit {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  period: 'MONTHLY' | 'WEEKLY' | 'CYCLE';
  limitAmount: number;
  month?: string; // Format: 'YYYY-MM' (e.g. '2026-10')
  cycleId?: string; // Links to BudgetCycle.id
  iconName?: string;
  colorHex?: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string; // e.g. "Emergency Fund", "Paluwagan / Travel"
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyTargetContribution: number;
  iconName?: string;
  colorHex?: string;
}

export interface RecurringBill {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDateDay: number; // Day of month (1-31)
  category: string;
  paymentMethod: string;
  autoRemind: boolean;
  isPaidThisMonth: boolean;
  notes?: string;
}

export interface Installment {
  id: string;
  userId: string;
  merchantName: string; // e.g., "Shopee SPayLater", "TikTok PayLater", "Atome Credit", "Atome Cash Loan", "GLoan / GCash"
  itemName: string;
  totalAmount: number; // Principal / Cash Price financed
  monthlyPayment: number;
  totalMonths: number;
  paidMonths: number;
  startDate: string;
  paymentMethod: string;
  category: string;
  interestRatePercent?: number; // Optional interest rate (e.g. 2.95 for 2.95%)
  interestRateType?: 'MONTHLY' | 'ANNUAL'; // Defaults to 'MONTHLY'
  interestCalculationType?: 'ADD_ON' | 'AMORTIZED'; // Defaults to 'ADD_ON'
  totalInterestAmount?: number; // Total interest over life of installment
  totalPayableAmount?: number; // Principal + Total Interest
  notes?: string;
}

export interface DebtLoan {
  id: string;
  userId: string;
  partyName: string;
  type: 'I_OWE' | 'OWED_TO_ME';
  originalAmount: number;
  remainingAmount: number;
  monthlyAmortization?: number;
  dueDate?: string;
  interestRatePercent?: number;
  notes?: string;
}

export interface PaydayAllocation {
  id: string;
  userId: string;
  paydayDate: string;
  netPay: number;
  fixedBillsAmount: number;
  savingsAmount: number;
  foodAmount: number;
  transportAmount: number;
  discretionaryAmount: number;
  notes?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email?: string;
  role: 'PRIMARY' | 'PARTNER' | 'ROOMMATE';
  incomeContributionRatio?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'EXPORTS';
  entityType: 'TRANSACTION' | 'BUDGET' | 'SAVINGS' | 'BILL' | 'INSTALLMENT' | 'DEBT' | 'PAYDAY' | 'ACCOUNT';
  entityId: string;
  summary: string;
  previousValue?: string;
  newValue?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  hasAcceptedTerms: boolean;
  termsAcceptedDate?: string;
  householdName?: string;
  isDarkMode: boolean;
  currencySymbol: string;
  createdAt: string;
  isNewSignup?: boolean;
  isExistingUser?: boolean;
}

export interface HealthCheckResult {
  id: string;
  title: string;
  score: number;
  status: 'HEALTHY' | 'WARNING' | 'ALERT';
  message: string;
  details: string;
  recommendation: string;
  metricLabel: string;
  metricValue: string;
}

export interface ReceiptScanResult {
  merchant: string;
  date: string;
  amount: number;
  taxAmount?: number;
  category: string;
  paymentMethod?: string;
  items?: Array<{ description: string; quantity?: number; price: number }>;
  confidenceNote?: string;
}
