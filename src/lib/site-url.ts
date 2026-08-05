/**
 * The canonical site origin, shared by the root metadataBase and the sitemap
 * so the two can never drift. Prefers an explicit NEXT_PUBLIC_SITE_URL, then
 * the Vercel-provided production URL, then localhost for local dev.
 */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}
