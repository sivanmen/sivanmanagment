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

### 5. File upload service is a stub — no R2 connection
- **File:** `apps/api/src/modules/uploads/upload.service.ts`
- **Impact:** Property images, documents, receipts can't be uploaded
- **Fix:** Implement S3-compatible upload using `@aws-sdk/client-s3` (already installed) + R2 credentials

### 6. AI service is mock — no real AI responses
- **File:** `apps/api/src/modules/ai/ai.service.ts`
- **Impact:** AI chatbot returns canned responses, no Claude/GPT/Gemini calls
- **Fix:** Use `config.ai.anthropicKey` (already in config) + Anthropic SDK

### ~~7. Users module is mock~~ — RESOLVED 2026-05-25
*Rewrote users.service.ts with real Prisma CRUD. 0 → 21 Prisma calls. See FIX_LOG.*

### 8. No automated tests
- **Impact:** No safety net for regressions
- **Minimum:** E2E tests for auth, bookings, payments flows

---

## MEDIUM

### ~~9. Company info endpoint is public — exposes tax/IBAN~~ — RESOLVED 2026-05-25
*Promoted to P0 during audit. Endpoint now requires authMiddleware. See FIX_LOG.*

### 10. Accounting module is mock
- **File:** `apps/api/src/modules/accounting/accounting.service.ts`

### 11. Audit module is mock — no real audit trail
- **File:** `apps/api/src/modules/audit/audit.service.ts`

### 12. Teams module is mock
- **File:** `apps/api/src/modules/teams/teams.service.ts`

### 13. Automations module is mock
- **File:** `apps/api/src/modules/automations/automations.service.ts`

### 14. SendGrid not configured — no email sending
- **Env:** `SENDGRID_API_KEY` is empty in both `.env` and Railway

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
| LOW | 5 |
| **Total** | **18 open (4 resolved)** |

---

*Last updated: 2026-04-14*
