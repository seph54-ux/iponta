import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, Database, UserCheck, Scale, RefreshCw, X } from 'lucide-react';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#FAF8F5] dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Terms of Service & Privacy Policy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IponTa · Tara, Ipon Ta! Legal Disclaimers, Data Governance & User Protections • Effective October 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Prominent Disclaimer Callout */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                CRITICAL NOTICE: INFORMATIONAL FINANCIAL TRACKER DISCLAIMER
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                IponTa is purely an informational personal and household financial organizing web application. 
                <span className="font-bold"> It is NOT a bank, direct payment gateway, deposit repository, money transmitter, e-wallet, or registered financial institution.</span> IponTa does not hold, process, transfer, or safeguard real currency, fiat balances, deposits, or actual monetary assets.
              </p>
            </div>
          </div>

          {/* Section 1: Description of Service */}
          <section className="space-y-2 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Description of Service</span>
            </h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              IponTa is a Filipino-focused personal finance and budget tracking platform designed to help users take control of their money, monitor spending, achieve savings goals, and build better financial habits. The Service provides tools including, but not limited to:
            </p>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Account Balance Allocation:</strong> Manual tracking of stored funds across custom money accounts (e.g., RCBC, BPI, GCash, Maya, Cash, and credit lines like Atome).
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Income, Expense & Transfer Logging:</strong> Recording personal transactions with interactive arithmetic computation, categorical sorting, and account-to-account transfer calculations.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Payday Envelope Budgeting & Cutoff Cycles:</strong> Splitting anticipated net salaries between 15th/30th cutoffs, fixed bills, emergency savings, and discretionary envelopes.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Installments & Debt Monitoring:</strong> Tracking Buy-Now-Pay-Later (BNPL) obligations (e.g., Shopee SPayLater, TikTok PayLater, Atome) with accurate interest rate calculations and loan repayment schedules.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Shared Household Collaboration:</strong> Managing shared household living costs between family members or roommates while keeping personal transactions strictly private.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Automated Financial Health & Spending Analytics:</strong> Rule-based assessments of debt-to-income and emergency fund ratios, automated spending trend insights, and daily expense heatmap intensity tracking.
              </li>
            </ul>
          </section>

          {/* Section 2: Data Storage and Security */}
          <section className="space-y-2 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Data Storage and Security</span>
            </h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              Because your personal financial records represent sensitive information, IponTa implements modern cybersecurity practices and data governance architectures:
            </p>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Per-User Cryptographic Isolation:</strong> All data stored in our database backend is bound to your authenticated user account. Row Level Security (RLS) policies restrict query execution so no other user can access your personal transaction records, account balances, or financial logs.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Encrypted Transport & Storage:</strong> User authentication, session tokens, and data synchronizations are conducted strictly through encrypted HTTPS/TLS protocols. Passwords and credentials are managed through secure cryptographic hashing.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Zero Selling or Commercialization of Financial Data:</strong> We do not sell, rent, license, or monetize your transaction logs, merchant details, account balances, or salary numbers to advertising networks, credit agencies, or third-party marketing entities.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Immutable Security Audit Trail:</strong> The webapp maintains a per-user audit log tracking timestamped modifications, creations, and deletions of financial records for user verification and tamper detection.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Client-Side Computational Privacy:</strong> Spending trends, monthly budget comparisons, and heatmap analytics are evaluated algorithmically within your browser environment without transmitting raw behavioral dossiers.
              </li>
            </ul>
          </section>

          {/* Section 3: Your Rights */}
          <section className="space-y-2 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3. Your Rights</span>
            </h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              In accordance with ethical data privacy standards and applicable personal data protection laws, you retain comprehensive sovereignty over your financial data:
            </p>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Right to Portability & Export:</strong> You hold the unrestricted right to export your complete financial history at any time without fees in universal machine-readable formats (CSV, Excel spreadsheet, or comprehensive JSON database backup).
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Right to Erasure & Reset to Zero:</strong> You have the right to reset all accounts, transactions, installments, and logs to zero using the built-in "Reset Data" tool, or purge your account records entirely.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Right to Granular Household Privacy:</strong> You retain complete discretion over which expenses are visible to a household partner. Transactions remain private by default unless explicitly tagged with the Shared Household flag.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Right to Rectification:</strong> You may edit, categorize, or correct any financial log, balance, or user profile information directly through the application interface.
              </li>
            </ul>
          </section>

          {/* Section 4: Limitation of Liability */}
          <section className="space-y-2 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>4. Limitation of Liability</span>
            </h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              By using IponTa, you acknowledge and agree to the following liability limitations:
            </p>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Informational & Calculative Purposes Only:</strong> All calculations, payday split suggestions, financial health scores, and metrics are programmatic mathematical representations based on user inputs. They do NOT constitute licensed financial advisory, certified accounting, investment consulting, or official tax preparation services.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">User Responsibility for Data Accuracy:</strong> Users remain solely responsible for the correctness of inputted values, merchant names, custom category assignments, and account balances. IponTa assumes no liability for missed bill deadlines, bank overdraft fees, loan penalties, or incorrect user records.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Service Availability:</strong> The webapp is provided on an "as is" and "as available" basis. While we strive for 100% uptime, IponTa cannot be held liable for temporary service interruptions, network latency, or loss of unsaved offline inputs due to hardware or browser issues.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Cap on Direct Damages:</strong> Under no circumstances shall the creators, developers, or affiliates of IponTa be liable for any indirect, incidental, punitive, or consequential damages resulting from your reliance on the application.
              </li>
            </ul>
          </section>

          {/* Section 5: Changes to this Policy and Terms */}
          <section className="space-y-2 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>5. Changes to this Policy and Terms</span>
            </h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              As IponTa adds new features, improves security mechanisms, or responds to evolving regulatory requirements, these Terms of Service and Privacy Policies may be revised periodically.
            </p>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Notification of Revisions:</strong> When substantial modifications occur, the "Effective Date" at the top of this document will be updated, and notice will be presented within the application interface or upon your subsequent login.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Continued Use as Acceptance:</strong> Your continued access to and utilization of IponTa following the posting of amended terms constitutes your definitive acknowledgment and agreement to be bound by the updated policies.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Questions & Inquiries:</strong> If you have questions regarding the interpretation or scope of these terms, you may review the application documentation or contact our development team via the settings interface.
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            IponTa — Tara, Ipon Ta! · Philippine Personal & Household Financial Organizer
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};
