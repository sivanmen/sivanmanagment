// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical production origin. Override with SITE_URL once the final
// domain decision (sivanmanagment.com vs sivanmanagement.com) is made.
const SITE = process.env.SITE_URL || 'https://sivanmanagment.com';

const LOCALES = ['en', 'he', 'el', 'fr', 'de', 'nl', 'ru', 'zh-cn'];

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  // Fully static HTML. The lead form posts to public/api/lead/index.php (PHP on the cPanel host).
  output: 'static',
  build: { format: 'directory' },
  image: { responsiveStyles: true },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thank-you/') && !page.includes('/admin/'),
      i18n: {
        defaultLocale: 'en',
        locales: Object.fromEntries(
          LOCALES.map((l) => [l, l === 'zh-cn' ? 'zh-CN' : l]),
        ),
      },
    }),
  ],
  server: { host: true },
});
