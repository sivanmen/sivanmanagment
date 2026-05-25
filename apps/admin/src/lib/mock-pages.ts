/**
 * Registry of admin pages whose backend is still mock or whose external
 * integration is not yet configured. The AppLayout reads this and renders
 * a PreviewBanner above the page content so the user is never misled by
 * fake data on screen.
 *
 * To "release" a page once its backend is fully wired:
 *   - remove its entry from this file, OR
 *   - change its `variant` to 'degraded' if it works but needs an API key.
 *
 * Routes use exact path strings (must match the <Route path="..."> exactly).
 */

export type MockVariant = 'preview' | 'coming-soon' | 'degraded';

export interface MockPageEntry {
  /** Exact route path as registered in App.tsx */
  route: string;
  variant: MockVariant;
  /** Optional override of the banner label */
  label?: string;
  /** One-line context shown under the label */
  description?: string;
}

export const MOCK_PAGES: MockPageEntry[] = [
  // ───── Pages whose backend is still pure mock (0 Prisma calls) ─────
  {
    route: '/automations',
    variant: 'preview',
    label: 'Preview — Automations backend not yet wired',
    description: 'Rules created here are stored locally only. DB-backed engine is on the roadmap.',
  },
  {
    route: '/iot',
    variant: 'coming-soon',
    label: 'Coming soon — IoT integration',
    description: 'Smart locks, climate sensors and energy meters will appear here once a device is paired.',
  },
  {
    route: '/scoring',
    variant: 'preview',
    label: 'Preview — Property Scoring is a static demo',
    description: 'Real quality scoring requires connected reviews + analytics data. On the roadmap.',
  },
  {
    route: '/guest-experience',
    variant: 'preview',
    label: 'Preview — Guest Experience flows not yet sending',
    description: 'Templates are saved, but live check-in flows and digital welcome books are still mock.',
  },
  {
    route: '/guest-portal-preview',
    variant: 'preview',
    label: 'Preview — sample guest portal',
    description: 'Static demo of what guests will see. No real bookings are read here.',
  },
  {
    route: '/marketing',
    variant: 'coming-soon',
    label: 'Coming soon — Marketing campaigns engine',
    description: 'Campaign builder UI is in place; sending engine and analytics arrive in a later release.',
  },
  {
    route: '/templates',
    variant: 'preview',
    label: 'Preview — Template gallery backend not connected',
    description: 'Use Notification Templates (under Settings) for editing real templates.',
  },
  {
    route: '/channels/direct-booking',
    variant: 'preview',
    label: 'Preview — Direct Booking config screen',
    description: 'The live booking engine lives at /booking-engine. This screen is being merged into it.',
  },
  {
    route: '/onboarding',
    variant: 'preview',
    label: 'Preview — Onboarding wizard',
    description: 'Walks through property setup steps; some steps still save locally only.',
  },
  {
    route: '/teams',
    variant: 'preview',
    label: 'Preview — Teams backend not yet wired',
    description: 'Team grouping over the User model is on the roadmap. Use /users for now.',
  },

  // ───── Pages that work, but depend on an external integration not yet configured ─────
  // (variant: 'degraded' — meaningful when API keys are missing in env)
];

/**
 * Look up the mock-page entry for a given pathname. Matches exactly first,
 * then falls back to prefix match (for routes with dynamic segments).
 */
export function findMockPage(pathname: string): MockPageEntry | undefined {
  // Strip trailing slash
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return (
    MOCK_PAGES.find((p) => p.route === normalized) ||
    MOCK_PAGES.find((p) => normalized.startsWith(p.route + '/'))
  );
}
