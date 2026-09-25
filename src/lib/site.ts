/**
 * Canonical site origin used for all SEO metadata (canonical URLs, Open Graph,
 * sitemap, robots). Single source of truth — do not read VERCEL_URL here (it is
 * a bare, per-deployment host that would make canonicals unstable). No trailing
 * slash.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://project-jilebi.vercel.app'
