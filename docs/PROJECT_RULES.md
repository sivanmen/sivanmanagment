# Project Rules — Sivan Management PMS

> This file defines constraints that MUST NOT change without explicit approval from Sivan.
> Any AI agent or developer working on this codebase MUST read this file first.

---

## 1. Architecture — Do Not Change

```
sivan-management/
├── packages/
│   ├── shared/          # @sivan/shared — types, Zod schemas, constants, i18n
│   └── ui/              # @sivan/ui — design system components (Sivan Obsidian)
├── apps/
│   ├── api/             # Node.js 20 + Express + Prisma + TypeScript
│   ├── admin/           # React 18 + Vite (admin.sivanmanagment.com)
│   └── client/          # React 18 + Vite (client.sivanmanagment.com)
├── docker/
│   └── docker-compose.dev.yml
├── docs/                # Project documentation (this file lives here)
├── pnpm-workspace.yaml
└── package.json
```

- **Monorepo manager**: pnpm workspaces. Do NOT switch to npm/yarn/turborepo.
- **Three deployable services**: api, admin, client. Do NOT merge them.
- **Two shared packages**: @sivan/shared, @sivan/ui. All types/schemas/components shared here.

---

## 2. Tech Stack — Locked

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20.x |
| Language | TypeScript | 5.x |
| Backend framework | Express | 4.x |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Frontend framework | React | 18.x |
| Build tool | Vite | latest |
| CSS | Tailwind CSS | 3.x |
| UI library | shadcn/ui | latest |
| State (server) | TanStack Query | 5.x |
| State (client) | Zustand | 4.x |
| Forms | React Hook Form + Zod | latest |
| Icons | Lucide React | latest |
| Package manager | pnpm | 9.x |

**Do NOT** introduce new frameworks (Next.js, NestJS, tRPC, Drizzle, etc.) without approval.

---

## 3. Design System — Sivan Obsidian

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#030303` | Text, backgrounds |
| Accent | `#6b38d4` | Buttons, links, active states |
| Font heading | Manrope | All headings |
| Font body | Inter | All body text |
| Glass effect | `backdrop-blur + bg-white/5` | Cards (LiquidGlassCard) |
| Gradient | `from-[#6b38d4] to-[#8b5cf6]` | CTA buttons, highlights |

**CSS classes used throughout** (do NOT rename):
- `bg-surface`, `bg-surface-elevated`, `text-on-surface`
- `glass-card`, `gradient-accent`, `ambient-shadow`
- Dark theme is the default. No light mode toggle exists.

---

## 4. API Module Structure

Every API module follows this pattern. Do NOT deviate:

```
apps/api/src/modules/{module-name}/
├── {module-name}.controller.ts   # Request handling, response formatting
├── {module-name}.service.ts      # Business logic, DB queries via Prisma
├── {module-name}.routes.ts       # Express router, middleware, validation
├── {module-name}.schema.ts       # Zod validation schemas (optional)
└── {module-name}.repository.ts   # Data access layer (optional, for complex queries)
```

**Controller** receives req/res, calls service, returns `{ success, data, timestamp }`.
**Service** contains all business logic and Prisma calls. No `req`/`res` here.
**Routes** define HTTP methods, apply middleware (auth, validation, RBAC).

---

## 5. Database Rules

- **ORM**: Prisma only. No raw SQL unless absolutely necessary (and document why).
- **Schema file**: `apps/api/prisma/schema.prisma` — single source of truth.
- **Migrations**: Use `prisma migrate dev` locally, `prisma migrate deploy` in production.
- **Seed file**: `apps/api/src/prisma/seed.ts` — uses upserts, never deletes existing data.
- **Do NOT** add `--accept-data-loss` in production scripts (known issue in current `start` script).
- **Do NOT** drop tables or columns without migration + approval.
- **Naming**: snake_case for DB columns, camelCase for Prisma model fields (Prisma handles mapping via `@map`).

---

## 6. Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `booking-detail.controller.ts` |
| React components | PascalCase | `BookingDetailPage.tsx` |
| Functions/variables | camelCase | `getBookingById()` |
| Types/interfaces | PascalCase | `BookingResponse` |
| API routes | kebab-case, plural | `/api/v1/bookings`, `/api/v1/guest-experience` |
| DB tables | PascalCase (Prisma) | `model BookingWidget` |
| Env variables | UPPER_SNAKE_CASE | `STRIPE_SECRET_KEY` |
| CSS classes | kebab-case | `glass-card`, `gradient-accent` |

---

## 7. Protected Zones — Do NOT Break

These areas are critical. Changing them can bring down production:

| Zone | Files | Why |
|------|-------|-----|
| Auth middleware | `apps/api/src/middleware/auth.middleware.ts` | All routes depend on this |
| Prisma schema | `apps/api/prisma/schema.prisma` | DB structure, migrations |
| Prisma client | `apps/api/src/prisma/client.ts` | Singleton, all modules import it |
| Config | `apps/api/src/config/index.ts` | All env vars loaded here |
| App entry | `apps/api/src/app.ts` | Route registration, middleware chain |
| Health endpoint | In `app.ts` | Railway healthcheck depends on this |
| `.env` | Root `.env` | Secrets — NEVER commit to git |
| Dockerfiles | `apps/*/Dockerfile` | Railway deploys use these |

---

## 8. Secrets — Absolute Rules

- **NEVER** hardcode API keys, tokens, passwords in source code.
- **NEVER** commit `.env` to git (it's in `.gitignore`).
- **NEVER** log secrets (Stripe keys, JWT secrets, DB passwords).
- GitHub Push Protection is ENABLED — pushes with secrets will be rejected.
- All secrets go in `.env` locally and Railway Variables in production.

---

## 9. Git Rules

- Branch: `main` (single branch for now).
- Commit messages: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:` prefix.
- **NEVER** force-push without checking with Sivan.
- **NEVER** use `--no-verify` to skip hooks.
- **NEVER** amend a commit that's already pushed.
- Use `git push --force-with-lease` only when rewriting history is necessary (e.g., removing secrets).

---

## 10. How to Run

```bash
# Install dependencies
pnpm install

# Local development (all services)
docker compose -f docker/docker-compose.dev.yml up -d   # Start Postgres + Redis
pnpm dev                                                  # Start API + Admin + Client

# Individual services
pnpm dev:api      # http://localhost:3001
pnpm dev:admin    # http://localhost:5173
pnpm dev:client   # http://localhost:5174

# Build
pnpm build        # Build all
pnpm build:api    # API only (tsc)
pnpm build:admin  # Admin only (vite)
pnpm build:client # Client only (vite)

# Database
pnpm db:migrate   # Create and apply migration
pnpm db:push      # Push schema without migration (dev only)
pnpm db:seed      # Run seed file
```

---

## 11. How to Deploy

```bash
# Railway deployment (auto-deploys on push to main)
# Manual deploy:
export RAILWAY_TOKEN="<project-token>"
railway service status --all                    # Check all services
railway redeploy --service api --yes            # Redeploy API
railway variables --set "KEY=value" --service api  # Set env var
railway logs --service api                      # View logs
```

**Production URLs:**
- API: `https://api.sivanmanagment.com`
- Admin: `https://admin.sivanmanagment.com`
- Client: `https://client.sivanmanagment.com`

---

## 12. How to Submit a Fix

1. Read `docs/CURRENT_STATE.md` to understand what's working.
2. Read `docs/OPEN_ISSUES.md` to see known problems.
3. Make the fix in the correct module following section 4 structure.
4. Build all three packages: `pnpm build` — must pass with zero errors.
5. Test the specific endpoint or page manually.
6. Log the fix in `docs/FIX_LOG.md` with date, files, reason, and result.
7. Update `docs/CURRENT_STATE.md` if the fix changes module status.
8. Update `docs/OPEN_ISSUES.md` — remove resolved, add new if found.
9. Commit with proper message prefix.
10. Push and verify Railway deploy succeeds.

---

## 13. i18n Rules

- 6 languages: `en`, `he`, `es`, `fr`, `de`, `ru`
- Translation files: `packages/shared/src/i18n/locales/{lang}.ts`
- Every user-facing string MUST use `t('key')` from `useTranslation()`.
- Hebrew (`he`) triggers RTL layout via `dir="rtl"` on root element.
- **Do NOT** hardcode Hebrew/English strings in components.

---

## 14. API Response Format

All API responses follow this structure:

```typescript
// Success
{ success: true, data: T, timestamp: string }

// Success with pagination
{ success: true, data: T[], pagination: { page, limit, total, totalPages }, timestamp: string }

// Error
{ success: false, error: { code: string, message: string, details?: any }, timestamp: string }
```

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

---

*Last updated: 2026-04-14*
