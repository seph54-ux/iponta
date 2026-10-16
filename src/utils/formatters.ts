/**
 * Format numerical value with currency symbol (default ₱)
 */
export function formatPeso(amount: number | null | undefined, showDecimals: boolean = true, symbol: string = '₱'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`;
  }
  
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(amount).replace('PHP', symbol);
}

/**
 * Format date nicely (e.g., "Oct 15, 2026")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format relative date (e.g., "Today", "Yesterday", "In 3 days")
 */
export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(dateString);
}

/**
 * Calculate budget status color
 */
export function getBudgetProgressColor(percentage: number): {
  barClass: string;
  badgeClass: string;
  statusLabel: string;
} {
  if (percentage >= 100) {
    return {
      barClass: 'bg-rose-500 dark:bg-rose-600',
      badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      statusLabel: 'Over Budget',
    };
  }
  if (percentage >= 85) {
    return {
      barClass: 'bg-amber-500 dark:bg-amber-600',
      badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      statusLabel: 'Near Limit',
    };
  }
  return {
    barClass: 'bg-emerald-500 dark:bg-emerald-600',
    badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    statusLabel: 'On Track',
  };
}

/**
 * Parses user-chosen transaction date (YYYY-MM-DD) and optional time (HH:mm) into a Unix millisecond timestamp.
 * Defaults time to 00:00 if not provided.
 */
export function parseTransactionDateTime(date: string, time?: string): number {
  if (!date) return 0;
  const cleanDate = date.trim();
  const rawTime = (time && time.trim()) ? time.trim() : '00:00';
  const [hours = '00', minutes = '00'] = rawTime.split(':');
  const safeTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  const isoStr = `${cleanDate}T${safeTime}`;
  const timestamp = Date.parse(isoStr);
  if (!isNaN(timestamp)) {
    return timestamp;
  }
  const fallback = Date.parse(cleanDate);
  return isNaN(fallback) ? 0 : fallback;
}

/**
 * Sorts transactions strictly based on the transaction date & time chosen by the user.
 * 'desc' = latest transaction date & time shown at top (default).
 * 'asc' = earliest transaction date & time shown at top.
 */
export function sortTransactionsByDateTime<T extends { date: string; time?: string; createdAt?: string }>(
  transactions: T[],
  order: 'desc' | 'asc' = 'desc'
): T[] {
  return [...transactions].sort((a, b) => {
    const timeA = parseTransactionDateTime(a.date, a.time);
    const timeB = parseTransactionDateTime(b.date, b.time);
    if (timeA !== timeB) {
      return order === 'desc' ? timeB - timeA : timeA - timeB;
    }
    // Stable tie-break by record creation timestamp if chosen date and time match exactly
    const createdA = a.createdAt ? Date.parse(a.createdAt) : 0;
    const createdB = b.createdAt ? Date.parse(b.createdAt) : 0;
    return order === 'desc' ? createdB - createdA : createdA - createdB;
  });
}

