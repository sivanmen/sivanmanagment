# Website Deployment

## Target
A 4th Railway service, **`web`**, in the existing "Property Management System" project, next to
`api`, `admin` and `client`. Not created yet — requires the owner's Railway access.

### One-time setup (Railway dashboard)
1. **New Service → GitHub repo** `sivanmen/sivanmanagment`, branch `main`.
2. Settings → **Build**: Dockerfile path `apps/web/Dockerfile`, build context = repository root.
3. Settings → **Networking**: generate a domain; the container listens on `PORT` (8080 default).
4. **Variables** (see `apps/web/.env.example`):

| Variable | Required | Value |
|---|---|---|
| `SITE_URL` | yes | `https://sivanmanagment.com` (canonical domain — see LAUNCH_CHECKLIST) |
| `AIRTABLE_TOKEN` | one of these two | Airtable personal access token, scope `data.records:write` on the leads base only |
| `AIRTABLE_BASE_ID` | with token | `app…` of the leads base |
| `AIRTABLE_TABLE` | no | default `Leads` |
| `LEAD_WEBHOOK_URL` | one of these two | e.g. an n8n webhook that emails/WhatsApps the team and writes to the CRM |
| `EXTRA_ALLOWED_ORIGIN` | no | the Railway preview URL while testing |

5. Health check: `GET /` returns 200.
6. Add a step to `.github/workflows/deploy-railway.yml` **after** the service exists:
   ```yaml
   - name: Redeploy web
     run: railway redeploy --service web --yes
     env:
       RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
   ```
   (Not added yet: the step would fail while the service doesn't exist.)

> `SITE_URL` is read at **build** time (canonical/hreflang/sitemap). Set it before the first build.

## DNS cut-over (from WordPress)
1. Test on the Railway domain first (forms, all 8 languages, `/admin/`).
2. Lower the TTL of `sivanmanagment.com` and `www` 24 h in advance.
3. Point `@` / `www` to Railway (custom domain → CNAME/ALIAS as Railway instructs). Keep `api.`, `admin.`, `client.` unchanged.
4. Optionally move WordPress to `old.sivanmanagment.com` for reference, then retire it.
5. Submit `https://sivanmanagment.com/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools.

Old WordPress URLs (`/about-us/`, `/contact/`) map to the same paths on the new site. Demo-only
URLs (`/home-2/`, `/marketing-solutions/…`) can 404; there is nothing to preserve.

## Lead delivery — Airtable schema
Create a base **"Sivan Management — Website Leads"** with a table **`Leads`** whose field
names match exactly (the endpoint sends these keys with `typecast: true`):

| Field | Type |
|---|---|
| Name | Single line text (primary) |
| Email | Email |
| Phone | Phone |
| Preferred Contact | Single select: email, phone, whatsapp |
| Property Type | Single select: short-term, long-term, commercial, hospitality, not-sure |
| Units | Number |
| Location | Single select: chania, rethymno, heraklion, other |
| Area | Single line text |
| Current Status | Single select: rented, vacant, renovation, managed |
| Services | Long text (comma-separated slugs) |
| Goals | Long text |
| Locale | Single select: en, he, el, fr, de, nl, ru, zh-cn |
| Source | Long text (JSON: page, referrer, UTM) |
| Consent | Checkbox |
| Consent At | Date/time |
| Status | Single select: New, Contacted, Assessment booked, Proposal sent, Won, Lost |

Add an Airtable automation "When record created → send email to support@sivanmanagment.com".
(The Airtable connector used during the build lacked workspace permissions, so the base was not
created automatically.)

## Local production test
```bash
pnpm build:web
PORT=4400 HOST=127.0.0.1 node apps/web/dist/server/entry.mjs
curl -X POST http://127.0.0.1:4400/api/lead/ -H 'content-type: application/json' -d '{}'   # → 422
```
