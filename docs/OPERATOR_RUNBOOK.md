# Operator Runbook — Sivan Management PMS

> Step-by-step instructions for Sivan (or any operator) to **deploy** the
> recently-committed batches, **rotate secrets**, and **enable** the new
> integrations. Designed to take ~15 minutes.

---

## 0. Why this exists

The code in `main` is ahead of what's running on Railway. The git history
shows four commits not yet live (`192be9c`, `75f4419`, `f6c04b8`,
`6011908`). The Railway auto-deploy from GitHub is currently inactive —
the API container has been up for ~5 days without a restart. This
runbook closes that gap.

---

## 1. Verify current state (1 min)

```bash
# Local check: confirm commits are present
git log --oneline -5

# Live check: confirm the deploy is still on the old code
curl -s -o /dev/null -w "%{http_code}\n" https://api.sivanmanagment.com/api/v1/payments/company-info
# If you see 200 → old code still live. If 401 → new code is live.

curl -s https://api.sivanmanagment.com/api/v1/status | head -c 200
# If you see HTML "Cannot GET" → old code still live.
# If you see JSON with `overall` and `checks` → new code is live.
```

---

## 2. Trigger the deploy (3 min)

Pick **one** option:

### Option A — Railway Dashboard (recommended, no CLI)

1. Open https://railway.com/dashboard
2. Open project **Property Management System**
3. Click service **api** → click **Deployments** tab → click **Redeploy** on the latest commit
4. Repeat for services **admin** and **client**
5. Wait ~2 minutes per service for build + boot

### Option B — Railway CLI (requires fresh token)

```bash
# Get a fresh token from https://railway.com/account/tokens
export RAILWAY_TOKEN="<your-fresh-token>"
railway redeploy --service api --yes
railway redeploy --service admin --yes
railway redeploy --service client --yes
```

### Option C — Fix auto-deploy permanently (GitHub Actions, recommended)

A workflow at `.github/workflows/deploy-railway.yml` is now in place. It
runs after every push to main and redeploys api/admin/client via the
Railway CLI. To enable it:

1. Generate a Railway token at https://railway.com/account/tokens
2. GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**
3. Name: `RAILWAY_TOKEN`, Value: (paste the token)
4. Push any commit to main — Actions tab shows the deploy run live.
5. (Optional) Disable Railway's built-in GitHub auto-deploy in service Settings → Source so you don't get duplicate deploys.

### Option D — Fix Railway native auto-deploy

1. Railway dashboard → service **api** → **Settings** → **Source**
2. Ensure the GitHub repo is linked and **Auto-Deploy from main** is **on**
3. Repeat for **admin** and **client**
4. Push a tiny commit to verify it auto-deploys

---

## 3. Rotate production secrets (5 min, **CRITICAL**)

The new `config/index.ts` will **refuse to boot** if `JWT_SECRET`,
`JWT_REFRESH_SECRET`, or `ENCRYPTION_KEY` are missing or equal to the dev
defaults. Make sure they're set to real random values **before** the new
container boots.

### From Railway Dashboard:

1. Service **api** → **Variables** tab
2. Set three new variables (paste-replace if they exist):

```bash
# Generate three fresh secrets locally:
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
```

3. Paste each into Railway variables UI.
4. Confirm the deploy succeeds — Railway will auto-redeploy on each var change.

### Via CLI:

```bash
railway variables --set "JWT_SECRET=$(openssl rand -hex 32)" --service api
railway variables --set "JWT_REFRESH_SECRET=$(openssl rand -hex 32)" --service api
railway variables --set "ENCRYPTION_KEY=$(openssl rand -hex 32)" --service api
```

**⚠️ Effect:** All existing JWTs become invalid. All logged-in users
(including you) will be redirected to login. This is intentional.

---

## 4. Enable new integrations (optional, ~5 min)

Each of these is **optional**. Without them, the corresponding feature
returns a clear `503 / skipped` instead of failing silently.

| Variable(s) | Enables | Where to get |
|-------------|---------|--------------|
| `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` | Booking confirmation emails, payment receipts, owner-statement PDF emails | sendgrid.com → API Keys |
| `EVOLUTION_API_KEY` + `EVOLUTION_API_URL` + `EVOLUTION_DEFAULT_INSTANCE` | Real WhatsApp sending to guest + admin alerts | Your Evolution API instance |
| `R2_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_BUCKET_NAME` + `R2_PUBLIC_URL` | File uploads (property images, documents, receipts) | Cloudflare dashboard → R2 |
| `ANTHROPIC_API_KEY` | Real AI assistant (Claude Sonnet) instead of "not configured" fallback | console.anthropic.com |
| `SENTRY_DSN` | Error monitoring + uncaught exception capture | sentry.io → project settings |
| `AADE_USER` + `AADE_SUBSCRIPTION_KEY` + `AADE_BASE_URL` | (Future) Greek e-invoice submission. Currently stub-only | aade.gr/myDATA |

Set them in Railway dashboard or via CLI:

```bash
railway variables --set "SENDGRID_API_KEY=SG...." --service api
railway variables --set "SENDGRID_FROM_EMAIL=noreply@sivanmanagment.com" --service api
# etc.
```

---

## 5. Verify the deploy worked (2 min)

After the api service shows status **SUCCESS** on Railway:

```bash
# 1. Status endpoint should now exist and return JSON
curl -s https://api.sivanmanagment.com/api/v1/status | jq .
# Expected: { "overall": "ok"|"degraded", "checks": { ... } }

# 2. The IBAN leak should now return 401
curl -s -o /dev/null -w "%{http_code}\n" https://api.sivanmanagment.com/api/v1/payments/company-info
# Expected: 401

# 3. JSON 404 instead of HTML
curl -s https://api.sivanmanagment.com/api/v1/does-not-exist | jq .
# Expected: { "success": false, "error": { "code": "NOT_FOUND", ... } }

# 4. Health still green
curl -s https://api.sivanmanagment.com/api/v1/health/deep | jq .

# 5. Sentry boot message in logs
railway logs --service api | grep "Sentry"
# Expected: "[Observability] Sentry initialized (env=production)"
# (only if SENTRY_DSN is set)

# 6. Stripe reconcile job registered
railway logs --service api | grep "Stripe-Reconcile"
# Expected: "[JOB:Stripe-Reconcile] Scheduled (daily 02:00 UTC)"
```

---

## 6. Test the booking → email → WhatsApp loop (5 min)

```bash
# 1. Open admin.sivanmanagment.com, log in
# 2. Create a test property + unit (€120/night)
# 3. Open the booking engine, search for the property
# 4. Book as a test guest (use your own email)
# 5. Pay with Stripe test card 4242 4242 4242 4242
# 6. Within ~30s, the test guest email should receive:
#    a. Booking confirmation (HE or EN based on guest name)
#    b. Payment receipt
# 7. Within ~30s, your admin WhatsApp should receive a payment alert
# 8. Admin booking list shows status=CONFIRMED, paymentStatus=PAID
# 9. Owner portal (client.sivanmanagment.com) shows the new booking
# 10. From admin reports page, generate Owner Statement PDF for current month
#     — verify the PDF downloads and totals match
```

If any of these fail, check `/api/v1/status` to see which integration is
degraded.

---

## 7. Rollback (if needed)

If the new deploy breaks something critical:

```bash
# Railway dashboard → service api → Deployments → click "Redeploy"
# on commit e70f2c3 (the deploy from 2026-04-13).

# Or via CLI:
git revert 6011908 f6c04b8 75f4419 192be9c
git push origin main
# (auto-deploy will then run the reverted code)
```

The four new commits are independent enough that you can also revert
just the security batch (192be9c) and keep the rest, etc.

---

## 8. Ongoing operator tasks

| When | What | How |
|------|------|-----|
| Daily | Check `/api/v1/status` — all green? | `curl -s https://api.sivanmanagment.com/api/v1/status \| jq .overall` |
| Daily | Stripe reconcile job ran without errors? | `railway logs --service api \| grep "Stripe-Reconcile"` |
| Weekly | Postgres backup verified | Railway dashboard → Postgres → Backups |
| Monthly | Owner statement PDFs sent to all owners | Trigger via admin Reports page |
| Quarterly | Rotate secrets again | Repeat section 3 |

---

*Last updated: 2026-05-25.*
*If something is unclear, check `docs/FIX_LOG.md` for the change history
or `docs/PROJECT_RULES.md` for architectural constraints.*
