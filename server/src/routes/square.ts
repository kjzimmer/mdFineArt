import { Router } from 'express';
import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const SQUARE_APP_ID = process.env.SQUARE_APP_ID!;
const SQUARE_APP_SECRET = process.env.SQUARE_APP_SECRET!;
const SQUARE_ENVIRONMENT = (process.env.SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
const SQUARE_REDIRECT_URI = process.env.SQUARE_REDIRECT_URI!;
// In dev, send the user back to Vite (5173). In prod, relative redirect is fine.
const CLIENT_URL = process.env.CLIENT_URL || '';

const SQUARE_OAUTH_BASE =
  SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

// Build the OAuth redirect URL for a gallery owner to connect their Square account
router.get('/connect', requireAdmin, (req, res) => {
  const galleryId = req.gallery!.id;
  // Use X-Gallery-Hostname (set by CF Worker) to get the gallery-facing domain.
  // req.get('host') returns the Railway backend hostname, not the client-visible domain.
  const galleryHost = req.get('x-gallery-hostname') || req.get('host');
  const returnUrl = `${req.protocol}://${galleryHost}`;
  const state = Buffer.from(JSON.stringify({ galleryId, returnUrl })).toString('base64url');

  const url = new URL(`${SQUARE_OAUTH_BASE}/oauth2/authorize`);
  url.searchParams.set('client_id', SQUARE_APP_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ INVOICES_READ INVOICES_WRITE ORDERS_READ ORDERS_WRITE');
  url.searchParams.set('redirect_uri', SQUARE_REDIRECT_URI);
  url.searchParams.set('state', state);

  res.json({ url: url.toString() });
});

// OAuth callback — Square redirects here after gallery owner authorizes.
// Mounted BEFORE resolveGallery in index.ts so the fallback hostname doesn't block it.
export const squareCallbackRouter = Router();
squareCallbackRouter.get('/', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  let returnUrl = CLIENT_URL;
  let galleryId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    galleryId = decoded.galleryId;
    if (decoded.returnUrl) returnUrl = decoded.returnUrl;
  } catch {
    return res.status(400).send('Invalid state parameter');
  }

  if (error) {
    return res.redirect(`${returnUrl}/admin/config?square_error=${encodeURIComponent(error)}`);
  }

  // Exchange code for access token
  const tokenRes = await fetch(`${SQUARE_OAUTH_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Square-Version': '2024-01-18' },
    body: JSON.stringify({
      client_id: SQUARE_APP_ID,
      client_secret: SQUARE_APP_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: SQUARE_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('Square token exchange failed:', body);
    return res.redirect(`${returnUrl}/admin/config?square_error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    merchant_id: string;
  };

  // Fetch the gallery's default Square location
  const squareClient = new SquareClient({
    token: tokens.access_token,
    environment: SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  });

  let locationId: string | undefined;
  try {
    const response = await squareClient.locations.list();
    locationId = response.locations?.[0]?.id ?? undefined;
  } catch (err) {
    console.error('Failed to fetch Square locations:', err);
  }

  await prisma.gallery.update({
    where: { id: galleryId },
    data: {
      squareAccessToken: tokens.access_token,
      squareRefreshToken: tokens.refresh_token,
      squareTokenExpiresAt: new Date(tokens.expires_at),
      squareMerchantId: tokens.merchant_id,
      squareLocationId: locationId ?? null,
    },
  });

  res.redirect(`${returnUrl}/admin/config?square_connected=1`);
});

// Disconnect Square — clears stored credentials
router.delete('/connect', requireAdmin, async (req, res) => {
  await prisma.gallery.update({
    where: { id: req.gallery!.id },
    data: {
      squareAccessToken: null,
      squareRefreshToken: null,
      squareTokenExpiresAt: null,
      squareMerchantId: null,
      squareLocationId: null,
    },
  });
  res.json({ ok: true });
});

// Status — tells the frontend whether Square is connected and returns commerce settings
router.get('/status', requireAdmin, async (req, res) => {
  const gallery = await prisma.gallery.findUnique({
    where: { id: req.gallery!.id },
    select: { squareMerchantId: true, squareLocationId: true, squareTokenExpiresAt: true, taxRate: true },
  });
  res.json({
    connected: !!gallery?.squareMerchantId,
    locationId: gallery?.squareLocationId ?? null,
    expiresAt: gallery?.squareTokenExpiresAt ?? null,
    taxRate: gallery?.taxRate ?? 0,
  });
});

// Save commerce settings (tax rate, etc.)
router.patch('/settings', requireAdmin, async (req, res) => {
  const { taxRate } = req.body as { taxRate?: number };
  await prisma.gallery.update({
    where: { id: req.gallery!.id },
    data: { taxRate: Number(taxRate) || 0 },
  });
  res.json({ ok: true });
});

// Dev-only: manually inject a sandbox access token without going through OAuth
// Remove before production or guard with NODE_ENV check
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-connect', requireAdmin, async (req, res) => {
    const { accessToken } = req.body as { accessToken: string };
    if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

    const squareClient = new SquareClient({
      token: accessToken,
      environment: SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });

    let locationId: string | undefined;
    let merchantId: string | undefined;
    try {
      const locRes = await squareClient.locations.list();
      locationId = locRes.locations?.[0]?.id ?? undefined;
      const merPage = await squareClient.merchants.list();
      for await (const m of merPage) { merchantId = m.id; break; }
    } catch (err) {
      console.error('Square API error during dev-connect:', err);
    }

    await prisma.gallery.update({
      where: { id: req.gallery!.id },
      data: {
        squareAccessToken: accessToken,
        squareRefreshToken: null,
        squareTokenExpiresAt: null,
        squareMerchantId: merchantId ?? null,
        squareLocationId: locationId ?? null,
      },
    });

    res.json({ ok: true, merchantId, locationId });
  });
}

export default router;
