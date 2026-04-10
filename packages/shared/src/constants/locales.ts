export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  dateFormat: string;
  timeFormat: string;
  currency: string;
}

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currency: 'USD',
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: '\u05E2\u05D1\u05E8\u05D9\u05EA',
    rtl: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'ILS',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Espa\u00F1ol',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Fran\u00E7ais',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
  },
};

export const DEFAULT_LOCALE = 'en';

export const RTL_LOCALES = Object.values(SUPPORTED_LOCALES)
  .filter((locale) => locale.rtl)
  .map((locale) => locale.code);

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

export function getLocaleConfig(locale: string): LocaleConfig {
  return SUPPORTED_LOCALES[locale] ?? SUPPORTED_LOCALES[DEFAULT_LOCALE];
}
