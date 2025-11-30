import { Column, DateKey, DateMeta, PERSIAN_CALENDAR_LOCALE } from './types';

export type MonthKey = string;

/**
 * Format date to YYYY-MM-DD in local timezone (not UTC)
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TODAY = new Date();
export const TODAY_KEY = formatDateLocal(TODAY);

// Current Persian month (based on "now"), used to know which month
// should stop counting at TODAY (skip future days).
export const currentMonthKey: MonthKey = TODAY.toLocaleDateString(
  PERSIAN_CALENDAR_LOCALE,
  { month: '2-digit' }
);

/**
 * Build metadata for each date:
 * - Sort by date string so dynamic data is always in order.
 * - Parse to Date (local) for formatting.
 * - Derive Persian calendar month key.
 */
export function buildDateMeta(dateStrings: DateKey[]): DateMeta[] {
  return dateStrings
    .slice()
    .sort()
    .map((label) => {
      const [yearStr, monthStr, dayStr] = label.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      const day = Number(dayStr);

      // Create date in local timezone (no UTC conversion needed for Persian calendar)
      const date = new Date(year, monthIndex, day);

      // Get Persian calendar month key (01-12)
      const faMonthKey = date.toLocaleDateString(PERSIAN_CALENDAR_LOCALE, {
        month: '2-digit',
      });

      return {
        label,
        date,
        monthKey: faMonthKey,
      };
    });
}

/**
 * Build columns: one column per day + a "month-total" column
 * at the end of each Persian month group.
 * Format: "آبان total" (month name in Persian + " total")
 *
 * Example: 26 آبان, 27 آبان, 28 آبان, [آبان total], 01 آذر, 02 آذر, [آذر total]
 */
export function buildColumns(dateMeta: DateMeta[]): Column[] {
  const cols: Column[] = [];

  if (dateMeta.length === 0) return cols;

  dateMeta.forEach((meta, index) => {
    // Add the date column
    cols.push({ kind: 'date', label: meta.label, date: meta.date });

    // Check if this is the last date of the current month
    const nextMeta = dateMeta[index + 1];
    const isEndOfMonth = !nextMeta || nextMeta.monthKey !== meta.monthKey;

    if (isEndOfMonth) {
      // Get Persian month name for the label
      const faMonthShort = meta.date.toLocaleDateString(
        PERSIAN_CALENDAR_LOCALE,
        { month: 'short' }
      );

      // Add month total column right after the last day of this month
      cols.push({
        kind: 'month-total',
        monthKey: meta.monthKey,
        label: `${faMonthShort} total`,
      });
    }
  });

  return cols;
}

/**
 * Calculate the total wins for a player in a given Persian month.
 * - Uses monthKey derived from Persian calendar.
 * - For the current month, skips dates strictly after TODAY_KEY
 *   (so future dates in the same month don't contribute).
 * - Uses date string comparison (YYYY-MM-DD) to avoid timezone issues.
 */
export function getMonthTotal(
  player: { wins: Record<DateKey, number> },
  monthKey: MonthKey,
  dateMeta: DateMeta[]
): number {
  return dateMeta.reduce((sum, meta) => {
    if (meta.monthKey !== monthKey) return sum;

    const isCurrentMonth = meta.monthKey === currentMonthKey;

    // If this date is in the future (within current month), ignore it.
    if (isCurrentMonth && meta.label > TODAY_KEY) {
      return sum;
    }

    return sum + (player.wins[meta.label] ?? 0);
  }, 0);
}
