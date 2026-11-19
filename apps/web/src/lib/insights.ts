import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LOCALE, isLocale, type Locale } from '~/i18n/config';

export type Insight = CollectionEntry<'insights'>;

/** Locale folder and slug from an entry id like "he/my-article". */
export function parseId(entry: Insight): { locale: Locale; slug: string } {
  const [maybeLocale, ...rest] = entry.id.split('/');
  if (isLocale(maybeLocale) && rest.length) return { locale: maybeLocale, slug: rest.join('/') };
  return { locale: DEFAULT_LOCALE, slug: entry.id };
}

export async function allInsights(): Promise<Insight[]> {
  const items = await getCollection('insights', ({ data }) => import.meta.env.DEV || !data.draft);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function insightsFor(locale: Locale): Promise<Insight[]> {
  return (await allInsights()).filter((e) => parseId(e).locale === locale);
}

/** All language versions of one article, keyed by locale. */
export async function translationsOf(key: string): Promise<Partial<Record<Locale, Insight>>> {
  const out: Partial<Record<Locale, Insight>> = {};
  for (const e of await allInsights()) if (e.data.translationKey === key) out[parseId(e).locale] = e;
  return out;
}

/** Effective cover: an uploaded image path wins over the built-in image key. */
export function coverOf(entry: Insight): string {
  return entry.data.coverUpload || entry.data.cover;
}

export function readingMinutes(body: string | undefined): number {
  const text = (body ?? '').replace(/[#*_>`\-\[\]\(\)]/g, ' ');
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 220 + cjk / 450));
}

export function formatDate(d: Date, locale: Locale): string {
  const tag = locale === 'zh-cn' ? 'zh-CN' : locale;
  return new Intl.DateTimeFormat(tag, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}
