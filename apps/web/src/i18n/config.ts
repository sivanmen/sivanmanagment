/**
 * Locale registry for the public website.
 * English is the default and lives at the site root ("/").
 * Every other locale lives under its own prefix ("/he/", "/el/" …).
 *
 * To add a language (e.g. Spanish, recommended in the brief):
 *   1. add an entry below,
 *   2. copy src/i18n/locales/en → src/i18n/locales/es and translate,
 *   3. add the code to LOCALES in astro.config.mjs and to public/admin/config.yml.
 */
export const LOCALES = ['en', 'he', 'el', 'fr', 'de', 'nl', 'ru', 'zh-cn'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

interface LocaleMeta {
  /** Native name shown in the language switcher */
  label: string;
  /** BCP-47 tag for <html lang> and hreflang */
  hreflang: string;
  /** Open Graph locale */
  og: string;
  dir: 'ltr' | 'rtl';
  /** Short code shown in the compact switcher */
  short: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { label: 'English', hreflang: 'en', og: 'en_GB', dir: 'ltr', short: 'EN' },
  he: { label: 'עברית', hreflang: 'he', og: 'he_IL', dir: 'rtl', short: 'HE' },
  el: { label: 'Ελληνικά', hreflang: 'el', og: 'el_GR', dir: 'ltr', short: 'EL' },
  fr: { label: 'Français', hreflang: 'fr', og: 'fr_FR', dir: 'ltr', short: 'FR' },
  de: { label: 'Deutsch', hreflang: 'de', og: 'de_DE', dir: 'ltr', short: 'DE' },
  nl: { label: 'Nederlands', hreflang: 'nl', og: 'nl_NL', dir: 'ltr', short: 'NL' },
  ru: { label: 'Русский', hreflang: 'ru', og: 'ru_RU', dir: 'ltr', short: 'RU' },
  'zh-cn': { label: '简体中文', hreflang: 'zh-CN', og: 'zh_CN', dir: 'ltr', short: '中文' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Value of the `[...lang]` route param for a locale (undefined = root). */
export function langParam(locale: Locale): string | undefined {
  return locale === DEFAULT_LOCALE ? undefined : locale;
}

/** getStaticPaths helper: one path per locale. */
export function localePaths() {
  return LOCALES.map((locale) => ({ params: { lang: langParam(locale) }, props: { locale } }));
}

/** Build a locale-prefixed, trailing-slash path. `path` is the English path, e.g. "/services/". */
export function localizePath(path: string, locale: Locale): string {
  const clean = '/' + path.replace(/^\/+/, '');
  const withSlash = clean.endsWith('/') ? clean : clean + '/';
  if (locale === DEFAULT_LOCALE) return withSlash;
  return withSlash === '/' ? `/${locale}/` : `/${locale}${withSlash}`;
}

/** Strip the locale prefix from a pathname, returning the English path. */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && isLocale(parts[0]) && parts[0] !== DEFAULT_LOCALE) parts.shift();
  return '/' + parts.join('/') + (parts.length ? '/' : '');
}
