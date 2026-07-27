import { promises as dns } from 'dns';
import { prisma } from '../prisma';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

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

export async function lookupCfZoneId(domain: string): Promise<string | null> {
  try {
    const rootDomain = domain.replace(/^www\./, '').split('.').slice(-2).join('.');
    const result = await cfRequest('GET', `/zones?name=${encodeURIComponent(rootDomain)}`) as { id: string }[] | null;
    return result?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

// Provision preview domain — just a DB write; wildcard *.CF_PREVIEW_BASE handles routing.
export async function provisionPreviewDomain(galleryId: string, slug: string): Promise<string> {
  const previewBase = process.env.CF_PREVIEW_BASE;
  if (!previewBase) throw new Error('CF_PREVIEW_BASE not configured');

  const previewDomain = `${slug}.${previewBase}`;
  await prisma.gallery.update({ where: { id: galleryId }, data: { previewDomain } });
  return previewDomain;
}

interface CfZoneResult {
  zoneId: string;
  nameservers: string[];
}

// Get or create a Cloudflare zone for the given root domain.
async function getCfZone(rootDomain: string): Promise<CfZoneResult> {
  const accountId = process.env.CF_ACCOUNT_ID;
  if (!accountId) throw new Error('CF_ACCOUNT_ID not configured');

  const existing = await lookupCfZoneId(rootDomain);
  if (existing) {
    const zone = await cfRequest('GET', `/zones/${existing}`) as { name_servers?: string[] };
    return { zoneId: existing, nameservers: zone.name_servers ?? [] };
  }

  const created = await cfRequest('POST', '/zones', {
    name: rootDomain,
    account: { id: accountId },
    jump_start: true, // Cloudflare scans + imports existing DNS so MX/SPF/etc are preserved
  }) as { id: string; name_servers?: string[] };

  return { zoneId: created.id, nameservers: created.name_servers ?? [] };
}

// Add proxied CNAME records for @ and www in the client zone, replacing any
// existing website records (A, AAAA, CNAME) at those names. MX and other
// records at other names are left untouched (preserved from jump_start scan).
async function addClientZoneDns(zoneId: string, rootDomain: string): Promise<void> {
  const fallback = process.env.CF_FALLBACK_ORIGIN ?? 'fallback.mygalleryworks.com';

  for (const name of [rootDomain, `www.${rootDomain}`]) {
    // Remove conflicting website records so our CNAME can be added cleanly
    const existing = await cfRequest(
      'GET', `/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}`,
    ) as { id: string; type: string }[] | null;

    for (const record of existing ?? []) {
      if (['A', 'AAAA', 'CNAME'].includes(record.type)) {
        await cfRequest('DELETE', `/zones/${zoneId}/dns_records/${record.id}`);
      }
    }

    await cfRequest('POST', `/zones/${zoneId}/dns_records`, {
      type: 'CNAME', name, content: fallback, proxied: true, ttl: 1,
    });
  }
}

// Add Worker routes for root and www so the gallery-router Worker intercepts all traffic.
async function addWorkerRoute(zoneId: string, rootDomain: string): Promise<void> {
  const script = process.env.CF_WORKER_SCRIPT_NAME ?? 'gallery-router';

  for (const pattern of [`${rootDomain}/*`, `www.${rootDomain}/*`]) {
    try {
      await cfRequest('POST', `/zones/${zoneId}/workers/routes`, { pattern, script });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('already')) throw err;
    }
  }
}

// Query the domain's current authoritative DNS for critical record types
// BEFORE creating the CF zone, so we have a ground truth to compare against.
async function queryPreExistingDns(rootDomain: string) {
  const [mx, txt, a, aaaa] = await Promise.allSettled([
    dns.resolveMx(rootDomain),
    dns.resolveTxt(rootDomain),
    dns.resolve4(rootDomain),
    dns.resolve6(rootDomain),
  ]);
  return {
    MX: mx.status === 'fulfilled' ? mx.value : [],
    TXT: txt.status === 'fulfilled' ? txt.value.map((t) => t.join('')) : [],
    A: a.status === 'fulfilled' ? a.value : [],
    AAAA: aaaa.status === 'fulfilled' ? aaaa.value : [],
  };
}

// Full custom domain provisioning: create CF zone, add DNS + Worker route, update DB.
// The only manual step left for the client is changing their nameservers.
export async function provisionCustomDomain(
  galleryId: string,
  domain: string,
): Promise<{ nameservers: string[]; dnsVerified: boolean; missingRecords: string[] }> {
  const rootDomain = domain.replace(/^www\./, '').split('.').slice(-2).join('.');
  console.log('[provisionCustomDomain] starting for', rootDomain, 'gallery', galleryId);

  // Step 1: capture ground truth from current authoritative nameservers
  // before we create the CF zone or touch anything.
  const preExisting = await queryPreExistingDns(rootDomain);

  // Step 2: get or create the CF zone (jump_start imports existing records)
  const { zoneId, nameservers } = await getCfZone(rootDomain);
  console.log('[provisionCustomDomain] zone ready, id:', zoneId, 'nameservers:', nameservers);

  // Step 3: read what CF actually imported so we can verify completeness
  const cfImported = await cfRequest('GET', `/zones/${zoneId}/dns_records?per_page=100`) as { type: string; content: string; priority?: number }[] | null;
  const cfRecords = cfImported ?? [];

  // Step 4: verify that critical pre-existing records are present in CF zone
  const missingRecords: string[] = [];

  for (const mx of preExisting.MX) {
    const found = cfRecords.some(
      (r) => r.type === 'MX' && r.content.toLowerCase() === mx.exchange.toLowerCase(),
    );
    if (!found) missingRecords.push(`MX: ${mx.exchange} (priority ${mx.priority})`);
  }

  for (const txt of preExisting.TXT) {
    const found = cfRecords.some(
      (r) => r.type === 'TXT' && r.content.includes(txt.substring(0, 20)),
    );
    if (!found) missingRecords.push(`TXT: ${txt.substring(0, 60)}…`);
  }

  const dnsVerified = missingRecords.length === 0;

  // Step 5: store full snapshot — ground truth + CF state + verification result
  const cfDnsSnapshot = {
    capturedAt: new Date().toISOString(),
    dnsVerified,
    missingRecords,
    preExisting,
    cfImported: cfRecords,
  };

  // Step 6: replace website records and add Worker routes
  console.log('[provisionCustomDomain] adding DNS records');
  await addClientZoneDns(zoneId, rootDomain);
  console.log('[provisionCustomDomain] adding Worker routes');
  await addWorkerRoute(zoneId, rootDomain);
  console.log('[provisionCustomDomain] updating DB');

  await prisma.gallery.update({
    where: { id: galleryId },
    data: {
      customDomain: rootDomain,
      cfZoneId: zoneId,
      cfNameservers: nameservers,
      cfDnsSnapshot: JSON.parse(JSON.stringify(cfDnsSnapshot)),
    },
  });

  console.log('[provisionCustomDomain] complete. verified:', dnsVerified, 'missing:', missingRecords);
  return { nameservers, dnsVerified, missingRecords };
}
