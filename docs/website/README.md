# Sivan Management — Public Website (`apps/web`)

> The multilingual marketing website for **sivanmanagment.com**, replacing the
> VamTam/Elementor WordPress template. Built 16 Nov 2026.
> Read this file first; the other files in `docs/website/` go deeper.

| Document | What it covers |
|---|---|
| [`MASTER_BRIEF.md`](MASTER_BRIEF.md) | The original strategy & content brief (owner + ChatGPT), kept as reference |
| [`DECISIONS.md`](DECISIONS.md) | Why clean code (Astro) instead of WordPress, and other key decisions |
| [`COMPETITOR_RESEARCH.md`](COMPETITOR_RESEARCH.md) | What competitors do, what we adopted, how we differentiate |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Colours, type, motion, components — derived from the VamTam template |
| [`CONTENT_SOURCES.md`](CONTENT_SOURCES.md) | Where images/videos come from (Mac folders, Openverse, Figma AI), licence rules |
| [`CMS_GUIDE.md`](CMS_GUIDE.md) | How to write and translate articles in the Content Studio (`/admin/`) — Hebrew + English |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Railway service, environment variables, DNS, Airtable/n8n lead delivery |
| [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) | Everything marked **[TO VERIFY]** before going live |

## At a glance

- **Stack:** Astro 5 (static pages) + `@astrojs/node` for one server route (`/api/lead/`). No client framework; ~4 KB of vanilla JS for motion.
- **Languages (8):** English (default, `/`), Hebrew `/he/` (RTL), Greek `/el/`, French `/fr/`, German `/de/`, Dutch `/nl/`, Russian `/ru/`, Simplified Chinese `/zh-cn/`. Spanish is prepared for (see `src/i18n/config.ts`).
- **Pages per language (28):** Home · About · Our Team · Portfolio · Services + 7 service pages · Locations + Chania/Rethymno/Heraklion · Insights + articles · FAQ · Contact (4-step assessment form) · Thank-you · 5 legal pages. **225 HTML pages** in total.
- **SEO:** per-page titles/descriptions in every language, canonical + `hreflang` (+ `x-default`), XML sitemap with alternates, JSON-LD (LocalBusiness, Service, FAQPage, BreadcrumbList, Article), `robots.txt`.
- **Content Studio:** `/admin/` (Sveltia CMS, Git-based) for articles in all 8 languages.
- **Leads:** `/api/lead/` → Airtable and/or webhook (n8n). Validation, honeypot, timing trap, rate limit, origin check. No secrets in the browser.
- **Privacy:** fonts self-hosted (no Google Fonts requests — relevant for GDPR in Germany), consent banner, no trackers by default.

## Commands

```bash
pnpm install                      # from the repo root
pnpm dev:web                      # http://localhost:4321
pnpm build:web                    # → apps/web/dist (client/ + server/)
pnpm --filter web typecheck       # astro check (0 errors expected)
pnpm --filter web check:i18n      # every locale complete & structurally identical to English
node apps/web/dist/server/entry.mjs   # run the production build (PORT, HOST env)
```

## Where things live

```
apps/web/
├── astro.config.mjs            # site URL, sitemap + i18n, node adapter
├── public/
│   ├── admin/                  # Content Studio (index.html + config.yml)
│   ├── uploads/                # images uploaded through the CMS
│   ├── favicon.svg, og-default.jpg, robots.txt
├── scripts/check-i18n.mjs
└── src/
    ├── i18n/
    │   ├── config.ts           # locales, RTL, URL helpers
    │   ├── index.ts            # getDict(locale) with English fallback
    │   └── locales/<lang>/     # common, home, services, about, locations, faq, contact, legal, insights (.json)
    ├── content/insights/<lang>/*.md   # articles (one folder per language)
    ├── content.config.ts       # article schema
    ├── lib/company.ts          # ✅ verified company facts (single source of truth)
    ├── lib/images.ts           # image registry, AI/real flag, credits
    ├── lib/motion.ts           # reveal / split / parallax / progress / tilt
    ├── components/             # Header, Footer, Hero, ProcessTimeline, Dashboard, CreteMap, AssessmentForm…
    ├── layouts/BaseLayout.astro
    ├── pages/[...lang]/…       # every page, generated for all locales
    ├── pages/api/lead.ts       # lead endpoint (server)
    └── styles/global.css       # design tokens & primitives
```

## Editing copy

All page copy is in `src/i18n/locales/<lang>/*.json`. **English is the master.**
When you change English, update the other 7 files (same keys, same array lengths), then run
`pnpm --filter web check:i18n`. Missing keys fall back to English at build time, so the site
never breaks — but the checker tells you what still needs translating.

Company facts (address, phone, VAT, G.E.MI.) live **only** in `src/lib/company.ts`.

## Reliability rules (from the brief — enforced in copy)

No invented clients, staff, properties, reviews, awards, figures or years of experience. No
guaranteed income/occupancy. AI imagery is illustrative only and disclosed on the Image Credits
page. Team page shows departments, not invented people. The portfolio shows property *types*
until owners approve real case studies. Bank details (IBAN/SWIFT) are deliberately **not** published.
