/** Legal page slugs → dictionary keys in legal.json. */
export const LEGAL_DOCS = {
  'privacy-policy': 'privacy',
  'cookie-policy': 'cookies',
  terms: 'terms',
  'company-information': 'imprint',
  'image-credits': 'credits',
  'accessibility-statement': 'accessibility',
} as const;
export type LegalSlug = keyof typeof LEGAL_DOCS;
