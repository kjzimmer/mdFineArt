/**
 * Gallery Router Worker
 *
 * Deploy this to any client zone in your Cloudflare account.
 * Add a route: *clientdomain.com/* → this worker
 *
 * It re-fetches the request via fallback.mygalleryworks.com so Railway
 * sees a wildcard-matching SNI, while preserving the original hostname
 * in X-Forwarded-Host so Express resolves the correct gallery.
 */

const FALLBACK_ORIGIN = 'fallback.mygalleryworks.com';

export default {
  async fetch(request) {
    const originalUrl = new URL(request.url);

    // Point the request at the fallback origin (Railway wildcard SNI match)
    const targetUrl = new URL(request.url);
    targetUrl.hostname = FALLBACK_ORIGIN;

    const headers = new Headers(request.headers);
    // Custom header — Cloudflare won't overwrite this unlike X-Forwarded-Host
    headers.set('X-Gallery-Hostname', originalUrl.hostname);

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      redirect: 'manual',
    });

    return fetch(proxyRequest);
  },
};
