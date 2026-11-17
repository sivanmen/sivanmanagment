# Website — Key Decisions

## D1. Clean code (Astro) instead of WordPress — 16 Nov 2026

The owner asked for a judgement call between keeping WordPress and building in clean code.

**Audit of the live WordPress site** (public, read-only — no admin changes were made):
- Theme `numerique` (VamTam Numérique) + Elementor / Elementor Pro, `pojo-accessibility`, FlyingPress cache.
- Content was still 100% **template demo** (a digital-marketing agency: "Revenue driven for our clients 2,120,240,368", Getty/Pexels demo photos, fake testimonials). Nothing reusable except the visual language.
- No multilingual plugin, no SEO plugin output for property management.

**Decision: Astro static site inside this monorepo (`apps/web`).**

| Need | WordPress + Elementor + WPML | Astro (chosen) |
|---|---|---|
| 8 languages, RTL, hreflang | WPML licence, per-page Elementor duplication, fragile RTL | Built-in: one template × 8 dictionaries, verified by a script |
| Premium motion / layered UI | Possible but heavy JS, plugin conflicts | Hand-built, ~4 KB JS, respects reduced-motion |
| Speed / Core Web Vitals | Theme + Elementor + plugins | Static HTML, responsive WebP, self-hosted fonts |
| Security / maintenance | Plugin updates, admin attack surface | No database, no PHP; one small server route |
| Articles by the owner | WP editor ✅ | Sveltia CMS at `/admin/` (8 languages side by side) ✅ |
| Same brand as PMS/owner portal | Separate stack | Same repo, same domain, links to `client.sivanmanagment.com` |

**Why Astro is allowed here:** `docs/PROJECT_RULES.md` locks the PMS stack (React/Vite/Express)
and says not to add frameworks *without approval*. The owner explicitly delegated this choice
("לשיקולך"). The website is a separate deployable (`apps/web`); the three PMS services are untouched.
Astro was pinned to the mature 5.x line (5.18.2) rather than the newest major.

**WordPress afterwards:** keep it running until DNS is switched, then export anything needed and
retire it (or keep it on a sub-domain). Change the WP admin password — it was shared in chat.

## D2. English-first copy, then professional-grade translation
English copy was written first from the brief + competitor research, then translated to 7
languages in parallel, with explicit rules: preserve every caveat, add no claims, localise SEO
phrases, internal links get the locale prefix. A native speaker should still review each
language before launch (see LAUNCH_CHECKLIST).

## D3. Honesty constraints shape the design
- **Dashboard** on the home/about pages is labelled "Illustrative interface" and shows masked values (€ ••,•••), never numbers.
- **Team** page = founder + departments; no invented Greek staff (the brief's mock names are *not* used).
- **Portfolio** = property types + a policy statement until real, approved case studies exist.
- **Images**: AI images are flagged in `src/lib/images.ts` (`illustrative: true`) and disclosed on `/legal/image-credits/`.
- **Founder gender**: not stated anywhere, so copy uses neutral forms in gendered languages (HE/EL/FR/DE/RU). Confirm preferred forms and update `about.json` → `team.founderRole/founderBio`.

## D4. Services: seven, including "Property Marketing & Sales Support"
The owner listed marketing *and sale* among the services. Greek sales transactions require
licensed agents, so the page is framed as preparation, marketing and coordination, working
alongside licensed agents and lawyers. Asset Management is framed as operational
representation — explicitly *not* regulated investment advice.

## D5. Leads go to Airtable/webhook from a server route
The form posts to `/api/lead/` (same origin). Tokens live in server env vars only. If neither
Airtable nor a webhook is configured the endpoint returns 503 — the form then shows the direct
contact options. See DEPLOYMENT.md.

## D6. No IBAN on the website
The owner supplied bank details. They are **not** published (the PMS already treats a public
IBAN endpoint as a P0 security issue — see `docs/OPEN_ISSUES.md`). The legally required business
identity (name, address, VAT/AFM, G.E.MI., tax office) is shown in the footer and on
`/legal/company-information/`.
