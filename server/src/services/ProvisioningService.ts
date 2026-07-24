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

export async function lookupCfZoneId(domain: string): Promise<string | null> {
  try {
    const rootDomain = domain.replace(/^www\./, '').split('.').slice(-2).join('.');
    const result = await cfRequest('GET', `/zones?name=${encodeURIComponent(rootDomain)}`) as { id: string }[] | null;
    return result?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

interface RailwayDns {
  cnameTarget: string;
  txtValue: string;
}

export async function addRailwayDomain(domain: string): Promise<RailwayDns | null> {
  const { RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, RAILWAY_ENVIRONMENT_ID, RAILWAY_PROJECT_ID } = process.env;
  if (!RAILWAY_API_TOKEN || !RAILWAY_SERVICE_ID || !RAILWAY_ENVIRONMENT_ID || !RAILWAY_PROJECT_ID) {
    throw new Error(`Railway API credentials not configured (missing: ${[
      !RAILWAY_API_TOKEN && 'RAILWAY_API_TOKEN',
      !RAILWAY_SERVICE_ID && 'RAILWAY_SERVICE_ID',
      !RAILWAY_ENVIRONMENT_ID && 'RAILWAY_ENVIRONMENT_ID',
      !RAILWAY_PROJECT_ID && 'RAILWAY_PROJECT_ID',
    ].filter(Boolean).join(', ')})`);
  }

  // Step 1: Create the custom domain — request minimal fields only
  // (requesting status.dnsRecords in the mutation causes Railway to return "Problem processing request")
  const createRes = await fetch(RAILWAY_GQL, {
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

  const createJson = await createRes.json() as {
    data?: { customDomainCreate: { id: string; domain: string } };
    errors?: { message: string }[];
  };

  if (createJson.errors?.length) {
    const msg = createJson.errors[0].message;
    console.log('[addRailwayDomain] create error:', msg);
    if (msg.toLowerCase().includes('already')) return null;
    throw new Error(msg);
  }

  const domainId = createJson.data!.customDomainCreate.id;
  console.log('[addRailwayDomain] created domain, id:', domainId);

  // Step 2: Query DNS records from the newly created domain
  const statusRes = await fetch(RAILWAY_GQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetCustomDomain($id: String!, $projectId: String!) {
          customDomain(id: $id, projectId: $projectId) {
            status {
              verificationToken
              dnsRecords {
                hostlabel
                recordType
                requiredValue
              }
            }
          }
        }
      `,
      variables: { id: domainId, projectId: RAILWAY_PROJECT_ID },
    }),
  });

  const statusJson = await statusRes.json() as {
    data?: {
      customDomain: {
        status: {
          verificationToken: string;
          dnsRecords: Array<{ hostlabel: string; recordType: string; requiredValue: string }>;
        };
      };
    };
    errors?: { message: string }[];
  };

  console.log('[addRailwayDomain] status response:', JSON.stringify(statusJson));

  if (statusJson.errors?.length) {
    console.error('[addRailwayDomain] status query error:', statusJson.errors[0].message);
    return null; // domain created but DNS records unavailable — caller handles
  }

  const { status } = statusJson.data!.customDomain;
  const records = status.dnsRecords;

  // Use recordType enum to identify record roles
  const cnameRecord = records.find((r) => r.recordType === 'DNS_RECORD_TYPE_CNAME');
  const txtRecord = records.find((r) => r.recordType === 'DNS_RECORD_TYPE_TXT');

  if (!cnameRecord) throw new Error(`Railway CNAME record missing — got: ${JSON.stringify(records)}`);

  return {
    cnameTarget: cnameRecord.requiredValue,
    txtValue: txtRecord?.requiredValue ?? `railway-verify=${status.verificationToken}`,
  };
}

export async function createCloudflarePreviewDns(
  slug: string,
  cnameTarget: string,
  txtValue: string,
): Promise<void> {
  const previewBase = process.env.CF_PREVIEW_BASE?.trim();
  if (!previewBase) throw new Error('CF_PREVIEW_BASE not configured');

  const zoneId = await lookupCfZoneId(previewBase);
  if (!zoneId) throw new Error(`Cloudflare zone not found for ${previewBase}`);

  console.log('[createCloudflarePreviewDns] zoneId:', zoneId, 'slug:', slug, 'target:', cnameTarget);

  try {
    await cfRequest('POST', `/zones/${zoneId}/dns/records`, {
      type: 'CNAME',
      name: slug,
      content: cnameTarget,
      proxied: false,
      ttl: 300,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes('already exists')) throw err;
  }

  try {
    await cfRequest('POST', `/zones/${zoneId}/dns/records`, {
      type: 'TXT',
      name: `_railway-verify.${slug}`,
      content: txtValue,
      ttl: 300,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes('already exists')) throw err;
  }
}

export async function provisionPreviewDomain(galleryId: string, slug: string): Promise<string> {
  const previewBase = process.env.CF_PREVIEW_BASE;
  if (!previewBase) throw new Error('CF_PREVIEW_BASE not configured');

  const previewDomain = `${slug}.${previewBase}`;

  // Step 1: Register with Railway first — this gives us the unique CNAME target + TXT record
  const railwayDns = await addRailwayDomain(previewDomain);
  if (railwayDns === null) {
    console.log('[provisionPreviewDomain] Railway domain already registered:', previewDomain);
  }

  // Step 2: Persist Railway DNS values for "client manages own DNS" scenario
  if (railwayDns) {
    await prisma.gallery.update({
      where: { id: galleryId },
      data: {
        railwayCnameTarget: railwayDns.cnameTarget,
        railwayTxtValue: railwayDns.txtValue,
      },
    });
  }

  // Step 3: Create Cloudflare DNS records (non-fatal — can be done manually)
  if (railwayDns) {
    try {
      await createCloudflarePreviewDns(slug, railwayDns.cnameTarget, railwayDns.txtValue);
    } catch (err) {
      console.error(
        '[provisionPreviewDomain] CF DNS failed (non-fatal):',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Step 4: Set previewDomain on gallery
  await prisma.gallery.update({
    where: { id: galleryId },
    data: { previewDomain },
  });

  return previewDomain;
}
