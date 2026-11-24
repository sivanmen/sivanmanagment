/**
 * Verified company facts, supplied by the owner (16 Nov 2026).
 * Single source of truth for footer, contact page, imprint and JSON-LD.
 *
 * Deliberately NOT published on the website: bank name/address, IBAN, SWIFT.
 * (Bank details are shared with clients privately, in agreements and invoices.)
 */
export const COMPANY = {
  brand: 'Sivan Management',
  legalName: 'Sivan Menahem Management',
  founder: 'Sivan Menahem',
  vat: 'EL802555027',
  afm: '802555027',
  gemi: '178525658000', // confirmed by the owner on 24 Nov 2026 (from the G.E.MI. certificate; 178690758000 was a mistake)
  taxOffice: 'Δ.Ο.Υ. Χανίων',
  address: {
    street: 'Plateia Eleftherias 2',
    streetGreek: 'Πλατεία Ελευθερίας 2',
    postalCode: '73132',
    city: 'Chania',
    region: 'Crete',
    country: 'Greece',
    countryCode: 'GR',
  },
  /** Approximate coordinates of Plateia Eleftherias, Chania (for maps / schema). */
  geo: { lat: 35.5133, lng: 24.0217 },
  phone: '+306983924820',
  phoneDisplay: '+30 698 392 4820',
  whatsapp: '306983924820',
  /** Second WhatsApp line (Israel), shown on the contact page — added by the owner 24 Nov 2026. */
  whatsappAlt: '972524518134',
  whatsappAltDisplay: '+972 52-451-8134',
  email: 'support@sivanmanagment.com',
  ownerPortalUrl: 'https://client.sivanmanagment.com',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Plateia+Eleftherias+2,+73132+Chania,+Greece',
  areaServed: ['Chania', 'Rethymno', 'Heraklion', 'Crete'],
  /**
   * Accessibility coordinator (Israeli Service Accessibility Regulations, reg. 35).
   * Set `name` once the owner designates a person; until then the statement shows the contact channels only.
   */
  accessibility: { name: 'Sivan Menahem' as string | null, email: 'support@sivanmanagment.com', phone: '+306983924820', phoneDisplay: '+30 698 392 4820' },
  /** Date the accessibility statement was last reviewed (ISO). */
  accessibilityReviewed: '2026-11-18',
  /** Date the privacy policy was last updated (ISO). */
  privacyUpdated: '2026-11-24',
} as const;

export const SERVICE_SLUGS = [
  'short-term-rental-management',
  'long-term-rental-management',
  'commercial-property-management',
  'hotel-hospitality-management',
  'property-maintenance',
  'asset-management',
  'property-marketing-sales',
] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const LOCATION_SLUGS = ['chania', 'rethymno', 'heraklion'] as const;
export type LocationSlug = (typeof LOCATION_SLUGS)[number];
