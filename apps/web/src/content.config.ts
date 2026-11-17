import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Insights (articles). Files live in src/content/insights/<locale>/<slug>.md
 * and are edited by hand or through the CMS at /admin/ (see docs/website/CMS_GUIDE.md).
 * The same `translationKey` links the language versions of one article.
 */
const insights = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/insights' }),
  schema: z.object({
    title: z.string().min(5).max(140),
    description: z.string().min(20).max(300),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(['guides', 'rentals', 'maintenance', 'market', 'news']).default('guides'),
    /** Either a key from src/lib/images.ts (e.g. "villa-pool") or an uploaded path ("/uploads/x.jpg"). */
    cover: z.string().default('hero-coast'),
    /** Set by the CMS image widget; takes precedence over `cover`. */
    coverUpload: z.string().optional().nullable(),
    coverAlt: z.string().optional(),
    author: z.string().default('Sivan Management'),
    translationKey: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { insights };
