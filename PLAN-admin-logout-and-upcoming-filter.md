# PLAN: Admin logout + upcoming-only reservation view

**Rank: 5 of 5.**

## Goal

Two operator-hygiene gaps in the admin dashboard:

1. **`logoutAdmin()` in `src/lib/auth.ts:82-92` is dead code.** There is no `/api/admin/logout` route and no logout button, so an admin on a shared device is signed in until the 8-hour cookie expires, with no way out short of clearing cookies manually.
2. **The dashboard loads every reservation ever, unbounded** (`admin/page.tsx:27-30` has no date filter). After a few months the default view is dominated by history, the query grows without limit, and the thing staff actually need — today and the coming days — is buried.

Add a logout endpoint + button, and make the dashboard default to upcoming reservations with an "all" toggle via a query param.

## Files to touch

| File | Change |
|---|---|
| `src/app/api/admin/logout/route.ts` | **New** POST route |
| `src/app/api/admin/logout/route.test.ts` | **New** route test |
| `src/components/admin/LogoutButton.tsx` | **New** client component |
| `src/app/[locale]/admin/page.tsx` | Render button; filter query by `searchParams` |
| `src/messages/de.json` / `src/messages/en.json` | New keys under `admin` |

## Implementation order

### Step 1 — logout route

`src/app/api/admin/logout/route.ts`, modeled on the login route's guards:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { logoutAdmin } from '@/lib/auth'
import { isSameOrigin } from '@/lib/request-security'

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return logoutAdmin()
}
```

POST only — deliberately no GET export (see edge case 1). No auth check needed: clearing a cookie is safe for anonymous callers and `logoutAdmin` is idempotent.

### Step 2 — route test

`src/app/api/admin/logout/route.test.ts` — copy the header conventions from `src/app/api/admin/reservations/route.test.ts` (note the `@jest-environment node` docblock at the top; without it NextRequest/NextResponse break under jsdom). Cases:

1. POST with no `Origin` header → 200, and the `set-cookie` response header contains `jilebi_admin_session=;` (empty value) and `Max-Age=0`.
2. POST with a mismatched `Origin` header (e.g. `https://evil.example`) → 403.

Read the cookie via `res.headers.get('set-cookie')` — string-match, don't parse.

### Step 3 — `LogoutButton.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function LogoutButton() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={loading}
      className="text-xs tracking-widest uppercase text-muted hover:text-chili transition-colors">
      {t('logout')}
    </button>
  )
}
```

Import `useRouter` from `@/i18n/navigation` (project convention — never `next/navigation`). `router.refresh()` re-runs the server component; with the cookie gone, `isAdminSession()` returns false and the page renders `<AdminLogin />` — no redirect logic needed.

### Step 4 — filter in `admin/page.tsx`

Accept and await `searchParams` (in this Next.js major it is a Promise, exactly like `params` on line 11):

```tsx
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ show?: string }>
}) {
  const { locale } = await params
  const { show } = await searchParams
  const showAll = show === 'all'
```

Compute today in the restaurant's timezone and filter (only when authorized, in the existing query):

```ts
const todayBerlin = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date())

let query = getSupabaseAdmin()
  .from('reservations')
  .select('*, time_slots(start_time, end_time)')
  .order('date', { ascending: true })
if (!showAll) query = query.gte('date', todayBerlin)
const { data: reservations, error } = await query
```

In the header row (next to the count), render the toggle with the locale-aware `Link` from `@/i18n/navigation`:

```tsx
import { Link } from '@/i18n/navigation'
// ...
<Link href={showAll ? '/admin' : '/admin?show=all'} className="text-xs text-gold hover:text-charcoal">
  {showAll ? t('show_upcoming') : t('show_all')}
</Link>
<LogoutButton />
```

### Step 5 — i18n keys

Under `admin` in **both** files:

`en.json`: `"logout": "Sign out"`, `"show_all": "Show all"`, `"show_upcoming": "Upcoming only"`
`de.json`: `"logout": "Abmelden"`, `"show_all": "Alle anzeigen"`, `"show_upcoming": "Nur anstehende"`

## Edge cases a weaker model would miss

1. **Logout must be POST, never GET.** The session cookie is `sameSite: 'lax'`, which *does* attach on top-level GET navigations — a GET logout endpoint would let any page log the admin out via `<img src>` / link (CSRF). The `isSameOrigin` check plus POST-only closes this. Note `isSameOrigin` returns `true` when the `Origin` header is absent — that's the existing project trade-off (login works the same way); don't "fix" it here.
2. **`searchParams` is a Promise in this Next.js version.** The repo's own git history has a commit "unify async params shape" — sync access throws/warns. Await it like `params`.
3. **"Today" must be Europe/Berlin, not UTC.** `new Date().toISOString().slice(0,10)` flips to the next day at 00:00 UTC — in Berlin summer that's 02:00, meaning between midnight and 02:00 local the dashboard would hide *today's* reservations. The `en-CA` locale formats as `YYYY-MM-DD`, matching the `date` column's text form. This exact trick may already exist if PLAN-admin-slot-manager was executed — if `todayBerlin` logic is already in the file, reuse it; consider extracting a shared `getBerlinToday()` into `src/lib/request-security.ts` if both plans landed.
4. **`gte` (not `gt`)** — today's reservations are the ones staff most need to see.
5. **The count label (`reservations_count`) now reflects the filtered set.** That's correct behavior (it describes what's on screen), but the toggle link must be adjacent so "12 reservations" isn't mistaken for all-time totals.
6. **The toggle must use `Link` from `@/i18n/navigation`**, not a plain `<a href="/admin?...">` — a plain anchor drops the locale prefix and lands on `/de/admin` via redirect at best, breaking on `/en/admin`.
7. **`router.refresh()` after logout, not `router.push('/')`.** Refresh re-renders the current server component into the login state and preserves the admin URL for immediate re-login. A push would also work but loses that; more importantly, *no* refresh leaves the stale authorized UI on screen while the cookie is already dead — actions would then throw `Unauthorized` confusingly.
8. **Keep `LogoutButton` out of `ReservationTable`** — the table is reused conceptually for data display; session controls belong to the page header. Also the button must be its own `'use client'` island because `admin/page.tsx` is a server component.
9. **Login route has rate limiting; logout doesn't need it** — it's unauthenticated-safe and idempotent. Don't copy the rate limiter over reflexively; it would let an attacker lock the admin out of logging out (trivial but silly).

## Acceptance criteria

- [ ] `npm run lint`, `npm test`, `npm run build` all pass; new Jest suite for logout route passes under the node environment (update CLAUDE.md's test counts).
- [ ] Logged in at `/de/admin`: an "Abmelden" control is visible; clicking it immediately shows the login form without a manual reload; devtools shows the `jilebi_admin_session` cookie removed.
- [ ] `curl -i -X POST localhost:3000/api/admin/logout` → 200 with `Set-Cookie: jilebi_admin_session=; ... Max-Age=0`.
- [ ] `curl -i -X POST -H "Origin: https://evil.example" localhost:3000/api/admin/logout` → 403.
- [ ] `curl -i localhost:3000/api/admin/logout` (GET) → 405.
- [ ] With a past-dated reservation seeded in the DB: `/de/admin` does not show it; `/de/admin?show=all` shows it; the toggle link text flips between "Alle anzeigen" / "Nur anstehende"; both work on `/en/admin` too.
- [ ] Yesterday's reservations are hidden, today's remain visible.
