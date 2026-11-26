# Media Library — owner's Google Drive (catalogued 18 Nov 2026)

> Source of truth for photos and videos available to the website. File IDs are deliberately
> **not** stored here (this repository is public). Find files by folder + file name in Drive.
> To re-catalogue: list the folders, build contact sheets, pick, then optimise
> (`sharp` for images, `ffmpeg` for video) into `apps/web/src/assets/images/` or `apps/web/public/media/`.

## Folders shared by the owner

| Drive folder | Content | Count | Use on the website |
|---|---|---|---|
| **תמונות** (Photos) / root | Licensed stock photos (Chania old port, lighthouse, alleys; Agios Nikolaos; **also Palermo/Sicily/Spain — not Crete, do not use**), Gemini AI concept images, owner iPhone photos | ~108 | Real Chania photos used (see below) |
| תמונות / **וידאו תדמית כריתים** | Brand video: stock 4K drone (Chania Venetian port ×12, lighthouse, promenade, Balos, Elafonisi, Spinalonga, Bali village), AI clips (Luxury_Cliffside_Villas_Drone_Orbit, Venetian_Harbor_Dusk, Chania_Street_Scene, King Solomon villas), business-meeting stock | 69 | Hero + Chania + short-term-rental videos |
| תמונות / **כללי** | More stock photos (Chania, Agios Nikolaos, some Sicily/Italy), Gemini AI images, personal photos | 60 | Chania street & lighthouse photos |
| תמונות / **תמונות סיון** | Personal photos of Sivan (HEIC/JPG) | 215 | Not used (personal); candidates for future "About" |
| תמונות / **City Center תמונות** (+ פרויקט בניין חאניה) | City Center building and Chania building project | 92 | Not used yet — SivanInvest projects; use only if presented as such |
| תמונות / הרקליון | Heraklion street + selfies | 8 | Not used (selfies) |
| תמונות / אגיוס, סיסי, Voulisma, פלקה ואי המצורעים | East-Crete locations (Agios Nikolaos, Sissi, Voulisma beach, Plaka, Spinalonga) | 76 | Future: articles / "elsewhere in Crete" |
| **Accesses Road** | Owner's documentation of access-road works on a sea-view plot (excavator, trucks, finished road; Sivan on site) | 55 | Maintenance page hero, About page (real supervision) |
| **תמונות סיון אישי AI** | 37 AI-assisted studio portraits of the founder (navy/grey suits, dark interiors) | 37 | Founder portrait on /our-team/ |
| וידאו אוירה כריתים, חאניה ועוד | (folder is in Drive **Trash**) | 2 | Not used |

## In use on the site

| Site asset | From (folder / file) | Type | Notes |
|---|---|---|---|
| `public/media/hero-chania-1080.mp4` + `-720.mp4` + poster | וידאו תדמית כריתים / aerial-view-of-chania-old-venetian-port…21-02-57-utc.mov | Stock 4K drone → 7 s loop, 1080p 4.8 MB / 720p 1.7 MB | Home hero |
| `public/media/chania-lighthouse-1080.mp4` + poster | …aerial-view-of-chania…21-13-03-utc.mov | Stock drone → 9 s, 3.8 MB | Chania page hero |
| `public/media/villa-orbit-720.mp4` + poster | Luxury_Cliffside_Villas_Drone_Orbit.mp4 | **AI-generated** → 8 s, 0.9 MB | Short-term rental page hero (illustrative) |
| `assets/images/chania-harbour-photo.jpg` | Photos / chania-after-sunset-2025-03-09…jpg | Stock photo | Chania location card + page |
| `assets/images/chania-street-photo.jpg` | Photos / cosy-street-of-chania-crete-greece-2024-10-19…jpg | Stock photo | About page hero |
| `assets/images/chania-lighthouse-photo.jpg` | כללי / lighthouse-of-chania-crete-greece-2024-10-19…jpg | Stock photo | Home hero poster / fallback |
| `assets/images/onsite-works.jpg` | Accesses Road / IMG_1103.JPG | Owner photo | Maintenance service image |
| `assets/images/onsite-founder.jpg` | Accesses Road / IMG_1113.JPG | Owner photo (Sivan on site) | About page |
| `assets/images/founder-sivan-menahem.jpg` | תמונות סיון אישי AI / hf_20260726_015315_d9b1… | AI-assisted portrait of the real founder | Team page |

AI images generated for the site itself (Figma) are listed in CONTENT_SOURCES.md §3.

## Licensing — must verify before launch
- Files named `…-2023-11-27-05-16-20-utc.*` / `…-utc.jpg` follow **Envato Elements** naming. Envato licences are per project: register **sivanmanagment.com** as the project for each item used (Envato → Downloads → License). [TO VERIFY]
- Gemini/Higgsfield/Flow AI outputs: confirm the tool's commercial-use terms for the account used.
- Do not use the Palermo/Sicily/Spain/Castellammare photos for Crete pages.
- Photos showing other people (Heraklion streets, business-meeting stock) need model releases for advertising — avoid unless licensed.

## Privacy note
Several shared folders are viewable by **anyone with the link** (the embedded folder view works without login), including 215 personal photos. Consider restricting `תמונות סיון` and `Accesses Road` to specific people.
