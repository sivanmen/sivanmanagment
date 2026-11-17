import type { ImageMetadata } from 'astro';
import heroCoast from '~/assets/images/hero-coast.jpg';
import villaPool from '~/assets/images/villa-pool.jpg';
import hospitality from '~/assets/images/hospitality.jpg';
import inspection from '~/assets/images/inspection.jpg';
import commercial from '~/assets/images/commercial.jpg';
import residential from '~/assets/images/residential.jpg';
import chania from '~/assets/images/chania.jpg';
import rethymno from '~/assets/images/rethymno-photo.jpg';
import heraklion from '~/assets/images/heraklion.jpg';
import type { LocationSlug, ServiceSlug } from './company';

export interface SiteImage {
  src: ImageMetadata;
  /** English alt text (decorative context; translated pages reuse it with lang="en" fallback avoided by short, neutral wording) */
  alt: string;
  /** true = AI-generated illustration, false = documentary photo */
  illustrative: boolean;
  credit?: { author: string; license: string; url: string };
}

export const IMAGES = {
  'hero-coast': { src: heroCoast, alt: 'Aerial view of the Cretan coastline with villas at sunrise', illustrative: true },
  'villa-pool': { src: villaPool, alt: 'Mediterranean villa with an infinity pool at golden hour', illustrative: true },
  hospitality: { src: hospitality, alt: 'Boutique hotel reception opening onto a pool terrace', illustrative: true },
  inspection: { src: inspection, alt: 'Property manager inspecting a villa terrace with a tablet', illustrative: true },
  commercial: { src: commercial, alt: 'Modern mixed-use commercial building with a limestone facade', illustrative: true },
  residential: { src: residential, alt: 'Bright apartment living room with a balcony and sea view', illustrative: true },
  chania: { src: chania, alt: 'The Venetian harbour of Chania and its lighthouse at blue hour', illustrative: true },
  rethymno: {
    src: rethymno,
    alt: 'The ramparts of the Fortezza in Rethymno',
    illustrative: false,
    credit: { author: 'Jebulon', license: 'CC0 1.0', url: 'https://commons.wikimedia.org/wiki/File:Fortezza_Rethymno_remparts.jpg' },
  },
  heraklion: { src: heraklion, alt: 'The Venetian Koules fortress at the entrance to Heraklion harbour', illustrative: true },
} satisfies Record<string, SiteImage>;

export type ImageKey = keyof typeof IMAGES;

export const SERVICE_IMAGE: Record<ServiceSlug, ImageKey> = {
  'short-term-rental-management': 'villa-pool',
  'long-term-rental-management': 'residential',
  'commercial-property-management': 'commercial',
  'hotel-hospitality-management': 'hospitality',
  'property-maintenance': 'inspection',
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
