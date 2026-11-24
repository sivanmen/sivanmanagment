# Open Issues — Sivan Management PMS

> Active issues. Remove when fixed (and log in FIX_LOG.md).
> Sorted by severity: CRITICAL > HIGH > MEDIUM > LOW.

---

## CRITICAL

### ~~1. `start` script uses `prisma db push --accept-data-loss`~~ — RESOLVED 2026-04-14
### ~~2. Booking Engine module is 100% mock~~ — RESOLVED 2026-04-14
### ~~3. Pricing module is 100% mock~~ — RESOLVED 2026-04-14

_(No remaining CRITICAL issues. P0 security batch resolved 2026-05-25 — see FIX_LOG.)_

---

## P0 SECURITY (resolved 2026-05-25)
### ~~Public `/payments/company-info` leaking tax ID + IBAN~~ — RESOLVED
### ~~Hardcoded dev-default JWT_SECRET / ENCRYPTION_KEY fallbacks in code~~ — RESOLVED (fail-fast in prod)
### ~~Stripe webhook handler did not refuse on missing signing secret~~ — RESOLVED (503 + log)
### ~~Mock pages indistinguishable from real ones~~ — RESOLVED (PreviewBanner on 16 routes)

---

## HIGH

### ~~4. WhatsApp service is mock~~ — RESOLVED 2026-04-14

### ~~5. File upload service stub~~ — RESOLVED 2026-05-25
*Hardened upload service with isConfigured guard + ping + graceful degradation. Requires R2_* env vars in Railway to enable.*

### ~~6. AI service is mock~~ — RESOLVED 2026-05-25
*Wired Anthropic SDK via lib/ai.service.ts. ai.service.ts rewritten to use AiConversation Prisma model. Requires ANTHROPIC_API_KEY in Railway to enable.*

### ~~7. Users module is mock~~ — RESOLVED 2026-05-25
*Rewrote users.service.ts with real Prisma CRUD. 0 → 21 Prisma calls. See FIX_LOG.*

### ~~8. No automated tests~~ — PARTIALLY RESOLVED 2026-05-25
*Vitest + supertest installed; 8 smoke tests passing (encryption + config load). Integration tests against test Postgres remain as follow-up work.*

---

## MEDIUM

### ~~9. Company info endpoint is public — exposes tax/IBAN~~ — RESOLVED 2026-05-25
*Promoted to P0 during audit. Endpoint now requires authMiddleware. See FIX_LOG.*

### 10. Accounting module is mock
- **File:** `apps/api/src/modules/accounting/accounting.service.ts`

### ~~11. Audit module is mock~~ — RESOLVED 2026-05-25
*Rewrote audit.service.ts to query the real AuditLog table populated by audit.middleware.ts.*

### 12. Teams module is mock
- **File:** `apps/api/src/modules/teams/teams.service.ts`

### 13. Automations module is mock
- **File:** `apps/api/src/modules/automations/automations.service.ts`

### ~~14. SendGrid not configured — no email sending~~ — CODE READY 2026-05-25
*lib/email.service.ts wraps @sendgrid/mail. Stripe webhook now sends confirmation+receipt to guest on payment success. Requires SENDGRID_API_KEY in Railway to actually send.*

### 15. No CI/CD pipeline
- **Impact:** No automated checks before deploy
- **Fix:** Add `.github/workflows/ci.yml` with build + typecheck

### ~~16. `/api/v1/settings` returns 404 with HTML~~ — RESOLVED 2026-05-25
*Added JSON 404 catch-all on `/api/v1/*` in `app.ts`. See FIX_LOG.*

### 17. 8 Client pages not connected to API
- **Pages:** Affiliate, Messages, My Calendar, Pending Approvals, Portfolio Overview, Settings
- **Impact:** Owner portal has pages that show nothing useful

---

## LOW

### ~~W1. Website not deployed (apps/web)~~ — RESOLVED 2026-11-24 (live on sivanmanagment.com, WordPress removed)

### W4. sivanmanagment.com e-mail DNS — partly fixed 2026-11-24
- **Done (owner, GoDaddy):** MX `mail.sivanmanagment.com`, A `mail` → 81.218.79.204, SPF, DKIM key published (2048-bit, valid). Outbound test to Gmail: SPF pass, DMARC pass, inbox.
- **Open:** messages are not DKIM-signed yet (enable/repair DKIM in cPanel → Email Deliverability); an external test mail Gmail → support@ had not arrived after 10 min with no bounce — check cPanel → Email Routing = "Local Mail Exchanger".
- *Original finding below.*
#### W4. sivanmanagment.com e-mail DNS incomplete (GoDaddy DNS)
- **Found 2026-11-24:** no MX record, no SPF, no DKIM, while DMARC is `p=reject`.
- **Effect:** website lead e-mails reach `support@` only because the mailbox is on the same cPanel server (local delivery — verified). Mail from outside to `@sivanmanagment.com` cannot arrive, and mail sent *from* the domain to Gmail/Outlook will be rejected — so auto-replies to visitors are not possible yet.
- **Fix (owner, in GoDaddy DNS):** MX → the cPanel mail server (or the chosen mail provider), SPF `v=spf1 +a +mx ~all` (+ provider includes), publish the DKIM key from cPanel → Email Deliverability.

### W2. Company IBAN/BIC hard-coded as defaults in a public repo
- **File:** `apps/admin/src/pages/SystemSettingsPage.tsx` (lines ~161–208, `bankIban`/`bankBic` defaults).
- **Why it matters:** the repo is public, and the P0 batch of 2026-05-25 treated a public IBAN as a leak. Defaults should be empty and loaded from system settings. (Found while scanning the website commit for secrets; not changed.)

### W3. WordPress admin credentials shared in chat (2026-11-16)
- **Action:** change the `admin` password on sivanmanagment.com/wp-admin and revoke the application password created for Claude. Credentials were not stored anywhere in the repo.


### 18. 10 Admin pages fully hardcoded
- **Pages:** IoT Dashboard, Task Automations, Templates, Direct Booking Config, Marketing, Onboarding Wizard, Guest Portal Preview, Owner Portal Config, Guest Experience, Guest Screening
- **Impact:** Pages exist but show fake data

### 19. Remaining mock modules (low priority)
- `scoring.service.ts` — property scoring
- `guest-experience.service.ts` — guest journey
- `iot.service.ts` — IoT devices
- `integrations.service.ts` — third-party integrations
- `bulk.service.ts` — bulk operations
- `translations.service.ts` — DB-based translations
- `webhooks.service.ts` — webhook management
- `direct-booking.service.ts` — depends on booking-engine
- `owner-portal.service.ts` — client works via other modules

### 20. Seed file at non-standard location
- **Current:** `apps/api/src/prisma/seed.ts`
- **Standard:** `apps/api/prisma/seed.ts`
- **Impact:** `prisma db seed` command won't find it without config. Works via npm script.

### 21. No PayPal integration
- **Env:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` are empty
- **Impact:** Only Stripe works for payments

### 22. No real OTA API integration
- **Modules:** channels.service.ts has DB CRUD but no actual Airbnb/Booking.com API calls
- **Impact:** Channel management tracks connections but can't sync rates/availability

---

## Quick Reference — Issue Count

| Severity | Count |
|----------|-------|
| CRITICAL | 0 (3 resolved) |
| HIGH | 4 (1 resolved) |
| MEDIUM | 9 |
| LOW | 8 (incl. W1–W3 website/security) |
| **Total** | **21 open (4 resolved)** |

---

*Last updated: 2026-04-14*
