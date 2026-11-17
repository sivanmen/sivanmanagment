# Content Studio — Writing Articles / מדריך כתיבת מאמרים

URL: **https://sivanmanagment.com/admin/** (after launch; locally `http://localhost:4321/admin/`)

---

## עברית

### כניסה
1. גלשו ל־`/admin/` ובחרו **Sign in with GitHub**.
2. בפעם הראשונה: צרו ב־GitHub *Personal Access Token* (Settings → Developer settings → Fine-grained tokens) עם הרשאת **Contents: Read and write** לריפו `sivanmen/sivanmanagment`, והדביקו אותו במסך הכניסה. הטוקן נשמר רק בדפדפן שלכם.

### כתיבת מאמר חדש
1. **Insights & Articles → New Article**.
2. כתבו קודם באנגלית (שפת המקור): כותרת, תקציר (משמש גם כתיאור לגוגל), תאריך, קטגוריה, תמונה וגוף המאמר.
3. **Translation key** — אותו ערך בכל השפות (למשל שם המאמר באנגלית באותיות קטנות עם מקפים). זה מה שמקשר בין גרסאות השפה.
4. **תמונה:** כתבו אחד המפתחות המובנים (`villa-pool`, `chania` וכו') או העלו תמונה בשדה *Upload a cover*.
5. עברו בין לשוניות השפה (HE, EL, FR, DE, NL, RU, 中文) ותרגמו. אפשר להשאיר שפה ריקה — היא פשוט לא תתפרסם בשפה הזו.
6. **Draft** = טיוטה שלא מופיעה באתר. כשמוכן — כבו Draft ולחצו **Save / Publish**.
7. כל שמירה יוצרת commit בגיטהאב, והאתר נבנה מחדש ומתעדכן תוך כמה דקות.

### כללים (חובה)
- לא להמציא מספרים, לקוחות, המלצות, תשואות או "הבטחות הכנסה".
- נושאי מס/חוק — לכתוב כללי ולהפנות ליועץ (האתר מוסיף הסתייגות אוטומטית).
- תמונות: רק תמונות שלכם/ברישיון. תמונת AI לא תוצג כנכס שאנחנו מנהלים.
- קישורים פנימיים בשפה אחרת כוללים את קידומת השפה: `/he/contact/`.

---

## English

1. Open `/admin/` → **Sign in with GitHub** (fine-grained PAT with *Contents: read & write* on `sivanmen/sivanmanagment`, or OAuth once configured).
2. **New Article** → write the English version first: title (5–140 chars), summary (20–300), date, category, cover, body.
3. Keep the same **Translation key** in all languages.
4. Use the language tabs to add translations. Untranslated languages simply don't get the article.
5. Untick **Draft** and save. Each save commits to `main`; the deploy pipeline rebuilds the site.

### Where files go
- Articles: `apps/web/src/content/insights/<locale>/<slug>.md`
- Uploaded images: `apps/web/public/uploads/`
- Schema (what fields are valid): `apps/web/src/content.config.ts` — a bad field fails the build, so the live site is never broken by a typo.

### Optional: OAuth login instead of tokens
Deploy the Sveltia CMS Authenticator (Cloudflare Worker) and add `base_url: https://<worker>` under
`backend:` in `apps/web/public/admin/config.yml`. See the Sveltia CMS documentation.

### Article ideas (SEO clusters, not yet written)
- Short-term vs long-term renting in Crete: how to decide
- What a property-management fee should include
- Preparing a villa for the season: a 30-day plan
- Buying property in Crete as a foreigner: the operational side after purchase
- Chania neighbourhoods for holiday rentals (location guide)
