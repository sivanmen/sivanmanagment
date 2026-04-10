/**
 * Formats a date string or Date object to a locale-aware date string.
 *
 * @param date - The date to format (ISO string or Date object)
 * @param locale - The locale to use (e.g., 'en', 'he', 'de')
 * @param options - Optional Intl.DateTimeFormatOptions overrides
 * @returns The formatted date string
 */
export function formatDate(
  date: string | Date,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Formats a date string or Date object to a locale-aware date and time string.
 *
 * @param date - The date to format (ISO string or Date object)
 * @param locale - The locale to use (e.g., 'en', 'he', 'de')
 * @param options - Optional Intl.DateTimeFormatOptions overrides
 * @returns The formatted date and time string
 */
export function formatDateTime(
  date: string | Date,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Returns a human-readable relative time string (e.g., "2 hours ago", "in 3 days").
 *
 * @param date - The date to compare against now
 * @param locale - The locale to use for formatting
 * @returns A relative time string
 */
export function getRelativeTime(
  date: string | Date,
  locale: string = 'en',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, 'second');
    } else if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffWeeks) < 4) {
      return rtf.format(diffWeeks, 'week');
    } else if (Math.abs(diffMonths) < 12) {
      return rtf.format(diffMonths, 'month');
    } else {
      return rtf.format(diffYears, 'year');
    }
  } catch {
    // Fallback for environments without Intl.RelativeTimeFormat
    const absDays = Math.abs(diffDays);
    const suffix = diffMs < 0 ? 'ago' : 'from now';
    if (absDays === 0) return 'today';
    if (absDays === 1) return diffMs < 0 ? 'yesterday' : 'tomorrow';
    if (absDays < 7) return `${absDays} days ${suffix}`;
    if (absDays < 30) return `${Math.round(absDays / 7)} weeks ${suffix}`;
    if (absDays < 365) return `${Math.round(absDays / 30)} months ${suffix}`;
    return `${Math.round(absDays / 365)} years ${suffix}`;
  }
}

/**
 * Calculates the number of nights between two dates.
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Checks if a date falls within a range (inclusive).
 */
export function isDateInRange(
  date: string | Date,
  rangeStart: string | Date,
  rangeEnd: string | Date,
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const start = typeof rangeStart === 'string' ? new Date(rangeStart) : rangeStart;
  const end = typeof rangeEnd === 'string' ? new Date(rangeEnd) : rangeEnd;
  return d >= start && d <= end;
}
