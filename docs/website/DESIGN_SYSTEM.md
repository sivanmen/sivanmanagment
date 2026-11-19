# Website Design System

Derived from the **VamTam Numérique** template that the owner liked (values read from the live
Elementor kit CSS, `post-7.css`, and `--vamtam-*` variables on 16 Nov 2026), then elevated with a
layered "glass + aurora" treatment for a premium, high-tech feel.

## Tokens (`src/styles/global.css`)

| Token | Value | Source / use |
|---|---|---|
| `--violet` | `#6754E9` | Template accent_1 — CTAs, links, active states |
| `--lavender` | `#B0A7EF` | Template global colour — accents on dark |
| `--lilac` | `#E9E5FF` | Template accent_4 — tinted sections, chips, icon badges |
| `--paper` | `#F7F7FA` | Template accent_2 — page background |
| `--ink` / `--night` | `#0C0B14` / `#120F24` | Template black, warmed toward violet — dark sections |
| `--line` | `#E2E2E2` | Template accent_7 — borders |
| `--gold` | `#FFBE11` | Template accent_8 — used sparingly (office pin, "illustrative" tag) |
| `--radius` | `18px` | Template button/input radius; cards use 28px, feature panels 40px |

## Typography
| Role | Latin | Hebrew | Greek / Russian | Chinese |
|---|---|---|---|---|
| Display | Inter Tight (variable) | Heebo | Inter Tight | Inter Tight + PingFang / YaHei |
| Body | Kanit 300 | Heebo 350 | Inter Tight 350 | PingFang SC / Microsoft YaHei |
| Labels (uppercase eyebrow) | Syne 700 | Heebo | Inter Tight | Inter Tight |

Inter Tight, Kanit and Syne are the template's own fonts. All fonts are **self-hosted** via
`@fontsource` (no requests to Google).

## Motion (`src/lib/motion.ts`)
- `data-reveal` (fade / rise / scale on enter) · `data-split` (word-by-word headline reveal)
- `data-parallax="0.1"` (scroll parallax) · `data-progress` (sets `--p` 0→1: timeline rail, statement highlight)
- `data-tilt` (3D tilt + light sheen on cards, fine pointers only)
- CSS: Ken Burns hero, drifting aurora orbs, film grain, marquee, map pin pulses.
- **Everything is disabled under `prefers-reduced-motion`.**

## Signature sections
Cinematic hero · scroll-lit statement · sticky A–Z timeline · owner-portal dashboard (illustrative) ·
Crete map with pins · services mega-menu · 4-step assessment form · glass header that hides on scroll.

## Rules
- Alternate light (`paper`/`white`/`lilac`) and dark (`night`/`ink`) sections; never two violet-heavy sections in a row.
- Use logical CSS properties (`inset-inline-*`, `margin-inline-*`) so Hebrew mirrors automatically.
- Imagery: real or clearly illustrative; never present AI imagery as a managed property or real person.
