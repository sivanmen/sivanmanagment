import en from './locales/en.json';
import he from './locales/he.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ru from './locales/ru.json';

export const locales = {
  en,
  he,
  es,
  fr,
  de,
  ru,
} as const;

export type SupportedLocale = keyof typeof locales;

export const supportedLanguages: SupportedLocale[] = ['en', 'he', 'es', 'fr', 'de', 'ru'];

export const defaultLocale: SupportedLocale = 'en';

export type TranslationKeys = keyof typeof en;

/**
 * Get translations for a specific locale.
 * Falls back to English if the locale is not supported.
 */
export function getTranslations(locale: string): typeof en {
  if (locale in locales) {
    return locales[locale as SupportedLocale];
  }
  return locales[defaultLocale];
}

/**
 * Get a specific translation key for a locale.
 * Supports dot-notation for nested keys (e.g., 'nav.dashboard').
 */
export function t(locale: string, key: string): string {
  const translations = getTranslations(locale);
  const keys = key.split('.');

  let result: unknown = translations;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key; // Return the key itself as fallback
    }
  }

  return typeof result === 'string' ? result : key;
}

export { en, he, es, fr, de, ru };
