/**
 * POST /api/lead/ — property-assessment requests from the website.
 *
 * Runs on the server (not pre-rendered). Validates input, applies basic
 * anti-spam checks, then delivers the lead to:
 *   1. Airtable (AIRTABLE_TOKEN + AIRTABLE_BASE_ID + AIRTABLE_TABLE), and/or
 *   2. a webhook (LEAD_WEBHOOK_URL), e.g. an n8n flow that emails the team.
 * Secrets are read from the server environment only — never shipped to the browser.
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const LOCALES = ['en', 'he', 'el', 'fr', 'de', 'nl', 'ru', 'zh-cn'] as const;
const SERVICES = [
  'short-term-rental-management', 'long-term-rental-management', 'commercial-property-management',
  'hotel-hospitality-management', 'property-maintenance', 'asset-management', 'property-marketing-sales',
] as const;

const Lead = z.object({
  locale: z.enum(LOCALES).default('en'),
  propertyType: z.enum(['short-term', 'long-term', 'commercial', 'hospitality', 'not-sure']),
  units: z.coerce.number().int().min(1).max(500).default(1),
  location: z.enum(['chania', 'rethymno', 'heraklion', 'other']),
  area: z.string().trim().max(120).optional().default(''),
  status: z.enum(['rented', 'vacant', 'renovation', 'managed']).optional(),
  services: z.union([z.array(z.enum(SERVICES)), z.enum(SERVICES)]).optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
  goals: z.string().trim().max(2000).optional().default(''),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).regex(/^[+()\d\s.-]*$/).optional().default(''),
  preferred: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  consent: z.literal('yes'),
  source: z.string().max(1500).optional().default('{}'),
  startedAt: z.coerce.number().optional(),
  website: z.string().max(500).optional().default(''), // honeypot: real users leave it empty
});

// Very small in-memory rate limit (per process): 5 submissions / 10 min / IP.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  const site = import.meta.env.SITE as string | undefined;
  const allowed = [site, 'http://localhost:4321', process.env.EXTRA_ALLOWED_ORIGIN].filter(Boolean).map((u) => new URL(u!).origin);
  if (origin && !allowed.includes(origin)) return json(403, { ok: false, error: 'FORBIDDEN' });

  let ip = 'unknown';
  try { ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress; } catch {}
  if (limited(ip)) return json(429, { ok: false, error: 'RATE_LIMITED' });

  let raw: unknown;
  try {
    raw = request.headers.get('content-type')?.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json(400, { ok: false, error: 'BAD_REQUEST' });
  }

  const parsed = Lead.safeParse(raw);
  if (!parsed.success) return json(422, { ok: false, error: 'VALIDATION_ERROR', fields: parsed.error.issues.map((i) => i.path.join('.')) });
  const lead = parsed.data;

  // Bots: honeypot filled, or the form was submitted implausibly fast. Pretend success.
  if (lead.website || (lead.startedAt && Date.now() - lead.startedAt < 2500)) return json(200, { ok: true });

  const record = {
    Name: lead.name,
    Email: lead.email,
    Phone: lead.phone,
    'Preferred Contact': lead.preferred,
    'Property Type': lead.propertyType,
    Units: lead.units,
    Location: lead.location,
    Area: lead.area,
    'Current Status': lead.status ?? '',
    Services: lead.services.join(', '),
    Goals: lead.goals,
    Locale: lead.locale,
    Source: lead.source,
    Consent: true,
    'Consent At': new Date().toISOString(),
    Status: 'New',
  };

  const tasks: Promise<Response>[] = [];
  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE = 'Leads', LEAD_WEBHOOK_URL } = process.env;
  if (AIRTABLE_TOKEN && AIRTABLE_BASE_ID) {
    tasks.push(fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields: record }], typecast: true }),
    }));
  }
  if (LEAD_WEBHOOK_URL) {
    tasks.push(fetch(LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }));
  }
  if (!tasks.length) {
    console.error('[lead] No delivery target configured (AIRTABLE_* or LEAD_WEBHOOK_URL).');
    return json(503, { ok: false, error: 'NOT_CONFIGURED' });
  }

  const results = await Promise.allSettled(tasks);
  const delivered = results.some((r) => r.status === 'fulfilled' && r.value.ok);
  results.forEach((r, k) => {
    if (r.status === 'rejected') console.error(`[lead] target ${k} failed:`, String(r.reason));
    else if (!r.value.ok) console.error(`[lead] target ${k} HTTP ${r.value.status}`);
  });
  return delivered ? json(200, { ok: true }) : json(502, { ok: false, error: 'DELIVERY_FAILED' });
};

export const ALL: APIRoute = () => json(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
