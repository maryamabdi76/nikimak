/**
 * Formats a date for display in the current locale
 * Automatically converts UTC dates to local timezone
 *
 * @param date - The date to format (can be Date object or ISO string)
 * @param locale - The locale for formatting
 * @param options - Formatting options
 * @returns Formatted date string in local timezone
 */
export const formatDate = (
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  let dateObj: Date;

  if (typeof date === 'string') {
    // If the string doesn't end with 'Z' or timezone info, treat it as UTC
    const dateString =
      date.endsWith('Z') || date.includes('+') || date.includes('-', 10)
        ? date
        : date + 'Z';
    dateObj = new Date(dateString);
  } else {
    dateObj = date;
  }

  // Ensure the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return String(date);
  }

  // Add timezone option to ensure local timezone display
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...options,
  };

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
};

/**
 * Checks if a string value is a valid ISO datetime string
 *
 * @param value - The string value to check
 * @returns True if the value is a valid ISO datetime string
 */
export const isISODateTime = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;

  // Check for ISO 8601 format (e.g., "2025-09-14T11:00:00.000Z")
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!isoRegex.test(value)) return false;

  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Formats a datetime string for display in Persian locale
 *
 * @param dateTimeString - The datetime string to format
 * @param options - Formatting options
 * @returns Formatted datetime string or original value if invalid
 */
export const formatDateTimeForDisplay = (
  dateTimeString: string,
  locale: string,
  options: {
    includeTime?: boolean;
    includeDate?: boolean;
    timeFormat?: '12h' | '24h';
  } = {}
): string => {
  const { includeTime = true, timeFormat = '24h' } = options;

  if (!isISODateTime(dateTimeString)) {
    return dateTimeString;
  }

  try {
    const date = new Date(dateTimeString);

    if (isNaN(date.getTime())) {
      return dateTimeString;
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    if (includeTime) {
      formatOptions.hour = 'numeric';
      formatOptions.minute = 'numeric';

      if (timeFormat === '12h') {
        formatOptions.hour12 = true;
      }
    }

    return formatDate(date, locale, formatOptions);
  } catch (error) {
    console.warn('Failed to format datetime:', dateTimeString, error);
    return dateTimeString;
  }
};
