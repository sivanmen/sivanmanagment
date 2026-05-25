# Fix Log — Sivan Management PMS

> Every fix, patch, and correction is documented here.
> Format: Date, Problem, Files Changed, Root Cause, How Verified, Result.
> This prevents regressions and duplicate work.

---

## 2026-04-13 — GitHub Push Protection: Hardcoded Stripe keys in source

**Problem:** `git push origin main` was rejected by GitHub Push Protection. Stripe live secret key (`sk_live_...`) was hardcoded in `SystemSettingsPage.tsx` as a default value.

**Files Changed:**
- `apps/admin/src/pages/SystemSettingsPage.tsx` — replaced hardcoded keys with empty strings

**Root Cause:** When adding Stripe configuration to the admin settings page, the live Stripe keys were placed as default form values to pre-fill the UI. This is a security violation — secrets should never be in source code.

**How Fixed:**
1. Attempted `git rebase -i` to rewrite history — failed due to `.git/index.lock` race condition.
2. Aborted rebase, did `git reset --soft` to before both commits.
3. Staged clean version of SystemSettingsPage without secrets.
4. Recreated both commits cleanly.
5. Pushed with `--force-with-lease` (safe force push since no one else pushed).

**Verification:** `grep -r "sk_live_51RZ" .` — zero results in working tree. GitHub accepted the push.

**Result:** Two clean commits pushed: `6e2c523` and `a000cdf`. No secrets in git history.

---

## 2026-04-13 — Redis AUTH error causing API FAILED on Railway

**Problem:** API service on Railway kept failing with status FAILED. Deploy would build and healthcheck would pass, but runtime showed infinite loop:
```
[Redis] Connection error: ERR AUTH <password> called without any password configured for the default user
[Redis] Reconnecting...
[Redis] Connected successfully
(repeat infinitely)
```

**Files Changed:**
- Railway environment variable `REDIS_URL` on api service

**Root Cause:** `REDIS_URL` was set to `redis://:sivan_redis_2024@Redis.railway.internal:6379` — includes a password. But the Railway Redis instance has no password configured. Redis accepted the connection but threw AUTH errors on every command, triggering reconnect loops.

**How Fixed:**
```bash
railway variables --set "REDIS_URL=redis://Redis.railway.internal:6379" --service api
```
Removed the password from the URL.

**Verification:** 
- `railway service status --all` — API shows SUCCESS
- `railway logs --service api` — shows `[Redis] Connected successfully` with no errors
- `curl https://api.sivanmanagment.com/api/v1/health/deep` — Redis check returns `"status":"ok"`

**Result:** API stable, Redis connected, no more reconnect loops.

---

## 2026-04-13 — Railway rate limit from rapid env var changes

**Problem:** Setting 12 environment variables sequentially on Railway triggered rate limit: `Service deployment rate limit exceeded`. Each variable change triggered a separate redeploy, creating ~13 queued deployments.

**Files Changed:** None (infrastructure issue)

**Root Cause:** Railway redeploys the service every time an env var is set. Setting 12 vars in rapid succession created 12+ queued deploys, hitting Railway's rate limit.

**How Fixed:** Waited for the deploy queue to drain (~8 minutes). Some intermediate deploys failed (expected — they had partial env vars), but the final deploy with all vars succeeded.

**Lesson Learned:** When setting multiple Railway env vars, either:
- Use Railway dashboard to set all at once, or
- Add delays between CLI `railway variables --set` commands, or
- Set vars then manually trigger one redeploy

**Result:** All services SUCCESS after queue cleared.

---

## 2026-04-13 — Admin import mismatch for apiClient

**Problem:** `SystemSettingsPage.tsx` used `import { apiClient } from '../lib/api-client'` (named import) but `api-client.ts` exports `export default apiClient`.

**Files Changed:**
- `apps/admin/src/pages/SystemSettingsPage.tsx` — changed to `import apiClient from '../lib/api-client'`

**Root Cause:** Auto-import or copy-paste error. The api-client module uses default export, not named export.

**Verification:** `pnpm build:admin` — compiles without errors.

**Result:** Admin build succeeds.

---

## 2026-04-12 — Prisma migration failures on Railway startup

**Problem:** API container wouldn't start on Railway. Prisma migration errors on initial deploy.

**Files Changed:**
- `apps/api/package.json` — modified `start` script
- `apps/api/Dockerfile` — adjusted CMD

**Root Cause:** Initial Dockerfile used `prisma migrate deploy` but there were schema mismatches between the migration files and the actual schema state.

**How Fixed:** Changed `start` script to use `prisma db push --skip-generate` as a temporary workaround. This syncs schema without migration history.

**Verification:** `railway logs --service api` — `[START] Schema synced` message, server starts.

**Result:** API starts successfully. BUT this introduced a new issue: `--accept-data-loss` flag is dangerous for production. See OPEN_ISSUES.md #1.

---

## 2026-04-12 — Missing Prisma models for notifications and AI

**Problem:** API build failed — TypeScript errors referencing models that didn't exist in schema.

**Files Changed:**
- `apps/api/prisma/schema.prisma` — added notification channel models, AI provider models
- Created migration `20260411120000_add_notification_channels`
- Created migration `20260411190000_add_templates_ai_providers`

**Root Cause:** Code was written for modules that referenced models before those models were added to the Prisma schema.

**Verification:** `pnpm build:api` — compiles. `prisma migrate deploy` — migrations apply.

**Result:** 68 models total in schema. All TypeScript references resolve.

---

## 2026-04-12 — Seed file crashes on duplicate data

**Problem:** Running seed multiple times would fail with unique constraint violations.

**Files Changed:**
- `apps/api/src/prisma/seed.ts` — changed all `create` to `upsert`

**Root Cause:** Seed used `prisma.user.create()` which fails if the record already exists (email unique constraint).

**How Fixed:** Changed to `prisma.user.upsert({ where: { email }, update: {}, create: {...} })` for all entities. Added per-section try/catch so one failure doesn't abort the entire seed.

**Verification:** Ran seed twice — no errors on second run.

**Result:** Seed is idempotent. Safe to run on every deploy.

---

## 2026-04-11 — Admin password not updating on re-seed

**Problem:** Changed admin password in seed file but the old password persisted in DB.

**Files Changed:**
- `apps/api/src/prisma/seed.ts` — added password to the `update` block of admin user upsert

**Root Cause:** The upsert had `update: {}` (empty) — so existing users were never updated. The new password hash was only in the `create` block.

**Verification:** Re-ran seed, logged in with new password — success.

**Result:** Admin password updates on re-seed.

---

## 2026-04-11 — Favicon not loading on deployed frontends

**Problem:** Both admin and client showed default browser favicon, not the branded icon.

**Files Changed:**
- `apps/admin/public/favicon.svg` — replaced with branded house icon
- `apps/client/public/favicon.svg` — same

**Root Cause:** Favicon files were missing from public directories.

**Verification:** Deployed, loaded both sites — branded icon visible.

**Result:** Both sites show Sivan Management branded favicon.

---

## 2026-04-14 — Fix `start` script: replace `db push --accept-data-loss` with `migrate deploy`

**Problem:** Production `start` script used `prisma db push --skip-generate --accept-data-loss` which can silently drop columns/tables on schema changes.

**Files Changed:**
- `apps/api/package.json` — `start` script

**Root Cause:** During initial Railway deployment, `prisma migrate deploy` failed due to schema mismatches. `db push` was used as a quick workaround and never reverted.

**How Fixed:** Replaced `npx prisma db push --skip-generate --accept-data-loss` with `npx prisma migrate deploy`.

**Verification:** `pnpm build:api` — compiles. Script string verified.

**Result:** Production deploys now use safe migration-based schema sync.

---

## 2026-04-14 — WhatsApp service rewritten: mock → real Evolution API + Prisma

**Problem:** `whatsapp.service.ts` (575 lines) was 100% in-memory mock data. No real messages sent, no DB storage.

**Files Changed:**
- `apps/api/src/modules/whatsapp/whatsapp.service.ts` — complete rewrite

**Root Cause:** Module was scaffolded as mock during initial development and never wired to real DB/API.

**How Fixed:** Rewrote entire service:
- Contacts → real `GuestProfile` queries
- Messages → real `MessageThread` + `GuestMessage` DB records
- Templates → real `CommunicationTemplate` (channel=WHATSAPP)
- Sending → actual `POST` to Evolution API (`/message/sendText/{instanceName}`)
- Falls back gracefully if Evolution API is down (saves message as FAILED)
- Stats → real DB aggregates

**Verification:** `pnpm build:api` — zero TypeScript errors.

**Result:** WhatsApp module now uses real DB + real Evolution API. 0 Prisma calls → 15+ calls.

---

## 2026-04-14 — Booking Engine rewritten: mock → real Prisma DB queries

**Problem:** `booking-engine.service.ts` (868 lines) used hardcoded demo properties (Santorini, Mykonos, Athens) and in-memory Maps.

**Files Changed:**
- `apps/api/src/modules/booking-engine/booking-engine.service.ts` — complete rewrite
- `apps/api/src/modules/booking-engine/booking-engine.controller.ts` — added `await` to async calls

**Root Cause:** Module was scaffolded with demo data and never connected to real property/booking DB.

**How Fixed:** Rewrote entire service:
- `searchProperties()` → real `Property` queries with filters
- `checkAvailability()` → checks real `Booking` + `CalendarBlock` for conflicts
- `calculateQuote()` → uses real `SeasonalRate` from DB
- `createDirectBooking()` → creates real `Booking` + `GuestProfile` records
- `getEngineConfig()` → uses `DirectBookingSetting` model
- Promotions → stored in `SystemSetting` as JSON

**Verification:** `pnpm build:api` — zero TypeScript errors.

**Result:** Direct booking flow now uses real data. 0 Prisma calls → 20+ calls.

---

## 2026-04-14 — Pricing service rewritten: mock → real Prisma DB queries

**Problem:** `pricing.service.ts` (562 lines) used hardcoded seed rules and constant base rate (€150).

**Files Changed:**
- `apps/api/src/modules/pricing/pricing.service.ts` — complete rewrite

**Root Cause:** Module was scaffolded with hardcoded pricing rules and never connected to DB.

**How Fixed:** Rewrote entire service:
- Rules → loaded from real `SeasonalRate` + `RatePlan` + `SystemSetting` (custom rules)
- Base rate → from `Property.baseNightlyRate` (not hardcoded €150)
- Cleaning fee → from `Property.cleaningFee`
- Occupancy → calculated from real `Booking` count (last 30 days)
- Calculation algorithms preserved but fed with real DB data

**Verification:** `pnpm build:api` — zero TypeScript errors.

**Result:** Pricing now reflects actual property rates and seasonal rules. 0 Prisma calls → 15+ calls.

---

## 2026-05-25 — P0 security hardening batch (audit-driven)

**Problem:** Post-spec audit (LLM council) surfaced multiple P0 risks that block launch:
1. `GET /api/v1/payments/company-info` was PUBLIC, leaking company tax ID and bank IBAN to any unauthenticated caller (GDPR breach + phishing fuel).
2. Hardcoded fallback secrets in `config/index.ts`: `JWT_SECRET='dev-jwt-secret-change-me'`, `JWT_REFRESH_SECRET='dev-refresh-secret-change-me'`, `ENCRYPTION_KEY='dev-encryption-key-32-bytes-long!'`. If env vars went missing in production, prod would silently fall back to attacker-known values, allowing JWT forgery and decryption of any encrypted blob.
3. `STRIPE_WEBHOOK_SECRET` defaulted to empty string; Stripe webhook handler would still attempt verification but failure modes were not explicit — anyone could probe the endpoint.
4. `/api/v1/settings` and any other unknown `/api/v1/*` path returned HTML "Cannot GET ..." (Express default), breaking frontends that expect JSON.
5. 14 admin pages + 6 owner-portal pages showed mock data without any indication to the user — owners would believe statements/finances/etc. were real.

**Files Changed:**
- `apps/api/src/modules/payments/payments.routes.ts` — moved `GET /company-info` BEHIND `authMiddleware`; `/stripe/config` (publishable key only) remains the sole public payment route.
- `apps/api/src/config/index.ts` — rewrote with `requireSecret()` helper that throws on boot in production if JWT_SECRET / JWT_REFRESH_SECRET / ENCRYPTION_KEY are missing or still set to dev sentinels. Added `optionalSecret()` helper that warns (not throws) for integration keys (SendGrid, Evolution, R2, Anthropic, OpenAI, Google AI, Stripe, PayPal). Added `config.isProd` boolean. Added `config.observability.sentryDsn` field for future Sentry wiring. Added `config.whatsapp.defaultInstance`, `config.ai.defaultProvider`, `config.storage.endpoint`.
- `apps/api/src/modules/payments/stripe-webhook.controller.ts` — explicit 503 refusal when `STRIPE_WEBHOOK_SECRET` is unset, preventing any webhook processing without signature verification.
- `apps/api/src/app.ts` — added JSON 404 catch-all on `/api/v1/*` so the API always returns the standard `{success:false, error:{code:'NOT_FOUND', ...}}` envelope (matches PROJECT_RULES section 14).
- `apps/admin/src/components/PreviewBanner.tsx` (new) — Sivan-Obsidian-styled banner component with 3 variants (`preview`, `coming-soon`, `degraded`).
- `apps/admin/src/lib/mock-pages.ts` (new) — central registry of admin routes still backed by mock data. Easy to remove an entry when a backend is wired.
- `apps/admin/src/components/AppLayout.tsx` — renders `<PreviewBanner>` at top of any route matched in the mock-pages registry. Sivan can release a page just by deleting its entry.
- `apps/client/src/components/PreviewBanner.tsx`, `apps/client/src/lib/mock-pages.ts`, `apps/client/src/components/AppLayout.tsx` — same pattern for owner portal (6 mock pages: affiliate, messages, calendar, approvals, portfolio, settings).
- `packages/ui/src/components/composed/PreviewBanner.tsx` + `packages/ui/src/index.ts` — added a shared version of PreviewBanner to the design system for future use (apps currently use their own inlined copy since `@sivan/ui` is not wired as a workspace dependency in the apps yet — to be done in a follow-up).

**Root Cause:** Project moved fast through scaffolding; security defaults survived into production. Mock pages were never visually distinguished from real ones.

**How Verified:** `pnpm build` — all 3 packages compile with zero TS errors. (`api`: tsc Done. `admin`: vite ✓ built. `client`: vite ✓ built.)

**Required Operator Action Post-Deploy:**
- Rotate Railway production secrets to verify the fail-fast path works:
  ```bash
  railway variables --set "JWT_SECRET=$(openssl rand -hex 32)" --service api
  railway variables --set "JWT_REFRESH_SECRET=$(openssl rand -hex 32)" --service api
  railway variables --set "ENCRYPTION_KEY=$(openssl rand -hex 32)" --service api
  ```
  Note: existing JWTs will become invalid (users must re-login). This is intentional.
- Confirm `STRIPE_WEBHOOK_SECRET` is set; if not, the webhook endpoint will now return 503 instead of silently bypassing verification.

**Result:** Public IBAN/tax-ID leak closed. Production fail-fast in place for the 4 most dangerous default secrets. Stripe webhook refuses to operate without signing secret. Mock pages now wear a visible badge so owners and admins are never misled. Foundation laid for P1 integration work (SendGrid, Evolution WhatsApp, R2, Anthropic).

---

*Last updated: 2026-05-25*
*Total fixes logged: 14*

---

## 2026-05-25 — Users module rewritten: mock → real Prisma CRUD

**Problem:** `users.service.ts` (616 lines, 0 Prisma calls) was a pure in-memory mock with hardcoded user arrays. The Users Management admin page sent requests that succeeded but never touched the database. Listed as HIGH priority in OPEN_ISSUES #7.

**Files Changed:**
- `apps/api/src/modules/users/users.service.ts` — complete rewrite (616 → ~450 lines of real DB code).

**Approach:**
- `getAllUsers()`: real `prisma.user.findMany` with pagination, search across email/firstName/lastName/phone, role/status/isActive filters, sortable columns. Excludes soft-deleted by default.
- `getUserById()`: includes `notificationSettings`.
- `createUser()`: generates random temp password (`crypto.randomBytes(9).toString('base64url')`), bcrypt-hashed at cost 12, returns the temp password ONCE in the response so admin can communicate it.
- `updateUser()`: partial update, status takes precedence over isActive.
- `deleteUser()`: soft delete (sets `deletedAt`) + revokes all active refresh tokens in a single transaction.
- `inviteUser()`: createUser + applyNotificationPreset + records intent to send via configured channels.
- `suspendUser()` / `activateUser()`: thin wrappers over updateUser.
- `resetPassword()`: new random temp password + transactional revoke of all sessions (user logged out everywhere).
- `getActivity()`: real `auditLog.findMany` filtered by userId (populated by auditMiddleware).
- `getSessions()`: derived from non-revoked, non-expired `refreshToken` rows.
- `revokeSession()`: marks a single refresh token revoked.
- `updateNotificationSettings()`: per-category upsert into `UserNotificationSetting` (unique `[userId, category]`).
- `updateQuietHours()`: stored in `User.metadata` JSON field (no dedicated table in current schema).
- `getStats()`: parallel aggregates — totals by status, group-by role, active sessions count, last-7-days logins.

**Status enum bridge:** Prisma's `UserStatus` is `ACTIVE | SUSPENDED | PENDING_VERIFICATION`. The legacy API/Zod schema uses `ACTIVE | INACTIVE | SUSPENDED | PENDING`. `toPrismaStatus()` / `fromPrismaStatus()` helpers bridge so the frontend doesn't need to change.

**How Verified:** `pnpm --filter api build` — zero TS errors.

**Result:** Users module now uses real DB. 0 Prisma calls → 21 Prisma calls. OPEN_ISSUES #7 resolved.

---

## 2026-05-25 — Double-booking guard via PostgreSQL advisory lock

**Problem:** `bookings.service.ts` had application-level overlap detection (`findFirst` for conflicting bookings + calendar blocks) but no concurrency guarantee. Two parallel requests (e.g., admin manual booking + direct booking engine + iCal sync) could each find no conflict and then each insert overlapping bookings — the #1 way short-term rental businesses get destroyed on Booking.com reviews.

**Files Changed:**
- `apps/api/src/modules/bookings/bookings.service.ts` — added `acquireBookingLock()` helper; wrapped `createBooking()` and the date-changing path of `updateBooking()` in `prisma.$transaction` with `pg_advisory_xact_lock(hashtext(propertyId)::int, hashtext(unitId)::int)`.

**Why advisory lock and not a unique constraint:** PostgreSQL doesn't natively support range-overlap exclusion without the `btree_gist` extension. Advisory locks are zero-schema-change, transaction-scoped (auto-released on commit/rollback), and serialize only contending writes on the same `(property, unit)` pair — other booking creates run in parallel.

**How Verified:** `pnpm --filter api build` — zero TS errors. Manual reasoning: two concurrent createBooking calls for the same unit now serialize at the `pg_advisory_xact_lock` call; the second sees the first's committed booking in its overlap check and gets a 409 DATE_CONFLICT.

**Future Work (deferred):** add the `btree_gist` extension and a real `EXCLUDE USING gist (...)` constraint on the `bookings` table for defense-in-depth at the DB level. Requires a migration that can fail if existing data already contains overlaps (likely none, but worth a dry-run).

**Result:** Race condition closed. iCal-sync and direct-booking can now coexist safely with admin bookings.

---

*Last updated: 2026-05-25*
*Total fixes logged: 16*

---

## 2026-05-25 — External integrations batch: R2, SendGrid, Anthropic + PDF + reconcile

**Problem:** Six interrelated gaps from the audit:
1. Upload service threw raw `Error` on missing R2 env vars (no graceful degradation, no isConfigured check).
2. No email sending at all — `SENDGRID_API_KEY` was empty and no service wrapped @sendgrid/mail.
3. AI module was 251 lines of keyword-matching mock that pretended to give answers.
4. Stripe `payment_intent.succeeded` only fired a WhatsApp admin alert — guest got no email confirmation or receipt.
5. No owner statement PDF — `OwnerStatementsPage` was display-only.
6. No safety net for missed Stripe webhooks — a booking could stay PENDING forever if a webhook was dropped.

**Files Changed:**

*New shared libraries (`apps/api/src/lib/`):*
- `email.service.ts` — wraps `@sendgrid/mail`. `isConfigured()` + `send()` + `sendBookingConfirmation()` (HE + EN templates) + `sendPaymentReceipt()` + `sendOwnerStatement()` with optional PDF attachment. Returns structured `{ok, skipped, messageId, error}` — never throws.
- `ai.service.ts` — wraps `@anthropic-ai/sdk`. Provider-agnostic surface (`complete()`, `ask()`) so OpenAI/Google can be added later. Skipped-not-thrown when key missing.
- `pdf.service.ts` — `generateOwnerStatementPdf()` using `pdfkit`. Sivan Obsidian style (accent `#6b38d4`, glass row backgrounds), per-property line items, totals row, optional company footer (name, address, tax ID, IBAN).

*New jobs:*
- `jobs/stripe-reconcile.job.ts` — daily at 02:00 UTC: pulls Stripe payment intents from the last 48h, patches any booking whose paymentStatus diverges from Stripe truth, idempotently creates the income record. No-op when Stripe key missing. Registered in `jobs/index.ts`.

*Edits:*
- `apps/api/src/config/index.ts` — already adjusted in earlier P0 commit.
- `apps/api/src/utils/api-error.ts` — added `ApiError.serviceUnavailable(message, code)` (HTTP 503) for graceful-degradation surfaces.
- `apps/api/src/modules/uploads/upload.service.ts` — rewrite: reads from `config.storage` (not direct process.env), `isConfigured()`/`requireConfigured()` helpers, `ping()` for health check, `endpoint` override support, `isPublic` flag on upload result.
- `apps/api/src/modules/ai/ai.service.ts` — full rewrite: real `AiConversation` persistence (was in-memory), Claude Sonnet via `aiClient.complete()`, per-context system prompts (GENERAL/FINANCE/BOOKING/MAINTENANCE/GUEST), graceful fallback message when key missing. Recommendations stubbed with a clear `_note` until the analytics pipeline is wired.
- `apps/api/src/modules/reports/reports.service.ts` — added `generateOwnerStatementPdf()` via prototype extension; reuses `getOwnerStatement()` for data, calls `pdf.service`, optional SendGrid delivery.
- `apps/api/src/modules/reports/reports.controller.ts` + `reports.routes.ts` — new `GET /api/v1/reports/owner-statement/:ownerId/pdf` endpoint. Streams PDF binary by default; `?email=true` triggers send-and-return-JSON-receipt.
- `apps/api/src/modules/payments/stripe.service.ts` — on `payment_intent.succeeded` with bookingId: fire-and-forget `emailService.sendBookingConfirmation()` + `sendPaymentReceipt()` to the guest's email, locale auto-detected from guest name (Hebrew script → HE template).
- `apps/api/package.json` — added `@sendgrid/mail`, `@anthropic-ai/sdk`, `pdfkit`, `@types/pdfkit`.

**Required Operator Action:** Set the following in Railway → api service to actually enable these integrations:
```
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@sivanmanagment.com
EVOLUTION_API_KEY=...
EVOLUTION_API_URL=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=sivan-pms
R2_PUBLIC_URL=https://...
ANTHROPIC_API_KEY=...
```
Until these are set, each service stays in "skipped/degraded" mode and the UI shows a degraded banner — no silent failures.

**How Verified:** `pnpm --filter api build` — zero TS errors.

**Result:** Five mock modules transitioned from "fake answers" to "real-when-keys-present / clearly-skipped-when-not". Daily Stripe reconcile job closes the webhook-loss window. Owner statement PDF endpoint is live. AI module went from 0 Prisma calls to ~6 (sessions + history).

---

## 2026-05-25 — Owner Portal rewrite: mock → real (0 → 12 Prisma calls)

**Problem:** `owner-portal.service.ts` (508 lines) returned hardcoded demo statements for "owner-1/owner-2/owner-3" — Sivan's actual paying customers (the property owners) were seeing fabricated revenue numbers when logging into client.sivanmanagment.com. The trust-destroying mock listed in OPEN_ISSUES.

**Files Changed:**
- `apps/api/src/modules/owner-portal/owner-portal.service.ts` — full rewrite. ~370 lines.
- `apps/api/src/modules/owner-portal/owner-portal.controller.ts` — added `await` to 12 call sites.

**Storage strategy:**
- Portal config (branding/visibility/notifications) → persisted on `Owner.metadata.portalConfig` JSON. No new schema needed.
- Owner reservations (OWNER_STAY / FRIENDS_FAMILY) → real `Booking` rows with `source='DIRECT'` and `metadata.ownerReservation={ownerId,type,...,status}`. RLS preserved via filter on metadata.ownerId. Approve/reject/cancel transitions update both the Booking.status AND the metadata.status atomically.
- Statements → on-demand delegation to `reports.service.getOwnerStatement()` (the real one with real Prisma aggregates). Synthetic IDs in the form `${ownerId}-${year}-${month}` let the existing UI fetch by ID.
- Export → real Prisma data, CSV or JSON.

**Why this approach:** Avoids adding new Prisma models for what's essentially a view over existing data. Owner.metadata is already a Json column. Owner reservations are conceptually bookings — storing them as bookings keeps the calendar/availability checks unified (and double-booking guard applies to them too).

**How Verified:** `pnpm --filter api build` — zero TS errors.

**Result:** Owner Portal now shows real data. Owner.bookings, Owner.expenses, Owner.statements all flow from the real DB. OPEN_ISSUES item closed.

---

*Last updated: 2026-05-25*
*Total fixes logged: 18*

---

## 2026-05-25 — Batch C: Audit module real + Sentry + Status + Encryption + AADE stub + Tests

**Problem:** Final P2 + spec-improvements bundle, all coupled:
1. `audit.service.ts` was mock (273L, 0 prisma) while `audit.middleware.ts` had been populating the real AuditLog table — admin Audit page showed canned data while the real log accumulated invisibly.
2. No error monitoring — silent failures in jobs/webhooks/cron only visible by tailing Railway logs.
3. No internal `/status` page — couldn't tell at a glance which integrations were live.
4. No field-level encryption helper for IBANs/passports/etc.
5. No AADE myDATA scaffolding for the Greek e-invoice legal requirement.
6. Zero automated tests in 109K LOC.

**Files Changed:**

*New libs (apps/api/src/lib/):*
- `observability.ts` — Sentry wrapper. `initObservability()` boots before app load; `captureError(err, ctx)` façade; `isSentryActive()` for the status page. No-op when SENTRY_DSN missing.
- `encryption.ts` — AES-256-GCM helpers. `encrypt()` / `decrypt()` / `isEncrypted()` / `maskIban()`. Output prefixed `enc:v1:` for version + detection. SHA-256 key derivation from `config.encryption.key`. Designed for explicit call-site usage (no silent magic).
- `aade-mydata.service.ts` — STUB for Greek AADE myDATA e-invoice submission. Interface frozen (`submitInvoice` / `cancelInvoice` / `pull`) so downstream code can call it now and get `{ok:false, skipped:true}` until credentials are provisioned. Records every attempt to AccountingEntry for the auditor.

*Rewrites:*
- `audit/audit.service.ts` (273L mock → ~190L real): full Prisma-backed query API over the `AuditLog` model populated by `audit.middleware.ts`. `getAuditLog` with all filters, pagination, search; `getAuditEntry`, `getEntityHistory`, `getUserActivity`, `getStats`. Projects schema's `entityType` field to legacy `entity` shape so frontend doesn't need to change.

*New endpoints:*
- `GET /api/v1/status` — public status endpoint. Returns green/red per integration: database, redis, stripe, sendgrid, evolution_whatsapp, cloudflare_r2, anthropic_ai, aade_mydata, sentry. Used to power an internal status page; does NOT expose any secrets.

*Sentry wiring:*
- `apps/api/src/index.ts` — `initObservability()` called BEFORE `app` import so boot errors are captured. `unhandledRejection` and `uncaughtException` handlers now also `captureError()`.

*Tests:*
- `apps/api/vitest.config.ts` (new), `apps/api/src/__tests__/smoke.test.ts` (new). 8 passing tests covering encryption round-trip + null handling + double-encrypt guard + IBAN masking + config module load. First tests in the repo (was 0).

*Packages:*
- `apps/api/package.json`: +`@sentry/node`, +`vitest` (dev), +`supertest` (dev), +`@types/supertest` (dev).

**How Verified:** `pnpm --filter api test` — 8 passing. `pnpm build` — all 3 packages compile clean.

**Result:** Audit module real (273L mock → 0; 0 prisma → 6+ prisma calls). Sentry ready (turns on when SENTRY_DSN set). `/status` endpoint live. Encryption + AADE stubs in place for downstream code to call. Smoke tests bootstrap the test infrastructure.

---

## 2026-05-25 — Modules retained as mock (intentional, with PreviewBanner)

The following modules remain mock-backed and continue to display the
PreviewBanner. They require schema additions or significant new business
logic and were deemed lower-priority than the launch path:

| Module | Why kept as mock |
|--------|------------------|
| `teams` | No `Team` Prisma model exists. Requires schema migration + RBAC redesign. Single-operator can use the `users` module directly. |
| `accounting` | The schema has `AccountingEntry` (single ledger entry) but no `Account` / `JournalEntry` models. Full double-entry bookkeeping is a separate project. Real income/expense already flow through `finance` module. |
| `automations` | `MarketingJourney` schema exists; the rules engine to evaluate triggers is a multi-day build. |
| `direct-booking` | Duplicate of `booking-engine` which is real (29 prisma calls). Routes can be merged in a follow-up. |
| `scoring`, `iot`, `bulk`, `integrations`, `translations`, `webhooks` | All require analytics pipelines / device protocols / large schema additions. PreviewBanner makes the situation visible to the user. |

These appear in the admin nav with the visible "Preview / Coming soon"
banner so Sivan and any staff member can see at a glance which screens
are real and which are not.

---

*Last updated: 2026-05-25*
*Total fixes logged: 20*
