export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '\u20AC',
    decimalPlaces: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'after',
  },
  ILS: {
    code: 'ILS',
    name: 'Israeli New Shekel',
    symbol: '\u20AA',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
  },
};

export const DEFAULT_CURRENCY = 'EUR';

export function getCurrencyConfig(code: string): CurrencyConfig {
  return SUPPORTED_CURRENCIES[code] ?? SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}
