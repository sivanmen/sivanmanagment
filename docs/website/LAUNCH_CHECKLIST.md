# Website Launch Checklist

Status legend: ✅ done · ⬜ open · 🟡 needs the owner

## Facts to verify (owner)
- 🟡 **Founder wording:** preferred title and grammatical gender for Sivan Menahem in Hebrew, Greek, French, German, Russian (`about.json` → `team.founderRole`, `team.founderBio`; currently neutral).
- 🟡 **Owner portal promise:** "Every owner gets access to our online owner portal" (home → control). Confirm this is offered to all owners.
- 🟡 **Assessment is "without obligation":** confirm. (We avoided saying "free".)
- 🟡 **Languages spoken:** FAQ says "English and Hebrew, with Greek and other languages through our team and partners."
- 🟡 **Office hours:** "Monday to Friday, 09:00–17:00 (Greece time)" on the contact page.
- 🟡 **Response time:** "usually within one business day."
- 🟡 **Coverage:** Chania areas listed (Akrotiri, Platanias, Kissamos, Apokoronas…); Rethymno/Heraklion "via local partners."
- 🟡 **Services scope:** each of the 7 service pages matches what is actually delivered (esp. hotel operations, commercial technical coordination, sales support with licensed agents).
- 🟡 **"Over 10 years" experience** — not used anywhere. Add only once verified and attributed (company vs. founder).
- 🟡 **Domain/email:** site `sivanmanagment.com`, email `support@sivanmanagment.com` (as supplied). Decide whether to also secure `sivanmanagement.com` and redirect it.

## Legal
- ✅ Accessibility statement (EN + HE + 6 languages) at `/legal/accessibility-statement/` — WCAG 2.1 AA / IS 5568 / EN 301 549.
- 🟡 **Accessibility coordinator name** — set `COMPANY.accessibility.name` in `apps/web/src/lib/company.ts` (currently shows "accessibility team" + contact details).
- ✅ Privacy policy extended (storage in Israel/JetServer, security, cookies, users in Israel / Protection of Privacy Law) in all 8 languages; Hebrew written for the Israeli public.
- ✅ Internal compliance documents (NOT in this public repo): Google Drive → "Sivan Management — Compliance (internal)": *Record of Processing Activities (GDPR Art. 30)* and *נוהל אבטחת מידע* (Israeli Data Security Regulations 2017). Review the [TO VERIFY] items and sign.
- ✅ G.E.MI. confirmed as 178525658000 by the owner (24 Nov 2026).
- ⬜ Privacy, Cookie and Terms pages reviewed by a Greek lawyer (currently marked "must be reviewed").
- ✅ Company information page: legal name, address, VAT/AFM EL802555027, G.E.MI. 178525658000 (confirmed 24 Nov 2026), Δ.Ο.Υ. Χανίων, phone, email.
- ✅ No IBAN/SWIFT published.
- ⬜ Short-term-rental article checked by the accountant (rules change; no figures are quoted).

## Media
- ✅ Real Chania drone video (home hero, Chania page), real Chania photos, owner's on-site photos, founder portrait — see MEDIA_LIBRARY.md.
- 🟡 **Official logo files** → upload `logo-on-light` and `logo-on-dark` (SVG preferred, else PNG ≥ 600 px wide, transparent) and place in `apps/web/public/brand/`. Only the SivanInvest logo was found in Drive.
- 🟡 Envato Elements licences registered for sivanmanagment.com (stock videos/photos).
- ⬜ Replace AI images with real photos from `~/Documents/SivanInvest/תמונות כריתים` (see CONTENT_SOURCES.md).
- ⬜ Founder portrait from `תמונות פורטרט סיון` → `/our-team/`.
- ⬜ Optional hero video from `וידאו כריתים`.
- ⬜ Owner-approved case studies for `/portfolio/`.

## Translations
- ✅ All 8 languages complete and structurally verified (`pnpm --filter web check:i18n`).
- ⬜ Native-speaker review per language (priority: HE, EL, DE, FR, RU, NL, ZH).
- ⬜ Spanish (recommended in the brief) — add `es` when ready.

## Technical
- ✅ 225 pages build; `astro check` 0 errors.
- ✅ hreflang + x-default, canonical, sitemap, robots, JSON-LD.
- ✅ RTL verified (Hebrew), mobile verified (iPhone 13 viewport).
- ✅ Lead endpoint (PHP 8.3): validation, honeypot, timing trap, rate limit, origin check; end-to-end form test passed (Hebrew).
- ⬜ Go-live on cPanel: back up + move WordPress aside, upload & extract the ZIP (DEPLOYMENT.md §2).
- ⬜ FTP account + GitHub secrets for auto-deploy (DEPLOYMENT.md §3).
- ⬜ Real test submission on the live site → e-mail arrives at support@sivanmanagment.com (check spam; add SPF/DKIM in cPanel → Email Deliverability if needed).
- ⬜ Optional: Airtable leads base or n8n webhook in `~/sivanmanagment-config.php`.
- ⬜ Lighthouse run on production (target ≥ 90 performance/accessibility/SEO).
- ⬜ Google Search Console + Bing; Google Business Profile with the same NAP.
- ⬜ Keyword volumes per language (Ahrefs/Similarweb connectors need authorisation).
- ⬜ Analytics (only after consent; the banner already emits `sm:consent`).

## Security housekeeping
- ⬜ **Change the WordPress admin password** — it was shared in a chat. Revoke the WordPress application password created for Claude when no longer needed.
- ⬜ Pre-existing: `apps/admin/src/pages/SystemSettingsPage.tsx` hard-codes the company IBAN/BIC as defaults in a public repo (see OPEN_ISSUES).
