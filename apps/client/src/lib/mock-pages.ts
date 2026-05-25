/**
 * Registry of owner-portal pages whose backend is still mock or whose
 * external integration is not yet configured. The AppLayout reads this
 * and renders a PreviewBanner above the page content so owners are never
 * misled by fake data.
 *
 * To "release" a page once its backend is fully wired, remove its entry.
 */

export type MockVariant = 'preview' | 'coming-soon' | 'degraded';

export interface MockPageEntry {
  route: string;
  variant: MockVariant;
  label?: string;
  description?: string;
}

export const MOCK_PAGES: MockPageEntry[] = [
  {
    route: '/affiliate',
    variant: 'preview',
    label: 'Preview — Affiliate program',
    description: 'Your affiliate link and earnings will appear here once tracking is enabled.',
  },
  {
    route: '/messages',
    variant: 'preview',
    label: 'Preview — Messages',
    description: 'In-portal messaging with Sivan’s team is being wired up.',
  },
  {
    route: '/calendar',
    variant: 'preview',
    label: 'Preview — My Calendar',
    description: 'Live calendar view for your properties is in progress.',
  },
  {
    route: '/approvals',
    variant: 'preview',
    label: 'Preview — Pending Approvals',
    description: 'Approval queue is being connected to real expense and reservation data.',
  },
  {
    route: '/portfolio',
    variant: 'preview',
    label: 'Preview — Portfolio Overview',
    description: 'Portfolio aggregation across multiple properties is on the roadmap.',
  },
  {
    route: '/settings',
    variant: 'preview',
    label: 'Preview — Owner Settings',
    description: 'Most settings save locally only — full sync arrives in a later release.',
  },
];

export function findMockPage(pathname: string): MockPageEntry | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return (
    MOCK_PAGES.find((p) => p.route === normalized) ||
    MOCK_PAGES.find((p) => normalized.startsWith(p.route + '/'))
  );
}
