import { DEFAULT_LOCALE, LOCALES, type Locale } from './config';
import type enCommon from './locales/en/common.json';
import type enHome from './locales/en/home.json';
import type enServices from './locales/en/services.json';
import type enAbout from './locales/en/about.json';
import type enLocations from './locales/en/locations.json';
import type enFaq from './locales/en/faq.json';
import type enContact from './locales/en/contact.json';
import type enLegal from './locales/en/legal.json';
import type enInsights from './locales/en/insights.json';

export interface Dict {
  common: typeof enCommon;
  home: typeof enHome;
  services: typeof enServices;
  about: typeof enAbout;
  locations: typeof enLocations;
  faq: typeof enFaq;
  contact: typeof enContact;
  legal: typeof enLegal;
  insights: typeof enInsights;
}

const NAMESPACES = ['common', 'home', 'services', 'about', 'locations', 'faq', 'contact', 'legal', 'insights'] as const;

const files = import.meta.glob<{ default: unknown }>('./locales/*/*.json', { eager: true });

function raw(locale: Locale, ns: string): unknown {
  return files[`./locales/${locale}/${ns}.json`]?.default;
}

/** Deep-merge `over` onto `base`; arrays and primitives in `over` replace `base` when shape-compatible. */
function merge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base)) return (Array.isArray(over) && over.length === base.length ? over : base) as T;
  if (typeof base === 'object' && base !== null) {
    if (typeof over !== 'object' || Array.isArray(over)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(out)) out[k] = merge(out[k], (over as Record<string, unknown>)[k]);
    return out as T;
  }
  return (typeof over === typeof base ? over : base) as T;
}

const cache = new Map<Locale, Dict>();

/**
 * Dictionary for a locale. Missing keys (or a missing locale) fall back to English,
 * so an incomplete translation never breaks the build — check with `pnpm check:i18n`.
 */
export function getDict(locale: Locale): Dict {
  const hit = cache.get(locale);
  if (hit) return hit;
  const dict = {} as Record<string, unknown>;
  for (const ns of NAMESPACES) {
    const en = raw(DEFAULT_LOCALE, ns);
    dict[ns] = locale === DEFAULT_LOCALE ? en : merge(en, raw(locale, ns));
  }
  cache.set(locale, dict as unknown as Dict);
  return dict as unknown as Dict;
}

/** True if a real translation file exists for this locale + namespace. */
export function hasTranslation(locale: Locale, ns: (typeof NAMESPACES)[number]): boolean {
  return raw(locale, ns) !== undefined;
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export { LOCALES, DEFAULT_LOCALE };
export type { Locale };
