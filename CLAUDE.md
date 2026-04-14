# Sivan Management PMS — AI Agent Instructions

> This file is read automatically by Claude Code at the start of every session.
> It ensures continuity across sessions and prevents regressions.

## MANDATORY: Read Before Doing Anything

Before writing a single line of code, you MUST read these 4 files:

1. **`docs/PROJECT_RULES.md`** — Architecture, tech stack, naming conventions, protected zones, deploy process. These are constraints — do not violate them.
2. **`docs/CURRENT_STATE.md`** — What works, what's deployed, which modules are real vs mock, integration status, priority queue.
3. **`docs/FIX_LOG.md`** — Every fix ever made. Read this to avoid re-introducing old bugs or repeating failed approaches.
4. **`docs/OPEN_ISSUES.md`** — Active issues sorted by severity. Check if your task relates to an existing issue before starting.

## After Every Change

- If you fixed a bug → add entry to `docs/FIX_LOG.md`
- If you changed module status (mock → real) → update `docs/CURRENT_STATE.md`
- If you resolved an issue → remove from `docs/OPEN_ISSUES.md`
- If you found a new issue → add to `docs/OPEN_ISSUES.md`
- If you changed architecture or rules → update `docs/PROJECT_RULES.md` (with approval)

## Project Overview

**Sivan Management** is a Property Management System (PMS) for short-term rentals in Greece, built as a monorepo:

| Service | Stack | URL |
|---------|-------|-----|
| API | Express + Prisma + PostgreSQL + Redis | api.sivanmanagment.com |
| Admin | React + Vite + Tailwind + shadcn/ui | admin.sivanmanagment.com |
| Client (Owner Portal) | React + Vite + Tailwind + shadcn/ui | client.sivanmanagment.com |

**Owner**: Sivan Menahem — Hebrew speaker, manages rental properties in Crete, Greece.
**Language**: All code in English. UI supports 6 languages (en, he, es, fr, de, ru). Hebrew triggers RTL.
**Design**: Sivan Obsidian — dark theme, #030303 primary, #6b38d4 accent, Manrope/Inter fonts.

## Critical Reminders

- **NEVER** hardcode secrets in source code. GitHub Push Protection will reject the push.
- **NEVER** commit `.env` to git.
- **NEVER** use `prisma db push --accept-data-loss` in production (this is a known open issue #1).
- **ALWAYS** build all 3 packages before pushing: `pnpm build`
- **ALWAYS** check `railway service status --all` after deploy.
- The `start` script in `apps/api/package.json` currently uses `db push` — this needs to be fixed (OPEN_ISSUES #1).
- 17 out of 45 API modules are MOCK (return fake data). Check CURRENT_STATE.md before assuming a module works.
- The WhatsApp notification code exists in `stripe.service.ts` but the actual WhatsApp sending service is mock — messages don't actually send yet.

## Quick Commands

```bash
pnpm install          # Install deps
pnpm dev              # Start all services locally
pnpm build            # Build all (must pass before push)
pnpm db:migrate       # Create migration
pnpm db:seed          # Seed database

# Railway (requires RAILWAY_TOKEN env var)
railway service status --all
railway logs --service api
railway redeploy --service api --yes
```
