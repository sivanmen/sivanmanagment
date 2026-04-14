# Open Issues — Sivan Management PMS

> Active issues. Remove when fixed (and log in FIX_LOG.md).
> Sorted by severity: CRITICAL > HIGH > MEDIUM > LOW.

---

## CRITICAL

### 1. `start` script uses `prisma db push --accept-data-loss`
- **File:** `apps/api/package.json` line 8
- **Risk:** Can silently drop columns/tables on schema changes in production
- **Fix:** Replace with `npx prisma migrate deploy`
- **Blocked by:** Need to verify all 3 migrations apply cleanly on Railway DB

### 2. Booking Engine module is 100% mock
- **File:** `apps/api/src/modules/booking-engine/booking-engine.service.ts`
- **Impact:** Direct booking from client portal doesn't work with real data
- **Depends on:** Pricing module also being real

### 3. Pricing module is 100% mock
- **File:** `apps/api/src/modules/pricing/pricing.service.ts`
- **Impact:** No real rate management, seasonal pricing, or dynamic pricing

---

## HIGH

### 4. WhatsApp service is mock — notifications don't send
- **File:** `apps/api/src/modules/whatsapp/whatsapp.service.ts` (0 Prisma calls)
- **Impact:** Payment notifications (coded in `stripe.service.ts`) never actually send
- **Fix:** Implement real Evolution API calls using `config.whatsapp.apiUrl` and `config.whatsapp.apiKey`

### 5. File upload service is a stub — no R2 connection
- **File:** `apps/api/src/modules/uploads/upload.service.ts`
- **Impact:** Property images, documents, receipts can't be uploaded
- **Fix:** Implement S3-compatible upload using `@aws-sdk/client-s3` (already installed) + R2 credentials

### 6. AI service is mock — no real AI responses
- **File:** `apps/api/src/modules/ai/ai.service.ts`
- **Impact:** AI chatbot returns canned responses, no Claude/GPT/Gemini calls
- **Fix:** Use `config.ai.anthropicKey` (already in config) + Anthropic SDK

### 7. Users module is mock — user management doesn't work
- **File:** `apps/api/src/modules/users/users.service.ts` (0 Prisma calls)
- **Impact:** Admin can't manage users through the Users Management page
- **Note:** Auth module (login/register) works fine — this is about CRUD management

### 8. No automated tests
- **Impact:** No safety net for regressions
- **Minimum:** E2E tests for auth, bookings, payments flows

---

## MEDIUM

### 9. Company info endpoint is public — exposes tax/IBAN
- **Endpoint:** `GET /api/v1/payments/company-info`
- **File:** `apps/api/src/modules/payments/payments.routes.ts`
- **Risk:** Tax number and IBAN visible to anyone
- **Fix:** Move behind auth middleware or at least rate-limit

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

### 16. `/api/v1/settings` returns 404
- **Expected:** JSON error response
- **Actual:** HTML error page
- **Note:** System settings are at `/api/v1/system-settings` — this is just a missing catch-all

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
| CRITICAL | 3 |
| HIGH | 5 |
| MEDIUM | 9 |
| LOW | 5 |
| **Total** | **22** |

---

*Last updated: 2026-04-14*
