# Website Deployment — JetServer cPanel

**Host:** JetServer shared hosting (`israel69.jetserver.net`), LiteSpeed + PHP 8.3.
**Site folder:** `/home/<cpanel-user>/sivanmanagment.com` (addon domain; canonical `https://sivanmanagment.com`, no www).
**What is deployed:** the contents of `apps/web/dist/`: static HTML/CSS/JS/images, `.htaccess`, and one PHP file (`api/lead/index.php`).

> This cloud workspace cannot reach cPanel/FTP/SSH (ports 2083/21/22 refused, 17 Nov 2026), so
> deployment goes through GitHub Actions. No cPanel password is ever needed by Claude.

---

## 1. Build the package

```bash
pnpm install
pnpm --filter web build          # → apps/web/dist (SITE_URL defaults to https://sivanmanagment.com)
pnpm --filter web package        # → apps/web/release/sivanmanagment-website.zip (includes .htaccess)
```

## 2. First go-live (manual, ~10 minutes in cPanel File Manager)

**א. גיבוי / Backup**
1. File Manager → select the folder **`sivanmanagment.com`** → **Compress** → Zip → name `sivanmanagment-wp-backup.zip` (created in the home folder). Download it to your computer.
2. (Optional) phpMyAdmin → the WordPress database → Export → Quick → SQL. Download it.

**ב. הזזת וורדפרס הצידה / Move WordPress aside** (keep it, don't delete yet)
1. In the home folder create a folder **`sivanmanagment-wp-old`**.
2. Open `sivanmanagment.com`, enable *Show Hidden Files* (Settings, top-right), **select everything except `.well-known`** → **Move** → `/sivanmanagment-wp-old`.
   (`.well-known` must stay: AutoSSL uses it for the HTTPS certificate.)

**ג. העלאת האתר / Upload the new site**
1. Inside the now-empty `sivanmanagment.com` → **Upload** → `sivanmanagment-website.zip`.
2. Right-click the zip → **Extract** → into `/sivanmanagment.com` → then delete the zip.
3. Check that `sivanmanagment.com/.htaccess`, `index.html`, `api/lead/index.php` and `sivan-web-root.txt` exist.

**ד. בדיקה / Test**
- https://sivanmanagment.com/ , /he/ , /zh-cn/ , /services/ , /contact/
- Send a test request through the form → an e-mail must reach **support@sivanmanagment.com** (check spam the first time).
- If the e-mail lands in spam: cPanel → **Email Deliverability** → repair SPF/DKIM for `sivanmanagment.com`.

**Rollback:** move the new files out and move the contents of `sivanmanagment-wp-old` back.
After ~2 weeks without problems, delete `sivanmanagment-wp-old` and the WordPress database.

## 3. Automatic deployment from GitHub (live fixes, CMS articles)

Workflow: `.github/workflows/deploy-web-cpanel.yml`. It runs on every push to `main` that touches
`apps/web/**` (code changes *and* articles published from `/admin/`), builds the site and mirrors
`dist/` to the server over **FTPS**. It never touches `.well-known`, `cgi-bin`, `.user.ini` or
anything outside the site folder, and it refuses to run unless the remote folder already contains
`sivan-web-root.txt` (from the manual upload in §2), so a wrong path can never wipe another site.

**One-time setup:**
1. cPanel → **FTP Accounts** → create e.g. `deploy@sivanmanagment.com`, *Directory* = `sivanmanagment.com` (the account is then jailed to that folder only), strong password.
2. GitHub → repo `sivanmen/sivanmanagment` → Settings → Secrets and variables → Actions → **New repository secret**:
   - `WEB_FTP_HOST` = `israel69.jetserver.net`
   - `WEB_FTP_USER` = `deploy@sivanmanagment.com`
   - `WEB_FTP_PASSWORD` = the password
   - (optional) `WEB_FTP_DIR` if the FTP account's root is not the site folder
3. GitHub → Actions → *Deploy website (cPanel)* → **Run workflow** once to verify (it ends with a smoke check of 5 pages + the form endpoint).

If JetServer's firewall blocks GitHub's IPs for FTP, ask JetServer support to allow FTPS for that
account, or fall back to the manual ZIP (§1–2).

## 3b. Remote maintenance over HTTPS (sm-deploy.php)
Because cPanel/FTP/SSH are not reachable from Claude's cloud workspace, `public/sm-deploy.php` (shipped with
every build) allows deployment and fixes over HTTPS. It requires `DEPLOY_TOKEN` (≥ 40 random chars) in
`~/sivanmanagment-config.php`; without the exact token it answers 404 and locks out an IP after 5 failures.
Actions: `status`, `clean` (moves everything that is not part of the current build to `~/sivanmanagment-wp-old-<ts>/`),
`deploy` (chunked upload, SHA-256 verified, previous site kept in `~/sivanmanagment-site-prev-<ts>/`, last 3 kept),
`put`/`get` single files, `rollback`, `purge_backups`. Client: `SM_DEPLOY_TOKEN=… node apps/web/scripts/remote.mjs <command>`.
All actions are logged to `~/sivanmanagment-deploy.log`. To revoke access, delete the token line from the config file.

## 4. Lead delivery & server-side settings

By default every form submission is:
1. **e-mailed** to `support@sivanmanagment.com` (From: `website@sivanmanagment.com`, Reply-To: the owner who wrote), and
2. appended to **`~/sivanmanagment-leads.jsonl`** (home folder, *outside* the web root, mode 600) as a backup.

To change addresses or add Airtable / n8n, copy `apps/web/server-config.example.php` to
**`/home/<cpanel-user>/sivanmanagment-config.php`** (one level above the site folder, never inside it)
and fill in the keys. Nothing secret is stored in the repository or in the web root.

### Lead e-mail format
- `public/api/lead/mailer.php` builds a branded HTML + plain-text e-mail (RTL Hebrew by default; set
  `'LEAD_EMAIL_LANG' => 'en'` in the private config for English). Option/service names come from
  `public/api/lead/labels.php`, generated from the i18n JSON by `scripts/gen-lead-labels.mjs` on every build.
- Delivery to `support@` is local to the cPanel server (see OPEN_ISSUES W4 for the missing MX/SPF/DKIM).

### Spam protection — Google reCAPTCHA v3
- Public site key: `apps/web/src/lib/integrations.ts`. The key (Google Cloud → Security → reCAPTCHA) must list
  `sivanmanagment.com` and `www.sivanmanagment.com` in its domain list.
- Secret key: **only** in `~/sivanmanagment-config.php` as `'RECAPTCHA_SECRET'` (optional `'RECAPTCHA_MIN_SCORE'`, default 0.5).
  Without it, server-side verification is off and the form works as before.
- Privacy: the Google script loads only after the visitor starts using the form (no Google request on any page load);
  the form shows Google's required notice and the badge is hidden. Disclosed in the privacy and cookie policies.
- Server behaviour (`public/api/lead/index.php`): no token → HTTP 400 (visitor is told to contact us directly);
  invalid token / wrong action / low score → answered "ok" but not delivered; Google unreachable or secret
  misconfigured → lead delivered (fail open). Every rejected submission is kept in `~/sivanmanagment-leads-spam.jsonl` (mode 600).

### Airtable schema (optional)
Base "Sivan Management — Website Leads", table **`Leads`** (names must match; `typecast` is on):
Name (text, primary) · Email · Phone · Preferred Contact · Property Type · Units (number) · Location ·
Area · Current Status · Services (long text) · Goals (long text) · Locale · Source (long text) ·
Consent (checkbox) · Consent At (date-time) · Status (single select: New, Contacted, Assessment
booked, Proposal sent, Won, Lost). Token scope: `data.records:write` on this base only.

## 5. What `.htaccess` does
HTTPS + no-www redirect · custom 404 · trailing-slash redirect for page URLs · `410 Gone` for old
WordPress endpoints (`wp-admin`, `wp-login.php`, `xmlrpc.php`, `wp-json`) · blocks dotfiles/logs/markdown ·
long-term caching for fingerprinted assets · security headers · compression.

## 6. After go-live
- Google Search Console: add `https://sivanmanagment.com`, submit `/sitemap-index.xml`. Same in Bing Webmaster Tools.
- Change the WordPress admin password before moving WP aside (or simply delete WP after the 2-week safety period).
- Local test of a build including the PHP form: `php -S 127.0.0.1:4500 -t apps/web/dist` (create a `sivanmanagment-config.php` one level above the served folder with `'ALLOWED_ORIGINS' => ['http://127.0.0.1:4500']`).
