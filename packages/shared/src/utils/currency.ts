import { getCurrencyConfig } from '../constants/currencies';

/**
 * Formats a numeric amount as a currency string.
 *
 * @param amount - The numeric amount to format
 * @param currency - The 3-letter currency code (e.g., 'EUR', 'USD', 'ILS')
 * @param locale - The locale to use for formatting (e.g., 'en', 'he', 'de')
 * @returns The formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: getCurrencyConfig(currency).decimalPlaces,
      maximumFractionDigits: getCurrencyConfig(currency).decimalPlaces,
    }).format(amount);
  } catch {
    // Fallback if Intl is not available or currency code is invalid
    const config = getCurrencyConfig(currency);
    const formattedNumber = amount.toFixed(config.decimalPlaces);
    return config.symbolPosition === 'before'
      ? `${config.symbol}${formattedNumber}`
      : `${formattedNumber} ${config.symbol}`;
  }
}

/**
 * Parses a currency string back to a number.
 *
 * @param value - The currency string to parse
 * @returns The numeric value, or NaN if parsing fails
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned);
}

/**
 * Converts an amount from cents/minor units to the major unit.
 */
export function fromMinorUnits(amount: number, currency: string): number {
  const config = getCurrencyConfig(currency);
  return amount / Math.pow(10, config.decimalPlaces);
}

/**
 * Converts an amount to cents/minor units.
 */
export function toMinorUnits(amount: number, currency: string): number {
  const config = getCurrencyConfig(currency);
  return Math.round(amount * Math.pow(10, config.decimalPlaces));
}
