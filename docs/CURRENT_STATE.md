# Current State — Sivan Management PMS

> Snapshot of what works, what's deployed, and what's next.
> Update this file after every significant change.

---

## Production Deployment

| Service | URL | Status | Last Deploy |
|---------|-----|--------|-------------|
| API | https://api.sivanmanagment.com | RUNNING | 2026-04-13 |
| Admin | https://admin.sivanmanagment.com | RUNNING | 2026-04-13 |
| Client | https://client.sivanmanagment.com | RUNNING | 2026-04-13 |
| PostgreSQL | Railway managed (internal) | RUNNING | — |
| Redis | Railway managed (internal) | RUNNING | — |

**Railway Project**: Property Management System
**GitHub**: github.com/sivanmen/sivanmanagment (main branch)
**Total commits**: 30

---

## Codebase Size

| Metric | Count |
|--------|-------|
| TypeScript lines | ~109,470 |
| Prisma schema lines | 2,188 |
| DB models | 68 |
| API modules | 45 |
| Admin pages | 62 |
| Client pages | 20 |
| i18n languages | 6 (en, he, es, fr, de, ru) |
| Translation keys per language | ~1,200 |
| Prisma migrations | 3 |
| Test files | 0 |

---

## API Modules — Status Map

### REAL (31 modules — connected to DB with Prisma queries)

| Module | Service File | Prisma Calls | Notes |
|--------|-------------|-------------|-------|
| analytics | analytics.service.ts | 42 | Dashboard stats, trends |
| finance | finance.service.ts | 30 | Income, expenses, fees |
| reports | reports.service.ts | 28 | Report generation |
| messaging-instances | messaging-instances.service.ts | 26 | WhatsApp instance management |
| tasks | tasks.service.ts | 24 | Task CRUD |
| loyalty | loyalty.service.ts | 24 | Tiers, members, points |
| maintenance | maintenance.service.ts | 23 | Work orders, requests |
| expenses | expenses.service.ts | 23 | Expense CRUD |
| expense-approval | expense-approval.service.ts | 23 | Approval workflow |
| affiliates | affiliates.service.ts | 23 | Affiliate program |
| communications | communications.service.ts | 22 | Message threads |
| portfolio | portfolio.service.ts | 22 | Investment tracking |
| bookings | bookings.service.ts | 20 | Booking CRUD |
| stripe | stripe.service.ts | 20 | Payment processing |
| calendar | calendar.service.ts | 19 | Calendar blocks |
| admin | admin.service.ts | 19 | Admin operations |
| marketing | marketing.service.ts | 17 | Journey management |
| owners | owners.service.ts | 17 | Owner CRUD |
| payments | payments.service.ts | 16 | Payment records |
| properties | properties.service.ts | 15 | Property CRUD |
| channels | channels.service.ts | 15 | Channel connections |
| notification-channels | notification-channels.service.ts | 15 | Notification config |
| reviews | reviews.service.ts | 15 | Review management |
| documents | documents.service.ts | 14 | Document CRUD |
| auth | auth.service.ts | 14 | JWT, login, register |
| guests | guests.service.ts | 13 | Guest profiles |
| units | units.service.ts | 13 | Property units |
| ical-sync | ical-sync.service.ts | 12 | iCal feed parser + sync |
| whatsapp | whatsapp.service.ts | 15+ | Evolution API integration, real message DB |
| booking-engine | booking-engine.service.ts | 20+ | Direct booking, availability, quotes from DB |
| pricing | pricing.service.ts | 15+ | SeasonalRate + RatePlan from DB, real calculations |

### MOCK (9 modules — return hardcoded/in-memory data, 0 Prisma calls)

| Module | Lines | Priority to Fix |
|--------|-------|----------------|
| ~~ai~~ | ~~251~~ | ~~HIGH~~ ✅ REAL (2026-05-25) — Anthropic SDK wired, AiConversation persisted |
| ~~users~~ | ~~616~~ | ~~HIGH — user management is fake~~ ✅ REAL (2026-05-25, 21 prisma calls) |
| ~~owner-portal~~ | ~~508~~ | ~~LOW~~ ✅ REAL (2026-05-25, Owner.metadata + Booking + reports.service) |
| ~~audit~~ | ~~273~~ | ~~MED~~ ✅ REAL (2026-05-25, queries AuditLog populated by middleware) |
| **automations** | 432 | MEDIUM — no real automation engine |
| **teams** | 322 | MEDIUM — team management fake |
| **uploads** | 184 | MEDIUM — R2 not connected |
| **accounting** | 472 | MEDIUM — ledger is fake |
| **audit** | 273 | MEDIUM — audit trail is fake |
| **direct-booking** | 439 | MEDIUM — tied to booking-engine |
| **owner-portal** | 508 | LOW — client app works via other modules |
| **scoring** | 944 | LOW — nice to have |
| **guest-experience** | 979 | LOW — nice to have |
| **iot** | 275 | LOW — future feature |
| **integrations** | 329 | LOW — manual for now |
| **bulk** | 190 | LOW — can do one by one |
| **translations** | 329 | LOW — static i18n files work |
| **webhooks** | 265 | LOW — not needed yet |

---

## Frontend Pages — Status

### Admin (62 pages)

**Connected to real API (~42 pages):**
Dashboard, Properties (list/detail/form), Owners (list/detail/form), Bookings (list/detail/form), Calendar, Guests (list/detail), Finance Dashboard, Expenses (list/form), Income (form), Management Fees, Owner Statements, Documents, Maintenance (list/detail/form), Tasks, Messages, Reports, Loyalty Admin, Affiliates, Channels, Portfolio, Analytics, Pricing, Booking Engine, Booking Extras, Guest Screening, Notifications, Notification Templates, System Settings, Team Management, Webhooks, WhatsApp Instances, AI Providers, Review Management, Property Scoring, Users Management, User Profile, Integrations, Login

**Mock/static (~10 pages):**
IoT Dashboard, Task Automations, Templates, Direct Booking Config, Marketing, Onboarding Wizard, Guest Portal Preview, Owner Portal Config, Guest Experience (partial)

### Client/Owner Portal (20 pages)

**Connected to real API (~12 pages):**
Dashboard, My Properties, Property Detail, My Bookings, Booking Payment, Booking Confirmation, Financial Summary, Statements, My Documents, Maintenance Requests, Loyalty, Owner Reservations, Login

**Mock/static (~8 pages):**
Affiliate, Messages, My Calendar, Pending Approvals, Portfolio Overview, Settings

---

## Integrations — Connection Status

| Integration | Status | Details |
|-------------|--------|---------|
| **Stripe** | CONNECTED (Live) | Payment Intents, Webhooks, Elements. Keys configured in Railway. |
| **PostgreSQL** | CONNECTED | Railway managed, 68 tables, 3 migrations applied |
| **Redis** | CONNECTED | Railway managed, caching + session support |
| **SendGrid** | NOT CONFIGURED | API key empty in env |
| **Evolution API (WhatsApp)** | NOT CONNECTED | Service is mock, no real API calls |
| **Cloudflare R2** | NOT CONNECTED | Upload service is stub |
| **Anthropic (Claude)** | NOT CONNECTED | API key empty, AI service is mock |
| **OpenAI (GPT)** | NOT CONNECTED | API key empty, AI service is mock |
| **Google AI (Gemini)** | NOT CONNECTED | API key empty, AI service is mock |
| **Airbnb API** | NOT CONNECTED | Channel module has DB but no OTA API calls |
| **Booking.com API** | NOT CONNECTED | Same as Airbnb |
| **PayPal** | NOT CONFIGURED | Keys empty in env |
| **n8n** | NOT CONNECTED | Webhook URL configured but no flows |
| **AADE myDATA** (new 2026-05-25) | STUB | Interface in place; awaiting credentials + WSDL onboarding |
| **Sentry** (new 2026-05-25) | READY | Wired in apps/api/src/index.ts; set SENTRY_DSN to enable |

---

## Background Jobs

| Job | Schedule | Status |
|-----|----------|--------|
| iCal Feed Sync | Every 15 minutes | RUNNING |
| Expense Expiry Check | Every hour | RUNNING |
| **Stripe Reconcile** (new 2026-05-25) | Daily 02:00 UTC | RUNNING (no-op when STRIPE_SECRET_KEY missing) |

---

## Known Issues (as of 2026-04-14)

1. ~~**`start` script uses `prisma db push --accept-data-loss`**~~ — FIXED 2026-04-14. Now uses `prisma migrate deploy`.
2. **Seed file location** — lives at `src/prisma/seed.ts` instead of standard `prisma/seed.ts`. Works but non-standard.
3. **17 API modules return mock data** — see Mock table above.
4. **Company info endpoint is public** — `/api/v1/payments/company-info` exposes tax number and IBAN without auth.
5. **No automated tests** — zero test files in entire codebase.
6. **No CI/CD pipeline** — no GitHub Actions workflow.
7. **WhatsApp payment notifications** — code exists in `stripe.service.ts` but `whatsapp.service.ts` is mock, so messages don't actually send.
8. **`/api/v1/settings` returns 404** — route not registered (system-settings uses different path).

---

## Priority Queue — What to Build Next

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Fix `start` script — replace `db push` with `migrate deploy` | Safety | 5 min |
| 2 | Connect WhatsApp (Evolution API) — make notifications real | High | 2-4 hrs |
| 3 | Connect file uploads (Cloudflare R2) | High | 2-3 hrs |
| 4 | Wire booking-engine + pricing to real DB | Critical | 4-6 hrs |
| 5 | Wire users module to real DB | High | 1-2 hrs |
| 6 | Connect AI service (Claude API) | Medium | 2-3 hrs |
| 7 | Add PDF generation for invoices/receipts | Medium | 3-4 hrs |
| 8 | Wire automations module to real DB | Medium | 3-4 hrs |
| 9 | Wire teams module to real DB | Medium | 1-2 hrs |
| 10 | Wire accounting module to real DB | Medium | 2-3 hrs |
| 11 | Add E2E tests for critical flows | Important | 4-6 hrs |
| 12 | Add GitHub Actions CI pipeline | Important | 1-2 hrs |
| 13 | Connect SendGrid for email | Medium | 1-2 hrs |
| 14 | Wire remaining mock client pages | Low | 2-3 hrs |

---

*Last updated: 2026-04-14*
