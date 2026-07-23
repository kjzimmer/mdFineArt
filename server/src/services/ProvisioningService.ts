import { prisma } from '../prisma';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const RAILWAY_GQL = 'https://backboard.railway.app/graphql/v2';

async function cfRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const token = process.env.CF_API_TOKEN;
  if (!token) throw new Error('CF_API_TOKEN not configured');

  const res = await fetch(`${CF_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json() as { success: boolean; result?: unknown; errors?: { message: string }[] };
  if (!json.success) throw new Error(json.errors?.[0]?.message ?? 'Cloudflare API error');
  return json.result;
}

export async function createCloudflareCname(slug: string): Promise<void> {
  const zoneId = process.env.CF_ZONE_ID?.trim();
  const target = process.env.RAILWAY_CNAME_TARGET?.trim();
  if (!zoneId || !target) throw new Error('CF_ZONE_ID or RAILWAY_CNAME_TARGET not configured');

  try {
    await cfRequest('POST', `/zones/${zoneId}/dns/records`, {
      type: 'CNAME',
      name: slug,
      content: target,
      proxied: false,
      ttl: 1,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes('already exists')) throw err;
  }
}

export async function lookupCfZoneId(domain: string): Promise<string | null> {
  try {
    const rootDomain = domain.replace(/^www\./, '').split('.').slice(-2).join('.');
    const result = await cfRequest('GET', `/zones?name=${encodeURIComponent(rootDomain)}`) as { id: string }[] | null;
    return result?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function addRailwayDomain(domain: string): Promise<void> {
  const { RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, RAILWAY_ENVIRONMENT_ID } = process.env;
  if (!RAILWAY_API_TOKEN || !RAILWAY_SERVICE_ID || !RAILWAY_ENVIRONMENT_ID) {
    throw new Error('Railway API credentials not configured');
  }

  const res = await fetch(RAILWAY_GQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation customDomainCreate($input: CustomDomainCreateInput!) {
          customDomainCreate(input: $input) {
            id
            domain
          }
        }
      `,
      variables: {
        input: { domain, serviceId: RAILWAY_SERVICE_ID, environmentId: RAILWAY_ENVIRONMENT_ID },
      },
    }),
  });

  const json = await res.json() as { data?: unknown; errors?: { message: string }[] };
  if (json.errors?.length) {
    const msg = json.errors[0].message;
    if (!msg.toLowerCase().includes('already')) throw new Error(msg);
  }
}

export async function provisionPreviewDomain(galleryId: string, slug: string): Promise<string> {
  const previewBase = process.env.CF_PREVIEW_BASE;
  if (!previewBase) throw new Error('CF_PREVIEW_BASE not configured');

  const previewDomain = `${slug}.${previewBase}`;

  await createCloudflareCname(slug);
  await addRailwayDomain(previewDomain);

  await prisma.gallery.update({
    where: { id: galleryId },
    data: { previewDomain },
  });

  return previewDomain;
}
