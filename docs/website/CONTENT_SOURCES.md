# Content & Media Sources

> Owner's instruction (16 Nov 2026): "use the photos and materials on my computer, and our
> online image-library skill — document this so we always have it."

## 1. Owner's own media (Mac) — preferred source
Location on Sivan's Mac: `~/Documents/SivanInvest/`

| Folder | Size | Items | Use on the website |
|---|---|---|---|
| `תמונות פורטרט סיון` (Sivan portraits) | 110 MB | 64 | Founder portrait on `/our-team/` (4:5) and About page |
| `תמונות כריתים` (Crete photos) | 1.16 GB | 196 | Hero, location pages, article covers — **real photos beat AI images** |
| `וידאו כריתים` (Crete videos) | 6.85 GB | 43 | Hero background loop (16:9 + 9:16), service sections |

**How Claude can access them:** this cloud workspace cannot see the Mac directly. In the Claude
desktop app open **Settings → Claude Code → Remote Control** and add the folder
`~/Documents/SivanInvest`, then ask Claude (in a session) to use it. Alternatively upload a
curated selection (e.g. 20 photos, 3 short clips) to Google Drive and share the folder.

**When adding them:**
1. Only photos you own or have rights to; for properties, only with the owner's permission.
2. Export photos at ≤ 2400 px long edge, JPG quality ~85 → put in `apps/web/src/assets/images/`
   and register in `src/lib/images.ts` with `illustrative: false`.
3. Founder portrait → `apps/web/public/team/sivan-menahem.jpg` and set `founderPhoto` in
   `src/pages/[...lang]/our-team/index.astro`.
4. Hero video: 12–20 s, muted, H.264 MP4 + WebM, ≤ 4 MB desktop / ≤ 2 MB mobile, with a poster JPG.
   (Hook-up point: `src/components/home/Hero.astro` — replace the `<Image>` with a `<video>` + poster.)

## 2. Openly licensed photos — Openverse (the "online image library" skill)
The `openverse` skill searches CC-licensed media. Rules used here:
- Filter `license=by,cc0` only (no SA/ND/NC).
- Images come mostly from Wikimedia Commons; download one at a time at the standard 1920 px
  thumbnail size (Wikimedia rate-limits; HTTP 429 means wait).
- Record title/creator/licence/URL; credit on `/legal/image-credits/` (`credit` field in `images.ts`).

Currently used: **Rethymno — Fortezza ramparts**, Jebulon, CC0 1.0 (Wikimedia Commons).
Shortlisted for later (CC BY/CC0): aerial view of Chania's Venetian harbour (dronepicr, CC BY),
Chania mosque & harbour (Jebulon, CC0), Heraklion harbour (Mustang Joe, CC0 — crop carefully),
Elafonisi (Marc Ryckaert, CC BY). Raw search results and credits: `apps/web/src/assets/images/openverse-credits.jsonl`.

## 3. AI-generated imagery — Figma (illustrative only)
Figma file: **"Sivan Management — Website Visual Assets"**
https://www.figma.com/design/iA6mLLrHJ0hmGRQIHK1B78 (team "moon"). Model: gemini-3.1-flash-image.

| Key | Prompt summary | Used for |
|---|---|---|
| `hero-coast` | Sunrise aerial, west Crete coast, modern villas, violet haze | Home hero, asset management, OG image |
| `villa-pool` | Mediterranean villa, infinity pool, golden hour | Short-term rentals, marketing, CTA bands |
| `hospitality` | Boutique hotel reception, stone & oak, pool terrace | Hotels & hospitality |
| `inspection` | Manager (face hidden) inspecting villa terrace with tablet | Maintenance, About |
| `commercial` | Glass & limestone mixed-use building | Commercial |
| `residential` | Bright apartment living room, balcony, sea view | Long-term rentals |
| `chania` | Venetian harbour & lighthouse, blue hour | Chania page |
| `heraklion` | Koules fortress & harbour, morning | Heraklion page |

Figma AI credits ran out after 9 images on 16 Nov (reset 17 Nov 00:00 UTC). Two prompts were not
generated: housekeeping bedroom and office workspace. All prompts in the master brief §13 remain valid.

**Rule:** AI images never represent managed properties or real staff, and are disclosed on the
Image Credits page. Replace them with real photos from §1 whenever possible.

## 4. Video
No video was generated in this round (cost/approval). The hero uses a Ken Burns + parallax still.
Prompts for an 18 s hero film and 8 s hospitality clip are in `MASTER_BRIEF.md` §13; the owner's
43 Crete clips (§1) are the better first choice.
