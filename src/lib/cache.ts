/**
 * Public pages: let Vercel's CDN serve a cached copy for a minute and keep
 * serving it for up to a day while it refreshes in the background. Panel
 * edits show up on the site within about a minute.
 */
export function setPublicCache(headers: Headers): void {
  if (import.meta.env.DEV) return;
  headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400');
}
