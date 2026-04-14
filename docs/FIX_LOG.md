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

*Last updated: 2026-04-14*
*Total fixes logged: 9*
