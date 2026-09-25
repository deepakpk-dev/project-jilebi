# PLAN: Fix broken SEO metadata and add discoverability plumbing (sitemap, robots, JSON-LD)

**Rank: 3 of 5.**

## Goal

The site is live at `project-jilebi.vercel.app`, but `src/app/[locale]/layout.tsx:24` hardcodes `metadataBase: new URL('https://jilebi.example')` — a placeholder. Every canonical, Open Graph, and hreflang URL the site emits points at a domain that doesn't exist. There is also no `sitemap.xml`, no `robots.txt` (so `/de/admin` and `/en/admin` are crawlable), no `x-default` hreflang, no OG image, and no structured data for what is literally a restaurant (schema.org/Restaurant drives Google's rich results for local dining).

For a restaurant site — and for a portfolio piece reviewed by recruiters — discoverability *is* the product. Fix the base URL, add sitemap/robots/JSON-LD, and keep everything driven by one env var.

## Files to touch

| File | Change |
|---|---|
| `src/lib/site.ts` | **New** — single source of truth for the site URL |
| `src/app/[locale]/layout.tsx` | Real `metadataBase`, canonical + `x-default`, OG url/image |
| `src/app/sitemap.ts` | **New** — must live at `src/app/`, NOT under `[locale]` |
| `src/app/robots.ts` | **New** — same location rule |
| `src/app/[locale]/page.tsx` | JSON-LD `Restaurant` script |
| `.env.local.example` | Document `NEXT_PUBLIC_SITE_URL` |
| `README.md` | Add the env var to the config table |

## Implementation order

### Step 1 — `src/lib/site.ts`

```ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://project-jilebi.vercel.app'
```

One fallback, no trailing slash. Do not use `VERCEL_URL` (it's a bare host without protocol and varies per preview deployment, which would make canonicals unstable).

### Step 2 — `.env.local.example` and README

Append to `.env.local.example`:

```
NEXT_PUBLIC_SITE_URL=https://project-jilebi.vercel.app
```

Add a row to the README "Configure Environment" table: `NEXT_PUBLIC_SITE_URL` — canonical site origin used for SEO metadata (sitemap, canonical URLs, Open Graph).

### Step 3 — fix `generateMetadata` in `src/app/[locale]/layout.tsx`

Replace the current return with (import `SITE_URL` from `@/lib/site`):

```ts
return {
  metadataBase: new URL(SITE_URL),
  title: { default: t('title'), template: '%s · Jilebi' },
  description: t('description'),
  openGraph: {
    title: t('title'),
    description: t('description'),
    siteName: 'Jilebi',
    url: `/${locale}`,
    images: ['/hero.jpg'],
    locale: locale === 'de' ? 'de_DE' : 'en_GB',
    alternateLocale: locale === 'de' ? 'en_GB' : 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: t('title'),
    description: t('description'),
    images: ['/hero.jpg'],
  },
  alternates: {
    canonical: `/${locale}`,
    languages: {
      de: '/de',
      en: '/en',
      'x-default': '/de',
    },
  },
}
```

Relative paths are resolved against `metadataBase` — keep them relative. `x-default` points at `/de` because the root redirect is deterministic-to-German (README "Trade-Offs" section).

### Step 4 — `src/app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const page = (path: string, priority: number) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
    alternates: {
      languages: {
        de: `${SITE_URL}/de${path.replace(/^\/(de|en)/, '')}`,
        en: `${SITE_URL}/en${path.replace(/^\/(de|en)/, '')}`,
      },
    },
  })

  return [
    page('/de', 1),
    page('/en', 1),
    page('/de/impressum', 0.3),
    page('/en/impressum', 0.3),
    page('/de/datenschutz', 0.3),
    page('/en/datenschutz', 0.3),
  ]
}
```

Do **not** list admin pages. Sitemap URLs must be absolute (this is one place `metadataBase` does not apply).

### Step 5 — `src/app/robots.ts`

```ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/de/admin', '/en/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

### Step 6 — JSON-LD in `src/app/[locale]/page.tsx`

Add a script inside the returned `<main>` (server component — no client boundary needed). Use the same placeholder contact data the Footer displays (the footer carries a "Portfolio demo · contact details are placeholders" notice — check `src/components/sections/Footer.tsx` and copy its exact address/phone strings so the structured data never contradicts the visible page):

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Jilebi',
  servesCuisine: 'Indian',
  url: `${SITE_URL}/${locale}`,
  image: `${SITE_URL}/hero.jpg`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nürtingen',
    addressCountry: 'DE',
    // streetAddress / postalCode: copy verbatim from Footer.tsx
  },
  acceptsReservations: 'True',
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '12:00', closes: '14:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '18:00', closes: '22:00' },
  ],
}

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

Opening hours come from the seed data (`001_initial_schema.sql`: Tue–Sun, 12–14 and 18–22, Monday closed) and match the footer's `lunch_hours`/`dinner_hours` strings.

## Edge cases a weaker model would miss

1. **`sitemap.ts` and `robots.ts` must sit at `src/app/`, not `src/app/[locale]/`.** Under `[locale]` they'd generate `/de/sitemap.xml` and be invisible at the root. There is no root-level conflict: `src/app/page.tsx` exists (the redirect page) but sitemap/robots are metadata routes, not pages.
2. **The next-intl middleware won't intercept them.** The matcher `'/((?!api|_next|_vercel|.*\\..*).*)'` excludes any path containing a dot, so `/sitemap.xml` and `/robots.txt` bypass locale routing. No middleware change needed — but verify with curl (acceptance below) since this is the kind of thing that silently 404s.
3. **Relative vs absolute URLs:** `alternates`/`openGraph` in `generateMetadata` resolve against `metadataBase`, but `MetadataRoute.Sitemap` and the `sitemap:` field in robots need fully absolute URLs. Mixing that up produces `https://site//de` or relative entries crawlers reject.
4. **`JSON.stringify` inside `dangerouslySetInnerHTML` is safe here** because every value is a hardcoded literal — but do not interpolate any user/db-derived string into `jsonLd` without escaping `<` (script-context injection). Keep it static.
5. **Keep structured data consistent with the visible page.** Google flags markup that contradicts page content. That's why the address/phone must be copied from `Footer.tsx` verbatim, and hours from the same strings the footer renders — not invented.
6. **`NEXT_PUBLIC_` prefix matters:** the value is compile-time inlined; a plain `SITE_URL` env var would be `undefined` in any client-evaluated context and can diverge between server and client builds. Also set the real value in the Vercel project env, not just `.env.local`.
7. **Don't touch `src/app/layout.tsx` (the root passthrough) or move metadata there** — the locale layout must own metadata so `title`/`description` localize per route.
8. **The e2e viewport test** (`Hero section › desktop CTAs`) asserts layout in the first 720px — the JSON-LD `<script>` renders nothing visually, but put it *after* the visible sections inside `<main>` to be safe against any hydration-order quirk.

## Acceptance criteria

- [ ] `npm run lint`, `npm test`, `npm run build` all pass; `npm run test:e2e` still passes.
- [ ] `curl -s localhost:3000/sitemap.xml` returns XML with exactly 6 URLs, all starting `https://project-jilebi.vercel.app` (or `NEXT_PUBLIC_SITE_URL` if set), none containing `admin`.
- [ ] `curl -s localhost:3000/robots.txt` shows `Disallow: /de/admin`, `/en/admin`, `/api/` and the absolute `Sitemap:` line.
- [ ] `curl -s localhost:3000/de | grep -o '<link rel="canonical"[^>]*'` shows the real domain, not `jilebi.example`; the page also contains `hreflang="x-default"`.
- [ ] `grep -r "jilebi.example" src/` returns nothing.
- [ ] View-source of `/de` contains one `application/ld+json` block that parses as valid JSON (`python3 -c 'import json,sys; json.loads(sys.stdin.read())'` on the extracted block) with `"@type": "Restaurant"`.
- [ ] `/en` metadata shows `og:locale` `en_GB` and canonical `/en`.
