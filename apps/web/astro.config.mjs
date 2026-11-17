// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Canonical production origin. Override with SITE_URL once the final
// domain decision (sivanmanagment.com vs sivanmanagement.com) is made.
const SITE = process.env.SITE_URL || 'https://sivanmanagment.com';

const LOCALES = ['en', 'he', 'el', 'fr', 'de', 'nl', 'ru', 'zh-cn'];

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  // Pages are pre-rendered (static HTML). Only /api/* routes run on the server.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
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
