import type { ImageMetadata } from 'astro';
import heroCoast from '~/assets/images/hero-coast.jpg';
import villaPool from '~/assets/images/villa-pool.jpg';
import hospitality from '~/assets/images/hospitality.jpg';
import inspection from '~/assets/images/inspection.jpg';
import commercial from '~/assets/images/commercial.jpg';
import residential from '~/assets/images/residential.jpg';
import chania from '~/assets/images/chania-harbour-photo.jpg';
import chaniaAi from '~/assets/images/chania.jpg';
import chaniaStreet from '~/assets/images/chania-street-photo.jpg';
import chaniaLighthouse from '~/assets/images/chania-lighthouse-photo.jpg';
import onsiteFounder from '~/assets/images/onsite-founder.jpg';
import onsiteWorks from '~/assets/images/onsite-works.jpg';
import founder from '~/assets/images/founder-sivan-menahem.jpg';
import founderVilla from '~/assets/images/founder-villa.jpg';
import founderEvening from '~/assets/images/founder-evening.jpg';
import rethymno from '~/assets/images/rethymno-photo.jpg';
import heraklion from '~/assets/images/heraklion.jpg';
import type { LocationSlug, ServiceSlug } from './company';

export interface SiteImage {
  src: ImageMetadata;
  /** English alt text (decorative context; translated pages reuse it with lang="en" fallback avoided by short, neutral wording) */
  alt: string;
  /** true = AI-generated illustration, false = documentary photo */
  illustrative: boolean;
  /** Where the file came from (see docs/website/MEDIA_LIBRARY.md) */
  source?: string;
  credit?: { author: string; license: string; url: string };
}

export const IMAGES = {
  'hero-coast': { src: heroCoast, alt: 'Aerial view of the Cretan coastline with villas at sunrise', illustrative: true },
  'villa-pool': { src: villaPool, alt: 'Mediterranean villa with an infinity pool at golden hour', illustrative: true },
  hospitality: { src: hospitality, alt: 'Boutique hotel reception opening onto a pool terrace', illustrative: true },
  inspection: { src: inspection, alt: 'Property manager inspecting a villa terrace with a tablet', illustrative: true },
  commercial: { src: commercial, alt: 'Modern mixed-use commercial building with a limestone facade', illustrative: true },
  residential: { src: residential, alt: 'Bright apartment living room with a balcony and sea view', illustrative: true },
  chania: { src: chania, alt: 'The Venetian harbour of Chania at dusk', illustrative: false, source: 'owner-library: chania-after-sunset (licensed stock, Photos/כללי)' },
  'chania-ai': { src: chaniaAi, alt: 'The Venetian harbour of Chania and its lighthouse at blue hour', illustrative: true },
  'chania-street': { src: chaniaStreet, alt: 'A quiet street in the old town of Chania with bougainvillea', illustrative: false, source: 'owner-library: cosy-street-of-chania (licensed stock)' },
  'chania-lighthouse': { src: chaniaLighthouse, alt: 'The Venetian lighthouse of Chania at sunset', illustrative: false, source: 'owner-library: lighthouse-of-chania (licensed stock)' },
  'onsite-founder': { src: onsiteFounder, alt: 'Sivan Menahem on site during access-road works in Crete', illustrative: false, source: 'owner photo: Drive / Accesses Road / IMG_1113' },
  'onsite-works': { src: onsiteWorks, alt: 'Excavator preparing an access road on a sea-view plot in Crete', illustrative: false, source: 'owner photo: Drive / Accesses Road / IMG_1103' },
  'founder-villa': { src: founderVilla, alt: 'Sivan Menahem on the terrace of a villa overlooking the sea in Crete', illustrative: false, source: 'owner-supplied portrait (chat, 18 Nov 2026)' },
  'founder-evening': { src: founderEvening, alt: 'Sivan Menahem, founder of Sivan Management', illustrative: false, source: 'owner-supplied portrait (chat, 18 Nov 2026)' },
  founder: { src: founder, alt: 'Sivan Menahem, founder of Sivan Management', illustrative: false, source: 'owner-supplied portrait (chat, 18 Nov 2026)' },
  rethymno: {
    src: rethymno,
    alt: 'The ramparts of the Fortezza in Rethymno',
    illustrative: false,
    credit: { author: 'Jebulon', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Fortezza_Rethymno_remparts.jpg' },
  },
  heraklion: { src: heraklion, alt: 'The Venetian Koules fortress at the entrance to Heraklion harbour', illustrative: true },
} satisfies Record<string, SiteImage>;

/** Background videos (public/media). Muted, looped, decorative; posters shown when motion is reduced. */
export const VIDEOS = {
  heroChania: { src: '/media/hero-chania-1080.mp4', srcSmall: '/media/hero-chania-720.mp4', poster: '/media/hero-chania-1080-poster.webp', illustrative: false, source: 'owner-library: aerial-view-of-chania-old-venetian-port (licensed stock)' },
  chaniaLighthouse: { src: '/media/chania-lighthouse-1080.mp4', poster: '/media/chania-lighthouse-1080-poster.webp', illustrative: false, source: 'owner-library: aerial-view-of-chania (licensed stock)' },
  villaOrbit: { src: '/media/villa-orbit-720.mp4', poster: '/media/villa-orbit-720-poster.webp', illustrative: true, source: 'owner-library: Luxury_Cliffside_Villas_Drone_Orbit (AI-generated)' },
} as const;
export type VideoKey = keyof typeof VIDEOS;

export type ImageKey = keyof typeof IMAGES;

export const SERVICE_IMAGE: Record<ServiceSlug, ImageKey> = {
  'short-term-rental-management': 'villa-pool',
  'long-term-rental-management': 'residential',
  'commercial-property-management': 'commercial',
  'hotel-hospitality-management': 'hospitality',
  'property-maintenance': 'onsite-works',
  'asset-management': 'hero-coast',
  'property-marketing-sales': 'villa-pool',
};

export const LOCATION_IMAGE: Record<LocationSlug, ImageKey> = {
  chania: 'chania',
  rethymno: 'rethymno',
  heraklion: 'heraklion',
};

export function img(key: string): SiteImage {
  return (IMAGES as Record<string, SiteImage>)[key] ?? IMAGES['hero-coast'];
}
